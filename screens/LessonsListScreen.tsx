import { useState, useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import { lessonService, type Lesson } from '../services/lessonService';
import { useAuth } from '../contexts/AuthContext';
import type { Course, Island, Group } from '../types';

import { useSocket } from '../hooks/useSocket';
export default function LessonsListScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [islands, setIslands] = useState<Island[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [courseGroups, setCourseGroups] = useState<Group[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [expandedIslands, setExpandedIslands] = useState<Set<number>>(new Set([1]));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseEmoji, setNewCourseEmoji] = useState('📚');
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
  const [assigningGroupId, setAssigningGroupId] = useState<number | null>(null);
  const [showStartLessonModal, setShowStartLessonModal] = useState(false);
  const [selectedLessonToStart, setSelectedLessonToStart] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
  const [selectedGroupForStart, setSelectedGroupForStart] = useState<number | null>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      generateIslandsFromLessons();
      loadCourseGroups(selectedCourse);
      loadBooks(selectedCourse);
    } else {
      setBooks([]);
    }
  }, [selectedCourse, lessons]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupProgress(selectedGroup);
    }
  }, [selectedGroup]);

  const loadData = async () => {
    // Wait until the teacher is hydrated — avoids firing /courses?teacherId= (empty -> 400)
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);

      // Load courses
      const coursesResponse = await fetch(`/kids-api/courses?teacherId=${user.id}`);
      const coursesData = await coursesResponse.json();
      if (coursesData.success) {
        setCourses(coursesData.data);
      }

      // Load groups for teacher
      if (user?.id) {
        const groupsResponse = await fetch(`/kids-api/groups?teacherId=${user.id}`);
        const groupsData = await groupsResponse.json();
        if (groupsData.success) {
          setGroups(groupsData.data);
          if (groupsData.data.length > 0) {
            setSelectedGroup(groupsData.data[0].id);
          }
        }
      }

      // Load all lessons
      const data = await lessonService.getLessons();
      const sorted = data.sort((a, b) => {
        const islandDiff = (a.islandId || 0) - (b.islandId || 0);
        if (islandDiff !== 0) return islandDiff;
        return (a.orderIndex || a.order_index || 0) - (b.orderIndex || b.order_index || 0);
      });
      setLessons(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateIslandsFromLessons = () => {
    if (!selectedCourse) return;

    const courseLessons = lessons.filter(l => l.courseId === selectedCourse);

    // Группируем уроки по island_id
    const islandMap = new Map<number, Lesson[]>();
    courseLessons.forEach(lesson => {
      const islandId = lesson.islandId || 1;
      if (!islandMap.has(islandId)) {
        islandMap.set(islandId, []);
      }
      islandMap.get(islandId)!.push(lesson);
    });

    // Создаём острова из уроков
    const generatedIslands: Island[] = Array.from(islandMap.keys())
      .sort((a, b) => a - b)
      .map(islandNum => ({
        id: `island-${islandNum}`,
        title: `Unit ${islandNum}`,
        description: `Lessons for Unit ${islandNum}`,
        status: 'available' as const,
        position: { x: 0, y: 0 },
        stages: [],
        totalPoints: 0,
        island_number: islandNum,
        name: `Unit ${islandNum}`,
        emoji: getIslandEmoji(islandNum),
        lesson_count: islandMap.get(islandNum)!.length,
      }));

    setIslands(generatedIslands);
  };

  const getIslandEmoji = (islandNumber: number): string => {
    const emojis = ['🏝️', '🌴', '🏖️', '🌊', '🏔️', '🌋', '🗻', '⛰️', '🏞️', '🏜️'];
    return emojis[(islandNumber - 1) % emojis.length] || '🏝️';
  };

  const loadBooks = async (courseId: string) => {
    try {
      const res = await fetch(`/kids-api/courses/${courseId}/books`);
      const data = await res.json();
      if (data.success) setBooks(data.data);
    } catch {
      setBooks([]);
    }
  };

  const loadCourseGroups = async (courseId: string) => {
    try {
      const response = await fetch(`/kids-api/courses/${courseId}/groups`);
      const data = await response.json();
      if (data.success) {
        setCourseGroups(data.data);
      }
    } catch (err) {
      console.error('Failed to load course groups:', err);
      setCourseGroups([]);
    }
  };

  const loadGroupProgress = async (groupId: number) => {
    try {
      const response = await fetch(`/kids-api/groups/${groupId}/progress`);
      const data = await response.json();
      if (data.success) {
        const progressMap: Record<string, boolean> = {};
        data.data.forEach((item: any) => {
          progressMap[item.lesson_id] = item.is_completed;
        });
        setLessonProgress(progressMap);
      }
    } catch (err) {
      console.error('Failed to load lesson progress:', err);
    }
  };

  const completeLesson = async (lessonId: string, groupId: number) => {
    try {
      const response = await fetch(`/kids-api/groups/${groupId}/lessons/${lessonId}/complete`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // Update local progress state
        setLessonProgress(prev => ({ ...prev, [lessonId]: true }));
        alert('Урок отмечен как завершённый!');
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
      alert('Ошибка при завершении урока');
    }
  };

  const toggleIsland = (islandNumber: number) => {
    const newExpanded = new Set(expandedIslands);
    if (newExpanded.has(islandNumber)) {
      newExpanded.delete(islandNumber);
    } else {
      newExpanded.add(islandNumber);
    }
    setExpandedIslands(newExpanded);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) {
      return;
    }

    try {
      await lessonService.deleteLesson(id);
      setLessons(lessons.filter(l => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      alert('Введите название курса');
      return;
    }

    if (!user?.id) {
      alert('Не удалось определить ID учителя');
      return;
    }

    try {
      const response = await fetch('/kids-api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: user.id,
          name: newCourseName,
          description: newCourseDescription,
          emoji: newCourseEmoji,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCourses([...courses, data.data]);
        setSelectedCourse(data.data.id);
        setShowCreateCourseModal(false);
        setNewCourseName('');
        setNewCourseDescription('');
        setNewCourseEmoji('📚');
      } else {
        setError(data.error || 'Failed to create course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  };

  const handleAssignGroup = async (groupId: number) => {
    if (!selectedCourse) return;

    try {
      setAssigningGroupId(groupId);

      const response = await fetch(`/kids-api/courses/${selectedCourse}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload course groups
        await loadCourseGroups(selectedCourse);
        setShowAssignGroupModal(false);
      } else {
        alert(data.error || 'Failed to assign group');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign group');
    } finally {
      setAssigningGroupId(null);
    }
  };

  const handleRemoveGroup = async (groupId: number) => {
    if (!selectedCourse) return;
    if (!confirm('Вы уверены, что хотите удалить эту группу с курса?')) return;

    try {
      const response = await fetch(`/kids-api/courses/${selectedCourse}/groups/${groupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Reload course groups
        await loadCourseGroups(selectedCourse);
      } else {
        alert(data.error || 'Failed to remove group');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove group');
    }
  };

  const loadGroupStudents = async (groupId: number) => {
    try {
      const response = await fetch(`/kids-api/groups/${groupId}/students`);
      const data = await response.json();
      if (data.success) {
        setGroupStudents(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load group students:', err);
      setGroupStudents([]);
    }
  };

  const handleStartLesson = async (lesson: Lesson, groupId: number) => {
    if (!selectedCourse || !user?.id) return;

    console.log("[LessonsListScreen] handleStartLesson called with:", { lessonId: lesson.id, groupId, teacherId: user?.id });
    try {
      // Create a new live session
      const requestBody = { lessonId: lesson.id, groupId: groupId, teacherId: user.id };
      console.log("[LessonsListScreen] Creating live session with:", requestBody);
      const response = await fetch('/kids-api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        // If there's already an active session, use that one
        if (data.sessionId) {
          navigate(`/teacher/live-session/${data.sessionId}`);
        } else {
          alert(data.error || 'Failed to create live session');
        }
        return;
      }

      // Set current lesson for the group
      await fetch(`/kids-api/groups/${groupId}/current-lesson`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          courseId: selectedCourse
        }),
      });

      // Navigate to teacher live session page
// Send WebSocket notification to students
      if (socket && isConnected) {
        const sessionUrl = `/teacher/live-session/${data.data.id}`;

        // IMPORTANT: Teacher must join group room first!
        console.log("[LessonsListScreen] Teacher joining group room:", groupId);
        socket.emit("join-group-room", { groupId });

        // Wait a bit for room join to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("[LessonsListScreen] Sending navigate-to-lesson to students. GroupId:", groupId, "URL:", sessionUrl);
        socket.emit("navigate-to-lesson", {
          lessonId: lesson.id,
          groupId: groupId,
          url: sessionUrl,
        });
      } else {
        console.error("[LessonsListScreen] ❌ Cannot send - socket:", !!socket, "isConnected:", isConnected);
      }

      navigate(`/teacher/live-session/${data.data.id}`);
      setShowStartLessonModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start lesson');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка уроков...</p>
        </div>
      </div>
    );
  }

  const filteredLessons = selectedCourse
    ? lessons.filter(l => l.courseId === selectedCourse)
    : lessons;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
              >
                ← Назад
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Управление уроками</h1>
            </div>

            <div className="flex items-center gap-4">
              {selectedCourse && (
                <>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-semibold"
                  >
                    ← Все курсы
                  </button>
                  <span className="text-lg font-bold text-gray-700">
                    {courses.find(c => c.id === selectedCourse)?.emoji} {courses.find(c => c.id === selectedCourse)?.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {!selectedCourse ? (
          courses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Создайте свой первый курс</h2>
              <p className="text-gray-600">Курс — это набор уроков по определенной теме (например, KidsBox, Phonics)</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className="bg-white rounded-2xl shadow-lg p-8 text-left hover:shadow-xl hover:scale-105 transition-all border-2 border-transparent hover:border-purple-300"
                >
                  <div className="text-5xl mb-3">{course.emoji}</div>
                  <div className="text-xl font-bold text-gray-800">{course.name}</div>
                  {course.description && (
                    <div className="text-sm text-gray-500 mt-1">{course.description}</div>
                  )}
                </button>
              ))}
            </div>
          )
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">В этом курсе пока нет уроков</h2>
            <p className="text-gray-600 mb-6">Создайте свой первый урок для этого курса!</p>
            <button
              onClick={() => navigate('/teacher/lessons/create')}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
            >
              + Создать урок
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left sidebar - Books list */}
            <div className="col-span-4">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Учебники</h2>

                {books.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="text-sm">Нет учебников для этого курса</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {books.map((book: any) => (
                      <button
                        key={book.id}
                        onClick={() => navigate(`/course/${selectedCourse}/book/${book.id}`)}
                        className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition flex items-center gap-3"
                      >
                        <span className="text-2xl">{book.emoji || '📖'}</span>
                        <span className="font-semibold text-gray-800">{book.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right content - Course stats */}
            <div className="col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Статистика курса
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">{filteredLessons.length}</div>
                      <div className="text-sm text-gray-600 mt-1">Всего уроков</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{islands.length}</div>
                      <div className="text-sm text-gray-600 mt-1">Этапов</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">{courses.find(c => c.id === selectedCourse)?.emoji || '📚'}</div>
                      <div className="text-sm text-gray-600 mt-1">Курс</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <p className="text-gray-700 text-center font-semibold">
                      {courses.find(c => c.id === selectedCourse)?.name || 'Выберите курс'}
                    </p>
                    {courses.find(c => c.id === selectedCourse)?.description && (
                      <p className="text-gray-600 text-center text-sm mt-2">
                        {courses.find(c => c.id === selectedCourse)?.description}
                      </p>
                    )}
                  </div>

                  {/* Groups Progress */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-800">Группы на курсе</h3>
                      <button
                        onClick={() => setShowAssignGroupModal(true)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold text-sm"
                      >
                        + Назначить группу
                      </button>
                    </div>

                    {courseGroups.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                        <p>Нет групп на этом курсе</p>
                        <button
                          onClick={() => setShowAssignGroupModal(true)}
                          className="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold text-sm"
                        >
                          Назначить первую группу
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {courseGroups.map(group => {
                          const totalLessons = group.total_lessons || filteredLessons.length;
                          const completedLessons = group.completed_lessons || 0;
                          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                          const currentLesson = group.current_lesson_title || group.currentLessonTitle;

                          return (
                            <div key={group.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-800">{group.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {completedLessons} из {totalLessons} уроков пройдено
                                  </p>
                                  {currentLesson && (
                                    <p className="text-xs text-blue-600 font-semibold mt-1">
                                      📚 Текущий урок: {currentLesson}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-purple-600">{progress}%</div>
                                    <div className="text-xs text-gray-500">прогресс</div>
                                  </div>
                                  <button
                                    onClick={() => setSelectedGroup(group.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                      selectedGroup === group.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                    }`}
                                    title="Показать прогресс этой группы"
                                  >
                                    {selectedGroup === group.id ? '✓ Выбрана' : 'Выбрать'}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveGroup(group.id)}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold"
                                    title="Убрать с курса"
                                  >
                                    Удалить
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Создать новый курс</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Эмодзи курса
                </label>
                <input
                  type="text"
                  value={newCourseEmoji}
                  onChange={(e) => setNewCourseEmoji(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-2xl text-center"
                  placeholder="📚"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Название курса *
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="Например: Phonics, KidsBox Level 2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  placeholder="Краткое описание курса..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateCourseModal(false);
                  setNewCourseName('');
                  setNewCourseDescription('');
                  setNewCourseEmoji('📚');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateCourse}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Group Modal */}
      {showAssignGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Назначить группу на курс</h2>

            {groups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">У вас пока нет групп</p>
                <button
                  onClick={() => {
                    setShowAssignGroupModal(false);
                    navigate('/teacher/groups');
                  }}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition"
                >
                  Создать группу
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groups
                  .filter(g => !courseGroups.find(cg => cg.id === g.id))
                  .map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleAssignGroup(group.id)}
                      disabled={assigningGroupId === group.id}
                      className="w-full text-left px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-2 border-purple-200 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="font-semibold text-gray-800 text-lg">
                        {group.name}
                      </p>
                      {assigningGroupId === group.id && (
                        <p className="text-sm text-gray-500 mt-1">Назначение...</p>
                      )}
                    </button>
                  ))}

                {groups.filter(g => !courseGroups.find(cg => cg.id === g.id)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Все группы уже назначены на этот курс</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowAssignGroupModal(false)}
              disabled={assigningGroupId !== null}
              className="w-full mt-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Start Lesson Modal - Fullscreen */}
      {showStartLessonModal && selectedLessonToStart && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-5xl font-bold text-gray-900 mb-2">Запустить урок</h1>
                  <p className="text-2xl text-gray-700">{selectedLessonToStart.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowStartLessonModal(false);
                    setSelectedLessonToStart(null);
                    setSelectedGroupForStart(null);
                    setGroupStudents([]);
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition text-lg"
                >
                  ✕ Закрыть
                </button>
              </div>
            </div>

            <div className="max-w-6xl mx-auto">
              {!selectedGroupForStart ? (
                /* Step 1: Select Group */
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Выберите группу:</h2>
                  {courseGroups.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
                      <p className="text-gray-600 text-xl mb-6">Нет групп на этом курсе</p>
                      <button
                        onClick={() => {
                          setShowStartLessonModal(false);
                          setShowAssignGroupModal(true);
                        }}
                        className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition text-lg"
                      >
                        Назначить группу
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {courseGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            setSelectedGroupForStart(group.id);
                            loadGroupStudents(group.id);
                          }}
                          className="text-left p-8 bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-3 border-gray-200 hover:border-green-300 rounded-3xl transition transform hover:scale-105 shadow-lg hover:shadow-2xl"
                        >
                          <p className="font-bold text-gray-900 text-2xl mb-2">
                            {group.name}
                          </p>
                          <p className="text-gray-600">
                            {group.current_lesson_title ? `Текущий урок: ${group.current_lesson_title}` : 'Урок не начат'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2: Show Students and Start Button */
                <div>
                  <button
                    onClick={() => {
                      setSelectedGroupForStart(null);
                      setGroupStudents([]);
                    }}
                    className="mb-6 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition text-lg"
                  >
                    ← Назад к выбору группы
                  </button>

                  <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      Группа: {courseGroups.find(g => g.id === selectedGroupForStart)?.name}
                    </h2>

                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ученики в уроке:</h3>
                    {groupStudents.length === 0 ? (
                      <p className="text-gray-600 text-lg py-8 text-center">В группе пока нет учеников</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {groupStudents.map((student: any) => (
                          <div
                            key={student.id}
                            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl"
                          >
                            <p className="font-semibold text-gray-900">{student.name || student.username || 'Ученик'}</p>
                            <p className="text-sm text-gray-600">{student.email || ''}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleStartLesson(selectedLessonToStart, selectedGroupForStart)}
                      className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-2xl rounded-2xl transition transform hover:scale-105 shadow-xl hover:shadow-2xl"
                    >
                      🚀 Запустить урок
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
