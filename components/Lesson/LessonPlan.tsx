import { useState, useEffect } from 'react';
import type { UserRole, Activity } from '../../types';
import { soundManager } from '../../utils/sounds';
import { lessonService } from '../../services/lessonService';
import Card from '../ui/Card';

interface SubTask {
  id: string;
  title: string;
  icon?: string;
}

interface LessonPlanProps {
  role: UserRole;
  onActivitySelect?: (activityId: string) => void;
  currentActivity: string | null;
  lessonId?: string;
  islandId?: string;
  onEditActivity?: (activity: Activity | null) => void;
}

const LessonPlan = ({ role, onActivitySelect, currentActivity, lessonId, islandId, onEditActivity }: LessonPlanProps) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(currentActivity);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lessonTitle, setLessonTitle] = useState('Unit 1: Hello!');

  console.log('LessonPlan render:', { role, lessonId, islandId, isTeacher: role === 'teacher' });

  // Load lesson activities if lessonId is provided
  useEffect(() => {
    if (lessonId) {
      loadLessonData();
    } else {
      // Use default hardcoded activities
      setActivities(getDefaultActivities());
    }
  }, [lessonId]);

  const loadLessonData = async () => {
    if (!lessonId) return;

    try {
      const [lessonData, activitiesData] = await Promise.all([
        lessonService.getLesson(lessonId),
        lessonService.getActivities(lessonId),
      ]);

      setLessonTitle(lessonData.title);
      setActivities(activitiesData.map((act: any) => ({
        id: act.id,
        type: act.type,
        title: act.title,
        subtitle: act.subtitle,
        icon: getIconForType(act.type),
        status: 'pending',
        points: act.points || 0,
        contentUrl: act.contentUrl,
      })));
    } catch (err) {
      console.error('Failed to load lesson:', err);
      setActivities(getDefaultActivities());
    }
  };

  const getIconForType = (type: string): string => {
    const icons: Record<string, string> = {
      'image': '🖼️',
      'youtube': '📺',
      'wordwall': '🎮',
      'text': '📝',
      'meet-family': '👨‍👩‍👧‍👦',
      'speaking': '🗣️',
      'sounds-trainer': '🔊',
      'numbers-practice': '🔢',
      'video-song': '🎵',
      'song': '🎤',
      'games': '🎯',
    };
    return icons[type] || '📚';
  };

  const getDefaultActivities = (): Activity[] => [
    {
      id: 'meet-family',
      type: 'meet-family',
      title: 'Meet Star Family',
      subtitle: '(Знакомство с семьей Star)',
      icon: '👨‍👩‍👧‍👦',
      status: 'completed',
      points: 0,
    },
    {
      id: 'speaking',
      type: 'speaking',
      title: 'Speaking: Hello phrases',
      subtitle: 'What is your name? How are you?',
      icon: '🎧',
      status: 'pending',
      points: 0,
    },
    {
      id: 'sounds-trainer',
      type: 'sounds-trainer',
      title: 'Sounds Trainer — Lesson 1',
      subtitle: '(Тренажёр звуков)',
      icon: '🔤',
      status: 'pending',
      points: 0,
    },
    {
      id: 'numbers-practice',
      type: 'numbers-practice',
      title: 'Numbers 1-10 Practice',
      subtitle: '(Повторяем и учим цифры)',
      icon: '🎧',
      status: 'pending',
      points: 0,
      subtasks: [
        { id: 'hello-song', title: '"Hello Hello" song', icon: '▶' },
        { id: 'count-song', title: '"Let\'s Count" song', icon: '▶' },
      ],
    },
    {
      id: 'video-song',
      type: 'video-song',
      title: 'Video Song: Hello Hello',
      icon: '📺',
      status: 'pending',
      points: 0,
    },
    {
      id: 'song',
      type: 'song',
      title: 'Song: Let\'s Count 1-10',
      icon: '🎵',
      status: 'pending',
      points: 0,
    },
    {
      id: 'games',
      type: 'games',
      title: 'Games: Numbers 1-10',
      icon: '🎮',
      status: 'pending',
      points: 0,
      badges: ['Wordwall', 'Umaigra'],
    },
  ];

  const handleActivityClick = (activity: Activity) => {
    if (role === 'teacher') {
      soundManager.playClick();
      // For teachers - start editing the activity
      onEditActivity?.(activity);
    } else {
      // For students - just select the activity
      setSelectedActivity(activity.id);
      onActivitySelect?.(activity.id);
    }
  };

  const handleCreateActivity = () => {
    console.log('handleCreateActivity called', { lessonId, islandId });
    soundManager.playClick();
    // Open editor for new activity
    onEditActivity?.(null);
  };

  return (
    <Card variant="default" padding="md" rounded="2xl" className="h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{lessonTitle}</h2>
          <button className="text-gray-400 hover:text-gray-600 text-xl">⋯</button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const isCompleted = activity.status === 'completed';
          const isActive = currentActivity === activity.id;

          return (
            <div key={activity.id}>
              {/* Main Activity */}
              <button
                onClick={() => handleActivityClick(activity)}
                className="w-full p-3 rounded-xl text-left transition-all hover:bg-gray-50 flex items-center gap-3"
              >
                {/* Number Badge with Icon */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${isCompleted ? 'bg-blue-500' : 'bg-blue-400'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="text-2xl">{activity.icon}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm leading-tight">
                    {activity.title}
                  </div>
                  {activity.subtitle && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {activity.subtitle}
                    </div>
                  )}

                  {/* Badges */}
                  {activity.badges && activity.badges.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {activity.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-teal-500 text-white text-xs rounded-md font-medium"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Checkbox */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              </button>

              {/* Subtasks */}
              {activity.subtasks && activity.subtasks.length > 0 && (
                <div className="ml-12 mt-1 space-y-1">
                  {activity.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                      <span className="text-gray-400">{subtask.icon || '▶'}</span>
                      <span>{subtask.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-1">
        <div className="text-sm text-gray-700">
          Можно заработать за урок <strong>5 баллов</strong>
        </div>
        <div className="text-sm text-gray-700">
          Заработано за урок: <strong>0 из 5</strong>
        </div>
      </div>

      {/* Teacher Create Button */}
      {role === 'teacher' && (
        <button
          onClick={handleCreateActivity}
          className="w-full mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition font-semibold"
        >
          + Создать активность
        </button>
      )}
    </Card>
  );
};

export default LessonPlan;
