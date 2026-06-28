import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from '@/utils/routing-adapter';
import ActivityTemplates from './ActivityTemplates';
import { useAuth } from '../../contexts/AuthContext';
import DragTextSession from './DragTextSession';
import WordwallSession from './WordwallSession';
import { useSession } from '../../hooks/useSession';
import { useSocket } from '../../hooks/useSocket';
import type { Activity } from '../../types';
import { getActivityIcon, getActivityColor } from '../../utils/activityUtils';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useLessonData } from '../../hooks/useLessonData';
import { useLessonSync } from '../../hooks/useLessonSync';
import { useLessonActions } from '../../hooks/useLessonActions';
import { useActivityTransition } from '../../hooks/useActivityTransition';
import ActivityRenderer from './ActivityRenderer';

// Activity types with icons
const ACTIVITY_TYPES = [
  { id: 'meet-family', icon: '👨‍👩‍👧‍👦', label: 'Meet Characters', color: 'bg-purple-100' },
  { id: 'speaking', icon: '💬', label: 'Speaking Practice', color: 'bg-blue-100' },
  { id: 'sounds', icon: '🔊', label: 'Sounds Trainer', color: 'bg-green-100' },
  { id: 'numbers', icon: '🔢', label: 'Numbers Practice', color: 'bg-yellow-100' },
  { id: 'video', icon: '📹', label: 'Video Lesson', color: 'bg-red-100' },
  { id: 'song', icon: '🎵', label: 'Song Activity', color: 'bg-pink-100' },
  { id: 'game', icon: '🎮', label: 'Interactive Game', color: 'bg-indigo-100' },
  { id: 'quiz', icon: '❓', label: 'Quiz', color: 'bg-orange-100' },
];

interface LessonBuilderProps {
  lessonId?: string;
}

const LessonBuilder = ({ lessonId: lessonIdProp }: LessonBuilderProps = {}) => {
  const navigate = useNavigate();
  const { islandId: islandIdFromParams, lessonNumber } = useParams<{ islandId: string; lessonNumber: string }>();
  const [searchParams] = useSearchParams();
  // Prop takes priority over query param — avoids empty flash during router.replace() redirect
  const lessonIdFromUrl = lessonIdProp || searchParams.get('lessonId');
  const islandIdFromSearch = searchParams.get('islandId') || undefined;
  const courseIdFromUrl = searchParams.get('courseId') || undefined;
  const bookIdFromUrl = searchParams.get('bookId') || undefined;
  const unitNumberFromUrl = searchParams.get('unitNumber');
  const unitNumberParsed = unitNumberFromUrl ? parseInt(unitNumberFromUrl, 10) : undefined;
  const islandId = islandIdFromParams || islandIdFromSearch;
  const { user } = useAuth();

  // WebSocket session for live lesson
  const {
    currentActivity: sessionActivity,
    isJoined,
    isLoading: isSessionLoading,
    error: sessionError,
    createSession,
    changeActivity,
    joinSession,
    students: sessionStudents,
  } = useSession();

  // WebSocket for navigation sync
  const { socket, isConnected } = useSocket();

  //  Custom hooks for lesson management
  const lessonData = useLessonData({
    islandId,
    lessonNumber,
    lessonIdFromUrl,
    userRole: user?.role,
    userGroupId: user?.groupId,
  });

  const { currentLessonId, currentGroupId, unitTitle, activities, isLoading, setUnitTitle, setActivities } = lessonData;

  // Local state
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [sessionGroupId, setSessionGroupId] = useState<number | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [isInteractiveEnabled, setIsInteractiveEnabled] = useState(false);
  const [teacherGroups, setTeacherGroups] = useState<Array<{id: number, name: string}>>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  // Actions hook
  const lessonActions = useLessonActions({
    islandId,
    lessonNumber,
    courseId: courseIdFromUrl,
    bookId: bookIdFromUrl,
    unitNumber: unitNumberParsed,
    unitTitle,
    currentLessonId,
    currentGroupId,
    activities,
    setActivities,
    setSelectedActivity,
  });

  const { isSaving, handleSelectTemplate, handleDeleteActivity, handleEditActivity, handleSaveLesson } = lessonActions;

  // Transition hook
  const { switchActivity } = useActivityTransition({
    userRole: user?.role,
    currentLessonId,
    activities,
    isJoined,
    changeActivity,
  });

  // Sync hook
  useLessonSync({
    userRole: user?.role,
    currentLessonId,
    activities,
    selectedActivity,
    isInteractiveEnabled,
    socket,
    isConnected,
    sessionActivity,
    setSelectedActivity,
    setIsInteractiveEnabled,
    setIsTransitioning,
    setTransitionDirection,
  });

  // Drag and drop hook
  const dragAndDrop = useDragAndDrop();

  // Automatically enable view mode for students
  useEffect(() => {
    if (user?.role === 'student') {
      setIsViewMode(true);
    }
  }, [user]);

  // Check for active sessions when student is viewing interactive activities
  useEffect(() => {
    // Only check if:
    // 1. User is a student
    // 2. We're in view mode
    // 3. Selected activity is an interactive type (drag-text or wordwall)
    if (user?.role === 'student' && isViewMode &&
        (selectedActivity?.title === 'Перетаскивание слов' || selectedActivity?.title === 'Игра Wordwall')) {
      checkForActiveSession();
    }
  }, [user, isViewMode, selectedActivity]);

  // Auto-join session for students when lesson loads
  useEffect(() => {
    if (user?.role === 'student' && currentLessonId && currentGroupId && user?.displayName && !isJoined) {
      console.log('[Student] Auto-joining lesson session:', currentLessonId, 'group:', currentGroupId);
      joinSession(currentLessonId, currentGroupId, user.displayName);
    }
  }, [user, currentLessonId, currentGroupId, isJoined, joinSession]);

  const checkForActiveSession = async () => {
    if (!user?.id || user.role !== 'student') return;

    try {
      // Get student's group_id from user object or fetch it
      // Since students login, we need to get their group from the backend
      const studentResponse = await fetch(`/kids-api/students/${user.id}`);
      const studentData = await studentResponse.json();

      if (!studentData.success || !studentData.data?.groupId) {
        console.log('No group found for student');
        return;
      }

      const groupId = studentData.data.groupId;

      // Check for active sessions for this group
      const sessionResponse = await fetch(`/kids-api/sessions/active/${groupId}`);
      const sessionData = await sessionResponse.json();

      if (sessionData.success && sessionData.data) {
        const session = sessionData.data;

        // Check if the session matches current lesson
        const currentActivityIndex = activities.findIndex(a => a.id === selectedActivity?.id);

        if (session.activityIndex === currentActivityIndex) {
          console.log('Active session found:', session.id);
        }
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };



  /**
   * Renders activity content based on activity type
   */
  const renderActivityContent = (activity: Activity) => {
    return (
      <ActivityRenderer
        key={activity?.id}
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={user?.role === 'teacher'}
        lessonId={currentLessonId || undefined}
        groupId={currentGroupId || undefined}
        socket={socket}
        isConnected={isConnected}
        onEdit={handleEditActivity}
      />
    );
  };

  // Auto-slideshow component

  // В режиме просмотра показываем контент на весь экран
  if (isViewMode && selectedActivity) {
    // Для учеников - полный экран без кнопок
    if (user?.role === 'student') {
      return (
        <div className="h-screen w-screen overflow-hidden bg-white">
          {renderActivityContent(selectedActivity)}
        </div>
      );
    }

    // Для учителей - с кнопками навигации и редактирования
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 relative flex items-center justify-center p-8">
        {/* Кнопки управления в углу - только для учителей */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={() => setIsViewMode(false)}
            className="px-3 py-1.5 bg-blue-500/80 backdrop-blur text-white rounded-lg text-sm font-semibold hover:bg-blue-600/80 transition-colors shadow-lg"
          >
            ✏️ Редактировать
          </button>
          <button
            onClick={async () => {
              if (!currentLessonId) return;
              const newValue = !isInteractiveEnabled;
              try {
                await fetch(`/kids-api/lessons/${currentLessonId}/state`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isInteractiveEnabled: newValue })
                });
                setIsInteractiveEnabled(newValue);
                console.log('Interactive mode:', newValue ? 'enabled' : 'disabled');
              } catch (error) {
                console.error('Error toggling interactive mode:', error);
              }
            }}
            className={`px-3 py-1.5 backdrop-blur text-white rounded-lg text-sm font-semibold transition-colors shadow-lg ${
              isInteractiveEnabled
                ? 'bg-green-500/80 hover:bg-green-600/80'
                : 'bg-red-500/80 hover:bg-red-600/80'
            }`}
          >
            {isInteractiveEnabled ? '🔓 Интерактив ВКЛ' : '🔒 Интерактив ВЫКЛ'}
          </button>
        </div>

        {/* Навигация по активностям - только для учителя */}
        {activities.length > 1 && user?.role === 'teacher' && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => {
                const currentIndex = activities.findIndex(a => a.id === selectedActivity.id);
                if (currentIndex > 0) {
                  switchActivity(activities[currentIndex - 1], 'left');
                }
              }}
              disabled={activities.findIndex(a => a.id === selectedActivity.id) === 0 || isTransitioning}
              className="px-3 py-1.5 bg-gray-600/80 backdrop-blur text-white text-sm rounded-lg hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Назад
            </button>
            <button
              onClick={() => {
                const currentIndex = activities.findIndex(a => a.id === selectedActivity.id);
                if (currentIndex < activities.length - 1) {
                  switchActivity(activities[currentIndex + 1], 'right');
                }
              }}
              disabled={activities.findIndex(a => a.id === selectedActivity.id) === activities.length - 1 || isTransitioning}
              className="px-3 py-1.5 bg-gray-600/80 backdrop-blur text-white text-sm rounded-lg hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Далее →
            </button>
          </div>
        )}

        {/* Контент в контейнере с рамкой */}
        <div
          className={`w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isTransitioning
              ? `${transitionDirection === 'right' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'} scale-95`
              : 'translate-x-0 opacity-100 scale-100'
          }`}
          style={{
            animation: isTransitioning ? 'none' : transitionDirection === 'right' ? 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideInLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {renderActivityContent(selectedActivity)}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-purple-600">
          <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-lg font-semibold">Загрузка урока...</span>
        </div>
      </div>
    );
  }

  // Обычный режим редактирования
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex">
      {/* Left Panel - Activities List (30%) */}
      <div className="w-[30%] bg-white shadow-xl p-6 overflow-y-auto">
        {/* Mode Toggle Button - только для учителей */}
        {user?.role === 'teacher' && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsViewMode(!isViewMode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isViewMode
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isViewMode ? '👁️ Режим просмотра' : '✏️ Режим редактирования'}
              </button>
            </div>

            {/* Live Lesson Control */}
            <div className="flex items-center gap-2">
              {!isJoined ? (
                <button
                  onClick={async () => {
                    if (!currentLessonId || !currentGroupId || !user?.displayName) {
                      alert('Не удалось определить урок или группу');
                      return;
                    }
                    await createSession(currentLessonId, currentGroupId, user.displayName);

                    // Отправить студентам команду перейти на урок
                    console.log('[LessonBuilder] Checking socket - socket:', !!socket, 'isConnected:', isConnected, 'socket.connected:', socket?.connected);
                    if (socket && isConnected && socket.connected) {
                      const currentPath = window.location.pathname;
                      console.log('[LessonBuilder] ✅ Sending navigate-to-lesson to students:', currentPath, 'groupId:', currentGroupId);
                      socket.emit('navigate-to-lesson', {
                        lessonId: currentLessonId,
                        groupId: currentGroupId,
                        url: currentPath,
                      });
                    } else {
                      console.log('[LessonBuilder] ⛔ Cannot send navigate - socket not ready. Retrying in 500ms...');
                      // Retry after a short delay
                      setTimeout(() => {
                        if (socket && socket.connected) {
                          const currentPath = window.location.pathname;
                          console.log('[LessonBuilder] ✅ RETRY: Sending navigate-to-lesson to students:', currentPath, 'groupId:', currentGroupId);
                          socket.emit('navigate-to-lesson', {
                            lessonId: currentLessonId,
                            groupId: currentGroupId,
                            url: currentPath,
                          });
                        } else {
                          console.log('[LessonBuilder] ⛔ RETRY FAILED: Socket still not connected');
                        }
                      }, 500);
                    }

                    // Включить полноэкранный режим просмотра для учителя
                    setIsViewMode(true);
                  }}
                  disabled={isSessionLoading || !currentLessonId || !currentGroupId}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSessionLoading ? '⏳ Запуск...' : '🚀 Запустить урок'}
                </button>
              ) : (
                <div className="flex-1 px-4 py-2 bg-green-100 border-2 border-green-400 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-semibold">🟢 Урок запущен</span>
                    <span className="text-green-600 text-sm">
                      {sessionStudents.length} 👥
                    </span>
                  </div>
                </div>
              )}
            </div>

            {sessionError && (
              <div className="px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm">
                ⚠️ {sessionError}
              </div>
            )}
          </div>
        )}

        {/* Название урока */}
        <div className="mb-6">
          {user?.role === 'teacher' ? (
            <input
              type="text"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-gray-300 focus:border-purple-500 outline-none w-full pb-2"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-800 pb-2">
              {unitTitle}
            </h2>
          )}
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              draggable={!isViewMode && user?.role === 'teacher'}
              onDragStart={(e) => user?.role === 'teacher' ? dragAndDrop.handleDragStart(e, activity) : undefined}
              onDragOver={(e) => user?.role === 'teacher' ? dragAndDrop.handleDragOver(e, index, activities) : undefined}
              onDragLeave={user?.role === 'teacher' ? dragAndDrop.handleDragLeave : undefined}
              onDrop={(e) => {
                if (user?.role !== 'teacher') return;
                const newActivities = dragAndDrop.handleDrop(e, index, activities);
                if (newActivities) {
                  setActivities(newActivities);
                  // Persist the new order right away so it survives a refresh.
                  // Only when the lesson exists and every activity has a real UUID
                  // (unsaved temp-id activities are persisted by Save lesson instead).
                  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (currentLessonId && newActivities.every(a => a.id && UUID_RE.test(String(a.id)))) {
                    fetch(`/kids-api/lessons/${currentLessonId}/activities/reorder`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ activityIds: newActivities.map(a => a.id) }),
                    }).catch(err => console.error('Failed to persist order:', err));
                  }
                }
              }}
              onDragEnd={user?.role === 'teacher' ? dragAndDrop.handleDragEnd : undefined}
              onClick={() => user?.role === 'teacher' ? setSelectedActivity(activity) : undefined}
              className={`p-4 rounded-xl transition-all hover:shadow-md ${
                !isViewMode && user?.role === 'teacher' ? 'cursor-move' : user?.role === 'teacher' ? 'cursor-pointer' : 'cursor-default'
              } ${
                selectedActivity?.id === activity.id
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300'
                  : 'bg-gray-50 border-2 border-transparent'
              } ${
                dragAndDrop.draggedActivity?.id === activity.id
                  ? 'opacity-50 scale-95'
                  : ''
              } ${
                dragAndDrop.dragOverIndex === index && dragAndDrop.draggedActivity?.id !== activity.id
                  ? 'border-2 border-dashed border-blue-500 bg-blue-50 scale-105'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                {!isViewMode && (
                  <div className="flex items-center text-gray-400 hover:text-gray-600 cursor-move mt-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="7" cy="5" r="1.5"/>
                      <circle cx="13" cy="5" r="1.5"/>
                      <circle cx="7" cy="10" r="1.5"/>
                      <circle cx="13" cy="10" r="1.5"/>
                      <circle cx="7" cy="15" r="1.5"/>
                      <circle cx="13" cy="15" r="1.5"/>
                    </svg>
                  </div>
                )}

                {/* Activity Number & Icon */}
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${activity.isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                  <div className={`w-12 h-12 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-xl`}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                {/* Activity Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {editingTitleId === activity.id ? (
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onBlur={(e) => {
                          handleEditActivity({ ...activity, title: e.target.value });
                          setEditingTitleId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            setEditingTitleId(null);
                          }
                        }}
                        autoFocus
                        className="font-semibold text-gray-800 border-2 border-purple-500 rounded px-2 py-1 focus:outline-none"
                      />
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                        {user?.role === 'teacher' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(activity.id);
                              setEditingTitleValue(activity.title);
                            }}
                            className="text-gray-400 hover:text-purple-500 transition-colors"
                            title="Редактировать название"
                          >
                            ✏️
                          </button>
                        )}
                      </>
                    )}
                    {activity.isCompleted && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Done ✓</span>
                    )}
                  </div>
                  {activity.subtitle && (
                    <p className="text-sm text-gray-600">{activity.subtitle}</p>
                  )}
                  {activity.tags && (
                    <div className="flex gap-1 mt-1">
                      {activity.tags.map((tag, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-1 rounded-full ${
                            i === 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить "${activity.title}"?`)) {
                        handleDeleteActivity(activity.id);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить этап"
                  >
                    🗑️
                  </button>

                  {/* Completion Circle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditActivity({ ...activity, isCompleted: !activity.isCompleted });
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${
                      activity.isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-purple-500'
                    } transition-colors`}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add New Activity Button - только для учителей */}
          {user?.role === 'teacher' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span>
              <span className="font-semibold">Add Activity</span>
            </button>
          )}

          {/* Complete Lesson Button - только для учителей */}
          {user?.role === 'teacher' && activities.length > 0 && !activities.some(a => a.type === 'complete') && (
            <button
              onClick={() => {
                const completeActivity: Activity = {
                  id: `activity-${Date.now()}`,
                  type: 'complete',
                  title: '🎉 Завершить урок',
                  subtitle: 'Поздравляем! Урок пройден!',
                  isCompleted: false,
                  points: 20,
                  tags: ['Финал', 'Награда']
                };
                setActivities([...activities, completeActivity]);
                setSelectedActivity(completeActivity);
              }}
              className="w-full mt-3 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="text-2xl">🏁</span>
              <span>Добавить "Завершить урок"</span>
            </button>
          )}
        </div>

        {/* Points Summary */}
        <div className="mt-6 p-4 bg-gray-100 rounded-xl">
          <div className="text-sm text-gray-600 text-center">
            За урок можно заработать максимум <span className="font-bold text-purple-600">{activities.length * 10}</span> баллов
          </div>
        </div>

        {/* Save and Back Buttons */}
        {/* Кнопки управления */}
        <div className="mt-6 space-y-2">
          {user?.role === 'teacher' && (
            <button
              onClick={async () => {
                await handleSaveLesson();
                if (bookIdFromUrl && courseIdFromUrl) {
                  navigate(`/course/${courseIdFromUrl}/book/${bookIdFromUrl}`);
                }
              }}
              disabled={isSaving}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                isSaving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить урок'}
            </button>
          )}
          <button
            onClick={() => {
              if (bookIdFromUrl && courseIdFromUrl) {
                navigate(`/course/${courseIdFromUrl}/book/${bookIdFromUrl}`);
              } else {
                const path = window.location.pathname;
                const islandMatch = path.match(/\/island\/(island-\d+)/);
                if (islandMatch) {
                  navigate(`/island/${islandMatch[1]}`);
                } else {
                  navigate('/teacher/lessons');
                }
              }
            }}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>

      {/* Right Panel - Activity Content (70%) */}
      <div className="flex-1 p-8">
        <div className="h-full bg-white rounded-2xl shadow-xl p-8 overflow-y-auto">
          {selectedActivity ? (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className={`text-4xl ${getActivityColor(selectedActivity.type)} p-3 rounded-full`}>
                  {getActivityIcon(selectedActivity.type)}
                </span>
                {selectedActivity.title}
              </h2>

              {/* Content Area */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden" style={{ height: '65vh' }}>
                {renderActivityContent(selectedActivity)}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-2xl mb-4">
                  {user?.role === 'student' ? '⏳ Урок еще не готов' : 'Нет выбранной активности'}
                </p>
                <p>
                  {user?.role === 'student'
                    ? 'Учитель пока не добавил задания. Пожалуйста, зайдите позже.'
                    : 'Нажмите "Add Activity" чтобы добавить первую активность'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Templates Modal */}
      {showAddModal && (
        <ActivityTemplates
          onSelectTemplate={(id) => { handleSelectTemplate(id); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Group Selector Modal */}
      {showGroupSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Выберите группу
            </h2>

            {teacherGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">У вас пока нет групп</p>
                <button
                  onClick={() => {
                    setShowGroupSelector(false);
                    navigate('/teacher/groups');
                  }}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition"
                >
                  Создать группу
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {teacherGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSessionGroupId(group.id);
                      setShowGroupSelector(false);
                      setShowSession(true);
                    }}
                    className="w-full text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 rounded-xl transition transform hover:scale-105"
                  >
                    <p className="font-semibold text-gray-800 text-lg">
                      {group.name}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowGroupSelector(false)}
              className="w-full mt-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Drag Text Session Modal */}
      {showSession && selectedActivity?.title === 'Перетаскивание слов' && sessionGroupId && (
        <DragTextSession
          activityText={(selectedActivity as any).dragTextData?.text || ''}
          lessonId={currentLessonId || ''}
          activityIndex={activities.findIndex(a => a.id === selectedActivity.id)}
          groupId={sessionGroupId}
          onClose={() => setShowSession(false)}
        />
      )}

      {/* Wordwall Session Modal */}
      {showSession && selectedActivity?.title === 'Игра Wordwall' && sessionGroupId && selectedActivity.wordwallUrl && (
        <WordwallSession
          wordwallUrl={selectedActivity.wordwallUrl}
          lessonId={currentLessonId || ''}
          activityIndex={activities.findIndex(a => a.id === selectedActivity.id)}
          groupId={sessionGroupId}
          onClose={() => setShowSession(false)}
        />
      )}
    </div>
  );
};

export default LessonBuilder;