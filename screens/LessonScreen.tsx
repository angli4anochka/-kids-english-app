'use client';
import { useRouter } from 'next/navigation';
import { useSearchParams } from '@/utils/routing-adapter';
import { useState, useEffect } from 'react';


import { lessonService } from '../services/lessonService';
import { islands } from '../data/islands';
import LessonBuilder from '../components/LessonBuilder/LessonBuilder';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import { useSocket } from '../hooks/useSocket';
import StudentProgressPanel from '../components/Lesson/StudentProgressPanel';

interface LessonScreenProps {  islandId: string;  lessonNumber: string;}
const LessonScreen = ({ islandId, lessonNumber }: LessonScreenProps) => {
  const [searchParams] = useSearchParams();
  const lessonIdFromUrl = searchParams.get('lessonId');
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [isCheckingLesson, setIsCheckingLesson] = useState(true);
  const [lessonExists, setLessonExists] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groups, setGroups] = useState<Array<{id: number, name: string}>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [hasNavigatedStudents, setHasNavigatedStudents] = useState(false);
  const [liveSessionUrl, setLiveSessionUrl] = useState<string | null>(null);

  // Загружаем группы учителя
  useEffect(() => {
    const fetchGroups = async () => {
      if (user?.role !== 'teacher' || !user?.id) return;

      try {
        const response = await fetch(`/kids-api/groups?teacherId=${user.id}`);
        const data = await response.json();

        if (data.success) {
          setGroups(data.data);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchGroups();
  }, [user]);

  // Listen for teacher's live session start (for students)
  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'student') return;

    const handleNavigateToLiveSession = async ({ url }: { url: string }) => {
      console.log('[LessonScreen] ✅ Student received live session start! URL:', url);
      // Never send a student to the teacher's raw URL — resolve the student's own
      // live-session route, falling back to a sanitized URL.
      const groupId = user?.groupId || user?.group_id;
      if (groupId) {
        try {
          const r = await fetch(`/kids-api/groups/${groupId}/active-session`);
          const d = await r.json();
          if (d.success && d.data) {
            setLiveSessionUrl(`/student/live-session/${d.data.id}`);
            return;
          }
        } catch { /* fall through to sanitized url */ }
      }
      if (url) setLiveSessionUrl(url.includes('/teacher/') ? url.replace('/teacher/', '/student/') : url);
    };

    socket.on('navigate-to-lesson', handleNavigateToLiveSession);

    // Join group room to receive notifications - use groupId from user object (from DB)
    const groupId = user?.groupId || user?.group_id;

    if (groupId) {
      console.log('[LessonScreen] Student joining group room:', groupId);
      socket.emit('join-group-room', { groupId });
    } else {
      console.warn('[LessonScreen] ⚠️ Student has no groupId, cannot join group room');
    }

    return () => {
      socket.off('navigate-to-lesson', handleNavigateToLiveSession);
    };
  }, [socket, isConnected, user?.role, user?.groupId, user?.group_id]);
  // Poll for active session every 5 s so student auto-joins when teacher starts without needing a refresh
  useEffect(() => {
    if (user?.role !== 'student' || !user?.groupId) return;

    let stopped = false;

    const checkActiveSession = async () => {
      try {
        const response = await fetch(`/kids-api/groups/${user.groupId}/active-session`);
        const data = await response.json();
        if (data.success && data.data && !stopped) {
          const sessionUrl = `/student/live-session/${data.data.id}`;
          console.log('[LessonScreen] ✅ Found active session:', sessionUrl);
          setLiveSessionUrl(sessionUrl);
          stopped = true; // stop polling once found
        }
      } catch (error) {
        console.error('[LessonScreen] Error checking active session:', error);
      }
    };

    checkActiveSession(); // immediate first check
    const interval = setInterval(() => {
      if (!stopped) checkActiveSession();
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [user?.role, user?.groupId]);


  // Send navigate-to-lesson event when teacher opens lesson with lessonId
  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'teacher' || !lessonIdFromUrl || !selectedGroupId || hasNavigatedStudents) {
      return;
    }

    // Teacher opened lesson by direct URL - notify students to navigate
    const currentPath = window.location.pathname + window.location.search;
    console.log('[LessonScreen] Teacher opened lesson - sending navigate-to-lesson to students:', currentPath, 'groupId:', selectedGroupId);

    socket.emit('navigate-to-lesson', {
      lessonId: lessonIdFromUrl,
      groupId: selectedGroupId,
      url: currentPath,
    });

    setHasNavigatedStudents(true);
  }, [socket, isConnected, user?.role, lessonIdFromUrl, selectedGroupId, hasNavigatedStudents]);

  // Проверяем, существует ли урок в базе при загрузке компонента
  useEffect(() => {
    const checkLesson = async () => {
      if (!islandId) return;

      try {
        setIsCheckingLesson(true);

        // Если есть lessonId в URL - используем его напрямую
        if (lessonIdFromUrl && user?.role === 'teacher') {
          console.log('Loading lesson by ID:', lessonIdFromUrl);
          const lesson = await lessonService.getLesson(lessonIdFromUrl);
          setLessonExists(true);
          setSelectedGroupId(lesson.groupId || null);
          setShowCreateLesson(true);
          setIsCheckingLesson(false);

          // Send navigate-to-lesson event to students
          console.log('[LessonScreen] Checking navigate conditions - socket:', !!socket, 'isConnected:', isConnected, 'lesson.groupId:', lesson.groupId, 'hasNavigatedStudents:', hasNavigatedStudents);

          if (socket && isConnected && lesson.groupId && !hasNavigatedStudents) {
            const currentPath = window.location.pathname + window.location.search;
            console.log('[LessonScreen] ✅ Sending navigate-to-lesson to students:', currentPath, 'groupId:', lesson.groupId);

            socket.emit('navigate-to-lesson', {
              lessonId: lessonIdFromUrl,
              groupId: lesson.groupId,
              url: currentPath,
            });

            setHasNavigatedStudents(true);
          } else {
            console.log('[LessonScreen] ⛔ Cannot send navigate - conditions not met');
          }

          return;
        }

        const islandNumber = parseInt(islandId.replace('island-', ''));

        // Для учеников - загружаем уроки их группы
        // Для учителей - загружаем все уроки
        const groupIdFilter = user?.role === 'student' ? user.groupId : undefined;
        console.log('Checking lesson for user:', user?.displayName, 'role:', user?.role, 'groupId:', user?.groupId);
        console.log('Loading lessons with groupIdFilter:', groupIdFilter);
        const lessons = await lessonService.getLessons(groupIdFilter);
        console.log('Loaded lessons:', lessons.length, 'lessons');

        // Find lesson by both island ID and lesson number (order_index)
        const lessonNum = lessonNumber ? parseInt(lessonNumber) : 1;
        const lesson = lessons.find(l => l.islandId === islandNumber && (l as any).island_order === lessonNum);
        console.log('Found lesson for island', islandNumber, 'lesson number', lessonNum, ':', lesson ? 'YES' : 'NO');

        // ПРОВЕРКА ДОСТУПА ДЛЯ СТУДЕНТОВ: проверяем, разблокирован ли урок
        // НО разрешаем если это live lesson (есть lessonId в URL) или если урок найден в группе
        const isLiveLesson = lessonIdFromUrl !== null;
        if (user?.role === 'student' && lessonNum > 1 && !isLiveLesson && !lesson) {
          const progressKey = `${islandId}-lesson-${lessonNum}`;
          const prevProgressKey = `${islandId}-lesson-${lessonNum - 1}`;
          const isPrevCompleted = localStorage.getItem(prevProgressKey) === 'completed';

          if (!isPrevCompleted) {
            console.log('⛔ Lesson', lessonNum, 'is locked! Previous lesson not completed.');
            alert(`Урок ${lessonNum} еще не разблокирован!\nСначала пройдите урок ${lessonNum - 1}.`);
            router.push(`/island/${islandId}`);
            return;
          }
        }

        if (lesson) {
          setLessonExists(true);
          // Для учителя - сразу открываем конструктор урока
          if (user?.role === 'teacher') {
            setSelectedGroupId(lesson.groupId || null);
            setShowCreateLesson(true);
          }
        } else {
          setLessonExists(false);
          // Для учителя - сразу показываем модалку выбора группы
          if (user?.role === 'teacher') {
            setShowGroupSelector(true);
          }
        }
      } catch (error) {
        console.error('Error checking lesson:', error);
        setLessonExists(false);
      } finally {
        setIsCheckingLesson(false);
      }
    };

    checkLesson();
  }, [islandId, lessonNumber, user, lessonIdFromUrl]);

  const handleCreateLesson = async () => {
    if (isCreatingLesson || !islandId) return;

    // Если это ученик и урока нет - показываем сообщение
    if (user?.role === 'student' && !lessonExists) {
      alert('Этот урок еще не создан учителем. Пожалуйста, подождите.');
      return;
    }

    // Для учеников - просто показываем урок
    if (user?.role === 'student' && lessonExists) {
      setShowCreateLesson(true);
      return;
    }

    // Для учителей - показываем модалку выбора группы
    if (user?.role === 'teacher') {
      setShowGroupSelector(true);
    }
  };

  const handleGroupSelected = async (groupId: number) => {
    if (!islandId) return;

    setIsCreatingLesson(true);
    setShowGroupSelector(false);

    try {
      const island = islands.find((i) => i.id === islandId);
      if (!island) {
        console.error('Island not found:', islandId);
        return;
      }

      const islandNumber = parseInt(islandId.replace('island-', ''));

      // Проверяем, существует ли урок для этой группы и острова
      const lessons = await lessonService.getLessons(groupId);
      let lesson = lessons.find(l => l.islandId === islandNumber && l.groupId === groupId);

      // Если урока нет - создаем через API
      if (!lesson) {
        console.log('Creating new lesson for island', islandNumber, 'and group', groupId);
        lesson = await lessonService.createLesson({
          title: `${island.title} - Урок ${lessonNumber}`,
          islandId: islandNumber,
          emoji: island.emoji,
          groupId: groupId,
        });
      }

      setSelectedGroupId(groupId);
      // Показываем конструктор уроков
      setShowCreateLesson(true);
    } catch (error) {
      console.error('Failed to create/load lesson:', error);
      alert('Ошибка при создании урока. Попробуйте еще раз.');
    } finally {
      setIsCreatingLesson(false);
    }
  };

  // Если показываем экран создания урока - показываем LessonBuilder
  if (showCreateLesson) {
    return (
      <>
        <LessonBuilder />
        {user?.role === 'teacher' && lessonIdFromUrl && selectedGroupId && (
          <StudentProgressPanel
            socket={socket}
            isConnected={isConnected}
            totalActivities={0} // Will be updated from LessonBuilder
          />
        )}
      </>
    );
  }

  // Если это учитель с lessonId в URL и данные загружаются - показываем loading
  if (lessonIdFromUrl && user?.role === 'teacher' && isCheckingLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка урока...</p>
        </div>
      </div>
    );
  }

  // Экран с RulesMaps и кликабельным лисенком (только для студентов или новых уроков)
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(/img/RulesMaps.jpg)` }}>

      {/* Navigation buttons */}
      <div className="absolute top-8 left-8 z-20 flex gap-3">
        <button
          onClick={() => router.push(`/island/${islandId}`)}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          ← Назад
        </button>
        <button
          onClick={() => router.push('/map')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
        >
          <span>🗺️</span>
          <span>На карту</span>
        </button>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border-2 border-white/50 flex items-center gap-2"
          title="Выйти из системы"
        >
          <span>🚪</span>
          <span>Выход</span>
        </button>
      </div>

      {/* Кликабельная область для лисенка (примерно в центре) */}
      <button
        onClick={handleCreateLesson}
        disabled={isCreatingLesson}
        className="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
        style={{ background: 'transparent', border: 'none' }}
        aria-label="Нажмите на лисенка"
      />

      {/* Подсказка для учеников */}
      {user?.role === 'student' && !isCheckingLesson && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          {liveSessionUrl ? (
            <button
              onClick={() => window.location.href = liveSessionUrl}
              className="px-12 py-6 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-3xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 transition-all border-4 border-white animate-pulse"
            >
              🚀 Войти в урок
            </button>
          ) : (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 border-4 border-white rounded-2xl px-8 py-6 shadow-2xl animate-bounce">
              <p className="text-2xl font-bold text-white text-center">
                {!lessonExists ? '⚠️ Урок еще не создан учителем' : '⏳ Дождитесь начала урока'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Модалка выбора группы для учителя */}
      {showGroupSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Выберите группу
            </h2>

            {groups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">У вас пока нет групп</p>
                <button
                  onClick={() => {
                    setShowGroupSelector(false);
                    router.push('/teacher/groups');
                  }}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition"
                >
                  Создать группу
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelected(group.id)}
                    disabled={isCreatingLesson}
                    className="w-full text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isCreatingLesson}
              className="w-full mt-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonScreen;
