'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { islands } from '../data/islands';
import { useProgress } from '../hooks/useProgress';
import { useUserRole } from '../hooks/useUserRole';
import { soundManager } from '../utils/sounds';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import LessonPlan from '../components/Lesson/LessonPlan';
import ActivityEditor from '../components/Lesson/ActivityEditor';
import MeetFamilyActivity from '../components/Lesson/activities/MeetFamilyActivity';
import { lessonService } from '../services/lessonService';

import LessonFlag from '../components/Island/LessonFlag';
import { lessonFlagsData } from '../data/lessonFlags';
import { getIslandImage } from '../utils/lazyImages';
import type { Activity } from '../types';
interface IslandScreenProps {
  islandId: string;
}

const IslandScreen = ({ islandId }: IslandScreenProps) => {

  const router = useRouter();
  const { startIsland } = useProgress();
  const { role } = useUserRole();
  const { socket, isConnected } = useSocket();
  const { logout, user } = useAuth();

  const island = islands.find((i) => i.id === islandId);
  const [currentStageIndex] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<string | null>('meet-family');
  const [editingActivity, setEditingActivity] = useState<Activity | null | undefined>(undefined);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonPlanKey, setLessonPlanKey] = useState(0); // For forcing LessonPlan refresh
  const [islandImageUrl, setIslandImageUrl] = useState<string | null>(null);
  const [lessonReadyUrl, setLessonReadyUrl] = useState<string | null>(null); // URL when teacher starts lesson

  useEffect(() => {
    if (island) {
      startIsland(island.id);
      // Load island image lazily
      getIslandImage(island.id).then(url => {
        setIslandImageUrl(url);
      }).catch(err => {
        console.error('Failed to load island image:', err);
      });
    }
  }, [island?.id, startIsland]);

  // Load or create lesson for this island
  useEffect(() => {
    if (island && currentStageIndex >= 2) {
      loadOrCreateLesson();
    }
  }, [role, island?.id, currentStageIndex]);

  // Listen for navigation commands from teacher (for students)
  useEffect(() => {
    if (!socket || !isConnected || role !== 'student') return;

    // Never send a student to the teacher's raw URL. Resolve the student's own
    // live-session route via the group's active session, falling back to a
    // sanitized URL (/teacher/ -> /student/).
    const resolveStudentUrl = async (url?: string) => {
      const gid = user?.groupId || user?.group_id;
      if (gid) {
        try {
          const r = await fetch(`/kids-api/groups/${gid}/active-session`);
          const d = await r.json();
          if (d.success && d.data) {
            setLessonReadyUrl(`/student/live-session/${d.data.id}`);
            soundManager.playCorrect();
            return;
          }
        } catch { /* fall through */ }
      }
      if (url) {
        setLessonReadyUrl(url.includes('/teacher/') ? url.replace('/teacher/', '/student/') : url);
        soundManager.playCorrect();
      }
    };

    const handleNavigateToLesson = ({ url }: { url: string }) => {
      console.log('[IslandScreen] ✅ Student received lesson start notification! URL:', url);
      resolveStudentUrl(url);
    };

    const handleActiveLessonFound = ({ url }: { url: string }) => {
      console.log('[IslandScreen] ✅ Found active lesson! URL:', url);
      resolveStudentUrl(url);
    };

    socket.on('navigate-to-lesson', handleNavigateToLesson);
    socket.on('active-lesson-found', handleActiveLessonFound);

    // Join group room and check for active lessons when student first loads the screen - use user from DB
    const groupId = user?.groupId || user?.group_id;

    if (groupId) {
      console.log('[IslandScreen] Student joining group room:', groupId);
      socket.emit('join-group-room', { groupId });

      console.log('[IslandScreen] Checking for active lessons in group:', groupId);
      socket.emit('check-active-lesson', { groupId });
    } else {
      console.warn('[IslandScreen] ⚠️ Student has no groupId, cannot join group room');
    }

    return () => {
      socket.off('navigate-to-lesson', handleNavigateToLesson);
      socket.off('active-lesson-found', handleActiveLessonFound);
    };
  }, [socket, isConnected, role, router, user?.groupId, user?.group_id]);

  // Poll for active session every 5 s so student auto-joins when teacher starts without needing a refresh
  useEffect(() => {
    if (role !== 'student' || !user?.groupId) return;

    let stopped = false;

    const checkActiveSession = async () => {
      try {
        const response = await fetch(`/kids-api/groups/${user.groupId}/active-session`);
        const data = await response.json();
        if (data.success && data.data && !stopped) {
          stopped = true;
          const sessionUrl = `/student/live-session/${data.data.id}`;
          console.log('[IslandScreen] ✅ Found active session:', sessionUrl);
          setLessonReadyUrl(sessionUrl);
          soundManager.playCorrect();
        }
      } catch (error) {
        console.error('[IslandScreen] Error checking active session:', error);
      }
    };

    checkActiveSession();
    const interval = setInterval(() => { if (!stopped) checkActiveSession(); }, 5000);
    return () => { stopped = true; clearInterval(interval); };
  }, [role, user?.groupId]);

  // Handler for student clicking "Join Lesson" button
  const handleJoinLesson = () => {
    if (lessonReadyUrl) {
      soundManager.playClick();
      console.log('[IslandScreen] Student joining lesson:', lessonReadyUrl);
      // Use window.location.assign for full path navigation
      window.location.assign(lessonReadyUrl);
    }
  };

  const loadOrCreateLesson = async () => {
    if (!island) return;

    try {
      // Get groupId from user object (from DB)
      const groupId = user?.groupId || user?.group_id;

      console.log('Loading lesson for island', island.id, 'groupId:', groupId, 'from user:', user?.username);

      // Try to get lessons for this group (or all lessons if teacher)
      const lessons = await lessonService.getLessons(groupId);
      const islandNumber = parseInt(island.id.replace('island-', ''));

      // Find a lesson for this island
      let lesson = lessons.find(l => l.islandId === islandNumber);

      if (!lesson && true) {
        // Only teachers can create new lessons
        console.log('Creating new lesson for island', islandNumber);
        lesson = await lessonService.createLesson({
          title: island.title,
          islandId: islandNumber,
          emoji: island.emoji,
          groupId: groupId,
        });
      }

      if (lesson) {
        setCurrentLessonId(lesson.id);
      } else {
        console.log('No lesson found for island', islandNumber);
      }
    } catch (error) {
      console.error('Failed to load or create lesson:', error);
    }
  };

  const handleActivitySave = async (activity: Activity) => {
    if (!currentLessonId) {
      alert('Сначала нужно создать урок');
      return;
    }

    try {
      if (activity.id) {
        // Update existing activity
        await lessonService.updateActivity(currentLessonId, activity.id, {
          type: activity.type,
          title: activity.title,
          subtitle: activity.subtitle,
          contentUrl: activity.contentUrl,
          points: activity.points,
        });
        console.log('Activity updated successfully');
      } else {
        // Create new activity
        await lessonService.addActivity(currentLessonId, {
          type: activity.type,
          title: activity.title,
          subtitle: activity.subtitle,
          contentUrl: activity.contentUrl,
          points: activity.points,
        });
        console.log('Activity created successfully');
      }

      // Close editor and refresh lesson plan
      setEditingActivity(undefined);
      setLessonPlanKey(prev => prev + 1); // Force LessonPlan to reload
    } catch (error) {
      console.error('Failed to save activity:', error);
      alert('Ошибка при сохранении активности: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!island) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/img/background.webp)' }}>
        <div className="text-white text-2xl">Остров не найден</div>
      </div>
    );
  }

  // Show lesson plan component on stage 3 and beyond
  if (currentStageIndex >= 2) {
    return (
      <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat p-4" style={{ backgroundImage: 'url(/img/background.webp)' }}>
        <div className="h-full flex gap-4">
          {/* Left panel - Lesson Plan (30%) */}
          <div className="w-[30%] h-full">
            <LessonPlan
              key={lessonPlanKey}
              role={role}
              currentActivity={currentActivity}
              islandId={islandId}
              lessonId={currentLessonId || undefined}
              onActivitySelect={(activityId) => {
                setCurrentActivity(activityId);
              }}
              onEditActivity={(activity) => {
                console.log('onEditActivity called:', activity);
                setEditingActivity(activity);
              }}
            />
          </div>

          {/* Right panel - Activity Content (70%) */}
          <div className="w-[70%] h-[calc(100vh-2rem)]">
            {/* Show Activity Editor for teachers when editing */}
            {true && editingActivity !== undefined ? (
              <ActivityEditor
                activity={editingActivity}
                onSave={handleActivitySave}
                onCancel={() => {
                  console.log('Edit cancelled');
                  setEditingActivity(undefined);
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full flex items-center justify-center">
                {currentActivity === 'meet-family' && (
                  <MeetFamilyActivity />
                )}
                {currentActivity && currentActivity !== 'meet-family' && (
                  <div className="text-center p-6">
                    <h2 className="text-2xl font-bold text-purple-600 mb-4">
                      Активность: {currentActivity}
                    </h2>
                    <p className="text-gray-600">
                      Здесь будет отображаться содержимое выбранной активности
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show island image full screen with background and lesson flags
  const flags = lessonFlagsData[island.id] || [];

  // Проверяем прогресс уроков
  const getLessonStatus = (lessonNumber: number): 'locked' | 'available' | 'completed' => {
    if (role === 'teacher') return 'available';

    const progressKey = `${island.id}-lesson-${lessonNumber}`;
    const isCompleted = localStorage.getItem(progressKey) === 'completed';

    if (isCompleted) return 'completed';
    if (lessonNumber === 1) return 'available';

    const prevProgressKey = `${island.id}-lesson-${lessonNumber - 1}`;
    const isPrevCompleted = localStorage.getItem(prevProgressKey) === 'completed';
    return isPrevCompleted ? 'available' : 'locked';
  };


  const handleLessonClick = async (lessonNumber: number) => {
    console.log('=== Lesson clicked:', lessonNumber, 'on island:', island.id, 'role:', role);

    const status = getLessonStatus(lessonNumber);
    console.log('Lesson status:', status);

    if (status === 'locked') {
      console.log('Lesson is locked, playing incorrect sound');
      soundManager.playIncorrect();
      return;
    }

    soundManager.playClick();

    // Build the lesson path
    const path = `/island/${island.id}/lesson/${lessonNumber}`;
    
    // Teachers send navigate command to students via WebSocket
    if (role === 'teacher' && socket && isConnected) {
      const groupId = user?.groupId || user?.group_id;

      if (groupId) {
        console.log('[IslandScreen] Teacher sending navigate-to-lesson to students:', path, 'groupId:', groupId);
        socket.emit('navigate-to-lesson', {
          lessonId: currentLessonId,
          groupId: groupId,
          url: path,
        });

        // Wait a bit for the event to be sent before navigating
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Both teachers and students navigate to the lesson page
    // Students will see Wait for teacher message
    // Teachers will see the lesson builder/control
    console.log('[IslandScreen] Navigating to lesson:', path);
    console.log("[IslandScreen] Attempting navigation with window.location...");
    window.location.href = path;
  };
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/img/background.webp)' }}>
      {/* Navigation buttons - top left */}
      <div className="absolute top-8 left-8 z-30 flex gap-3">
        <button
          onClick={() => {
            soundManager.playClick();
            window.location.href = '/map';
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all border-3 border-white flex items-center gap-2"
        >
          <span>🗺️</span>
          <span>На карту</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            logout();
            window.location.href = '/login';
          }}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all border-3 border-white flex items-center gap-2"
          title="Выйти из системы"
        >
          <span>🚪</span>
          <span>Выход</span>
        </button>
      </div>

      {/* Island image stretched to full screen */}
      <div className="absolute inset-0 flex items-center justify-center">
        {islandImageUrl ? (
          <img
            src={islandImageUrl}
            alt={island.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="text-4xl animate-pulse">Загрузка...</div>
          </div>
        )}
      </div>

      {/* Lesson flags on top of the island */}
      <div className="absolute inset-0 z-20">
          {flags.map((flag, index) => {
            const lessonNumber = index + 1;
            const status = getLessonStatus(lessonNumber);

            return (
              <LessonFlag
                key={index}
                number={lessonNumber}
                x={flag.x}
                y={flag.y}
                status={status}
                onClick={() => handleLessonClick(lessonNumber)}
              />
            );
          })}
      {/* Student Join Lesson Button - показывается когда учитель запускает урок */}
      {role === "student" && lessonReadyUrl && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <button
            onClick={handleJoinLesson}
            className="px-12 py-6 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-3xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 transition-all border-4 border-white animate-pulse"
          >
            🚀 Войти в урок
          </button>
        </div>
      )}
        </div>

    </div>
  );
};

export default IslandScreen;
