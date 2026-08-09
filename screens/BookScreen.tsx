'use client';
import { useState, useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import type { Lesson } from '../types';

interface CourseBook {
  id: string;
  course_id: string;
  title: string;
  level_number: number;
  emoji: string;
}

interface Group {
  id: number;
  name: string;
  current_lesson_id?: string;
  current_lesson_title?: string;
}

interface BookScreenProps {
  courseId: string;
  bookId: string;
}

export default function BookScreen({ courseId, bookId }: BookScreenProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const isHskCourse = courseId === 'c0d6ff9f-5e50-44f3-b33f-991dd8f57901';
  const isStarlightCourse = courseId === '9dbfb70d-8650-4cf0-8edd-f67d79d90ea9';

  const [book, setBook] = useState<CourseBook | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, {
    is_completed: boolean;
    progress_percent: number;
    last_session_id?: string | null;
  }>>({});
  const [startingLessonId, setStartingLessonId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const [bookRes, lessonsRes, groupsRes] = await Promise.all([
          fetch(`/kids-api/books/${bookId}`),
          fetch(`/kids-api/books/${bookId}/lessons`),
          user?.id ? fetch(`/kids-api/groups?teacherId=${user.id}`) : Promise.resolve(null),
        ]);

        const bookData = await bookRes.json();
        if (bookData.success) setBook(bookData.data);

        const lessonsData = await lessonsRes.json();
        if (lessonsData.success) {
          setLessons(lessonsData.data.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
        }

        if (groupsRes) {
          const groupsData = await groupsRes.json();
          if (groupsData.success && groupsData.data.length > 0) {
            setGroups(groupsData.data);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [bookId, user?.id]);

  useEffect(() => {
    if (!selectedGroupId) {
      setLessonProgress({});
      return;
    }
    fetch(`/kids-api/groups/${selectedGroupId}/progress`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const map: Record<string, {
            is_completed: boolean;
            progress_percent: number;
            last_session_id?: string | null;
          }> = {};
          d.data.forEach((item: any) => {
            map[item.lesson_id] = {
              is_completed: item.is_completed,
              progress_percent: item.progress_percent || 0,
              last_session_id: item.last_session_id || null,
            };
          });
          setLessonProgress(map);
        }
      })
      .catch(() => {});
  }, [selectedGroupId]);

  const handleStartLesson = async (lesson: Lesson) => {
    if (!selectedGroupId || !user?.id) {
      alert('Выберите группу');
      return;
    }
    setStartingLessonId(lesson.id);
    try {
      const response = await fetch('/kids-api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, groupId: selectedGroupId, teacherId: user.id }),
      });
      const data = await response.json();

      if (!data.success) {
        if (data.sessionId) navigate(`/teacher/live-session/${data.sessionId}`);
        else alert(data.error || 'Ошибка запуска урока');
        return;
      }

      await fetch(`/kids-api/groups/${selectedGroupId}/current-lesson`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, courseId }),
      });

      if (socket && isConnected) {
        socket.emit('join-group-room', { groupId: selectedGroupId });
        await new Promise(r => setTimeout(r, 100));
        socket.emit('navigate-to-lesson', {
          lessonId: lesson.id,
          groupId: selectedGroupId,
          url: `/teacher/live-session/${data.data.id}`,
        });
      }

      navigate(`/teacher/live-session/${data.data.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setStartingLessonId(null);
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Build new order: move draggedId to where targetId is
    const newOrder = [...lessons];
    const fromIdx = newOrder.findIndex(l => l.id === draggedId);
    const toIdx = newOrder.findIndex(l => l.id === targetId);
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    // Update local state immediately (optimistic)
    setLessons(newOrder.map((l, i) => ({ ...l, order_index: i + 1 })));
    setDraggedId(null);
    setDragOverId(null);

    // Single atomic request — assigns order_index 1,2,3,... in a DB transaction
    await fetch(`/kids-api/books/${bookId}/lessons/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonIds: newOrder.map(l => l.id) }),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
      </div>
    );
  }

  const completedCount = lessons.filter(l => lessonProgress[l.id]?.is_completed).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentGroup = groups.find(g => g.id === selectedGroupId);

  // Kids Box sections are defined by unit_number: 0 Trial, 1 Phonics, 2 Kids Box 1.
  const grouped: { unitName: string | null; lessons: Lesson[] }[] = [];
  for (const lesson of lessons) {
    const isKidsBoxOne = book?.title.trim().toLowerCase() === 'kids box 1';
    const unitName = isKidsBoxOne && lesson.unit_number != null
      ? `unit-${lesson.unit_number}`
      : (lesson.unit_name ? lesson.unit_name.trim().toLowerCase() : null);
    const last = grouped[grouped.length - 1];
    if (last && last.unitName === unitName) last.lessons.push(lesson);
    else grouped.push({ unitName, lessons: [lesson] });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-semibold"
            >
              ← Назад
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {book ? `${book.emoji} ${book.title}` : 'Книга'}
            </h1>
          </div>
          <button
            onClick={() => navigate(`/teacher/lessons/create?bookId=${bookId}&courseId=${courseId}`)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg transition font-semibold text-sm"
          >
            + Урок без юнита
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* LEFT — Lessons list */}
          <div className="col-span-4">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800">Уроки курса</h2>
                {currentGroup && (
                  <span className="text-sm text-gray-500">Группа: <strong>{currentGroup.name}</strong></span>
                )}
              </div>

              {lessons.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-3">📖</div>
                  <p className="text-lg">Уроков пока нет</p>
                  <button
                    onClick={() => navigate(`/teacher/lessons/create?bookId=${bookId}&courseId=${courseId}`)}
                    className="mt-4 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
                  >
                    + Создать первый урок
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map(({ unitName, lessons: unitLessons }) => {
                    const unitLabel = unitName !== null
                      ? (unitLessons[0]?.unit_name || unitName.charAt(0).toUpperCase() + unitName.slice(1))
                      : null;
                    const isExpanded = unitName === null || expandedUnits.has(unitName);
                    return (
                    <div key={unitName ?? 'ungrouped'}>
                      {unitName !== null && (
                        <div className="flex items-center gap-2 mb-2 w-full">
                          <button type="button" onClick={() => setExpandedUnits(previous => {
                            const next = new Set(previous);
                            if (next.has(unitName)) next.delete(unitName); else next.add(unitName);
                            return next;
                          })} aria-expanded={isExpanded} className="flex flex-1 items-center gap-[5px] min-h-0 text-left">
                            <span className="text-purple-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-100 p-[5px] rounded-full">{unitLabel}</span>
                            <div className="flex-1 h-px bg-purple-100" />
                            <span className="text-xs text-gray-400">{unitLessons.length}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const unitNumber = unitName.startsWith('unit-') ? unitName.slice(5) : '';
                              navigate(`/teacher/lessons/create?bookId=${bookId}&courseId=${courseId}${unitNumber ? `&unitNumber=${unitNumber}` : ''}`);
                            }}
                            className="shrink-0 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
                            title={`Добавить урок в ${unitLabel}`}
                          >
                            + Добавить
                          </button>
                        </div>
                      )}
                      {isExpanded && (
                      <div className={`space-y-2 ${unitName !== null ? 'pl-3 border-l-2 border-purple-200' : ''}`}>
                        {unitLessons.map((lesson, _idx) => {
                          const prog = lessonProgress[lesson.id];
                          const done = prog?.is_completed ?? false;
                          const pct = prog?.progress_percent ?? 0;
                          const globalIdx = lessons.indexOf(lesson);
                          const isDragging = draggedId === lesson.id;
                          const isOver = dragOverId === lesson.id;
                          return (
                            <div
                              key={lesson.id}
                              draggable
                              onDragStart={() => setDraggedId(lesson.id)}
                              onDragOver={e => { e.preventDefault(); setDragOverId(lesson.id); }}
                              onDragLeave={() => setDragOverId(null)}
                              onDrop={() => handleDrop(lesson.id)}
                              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                              className={`px-4 py-3 rounded-xl border-2 transition hover:shadow-sm cursor-grab active:cursor-grabbing ${
                                isDragging ? 'opacity-40' :
                                isOver ? 'border-purple-400 bg-purple-50 shadow-md' :
                                done ? 'border-green-200 bg-green-50' :
                                pct > 0 ? 'border-blue-200 bg-blue-50' :
                                'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-gray-300 hover:text-gray-500 shrink-0 cursor-grab select-none text-lg leading-none">⠿</span>
                                <span className="text-sm text-gray-400 w-6 text-center shrink-0 font-mono">{globalIdx + 1}</span>
                                <span className="text-lg shrink-0">{lesson.emoji || '📖'}</span>
                                <span className={`flex-1 text-sm font-semibold truncate ${done ? 'text-green-700' : pct > 0 ? 'text-blue-700' : 'text-gray-800'}`}>
                                  {lesson.title}
                                </span>
                                {done
                                  ? <span className="text-green-500 text-xs shrink-0 font-semibold">✓ пройден</span>
                                  : pct > 0
                                    ? <span className="text-blue-500 text-xs shrink-0 font-semibold">{pct}%</span>
                                    : null
                                }
                                <button
                                  onClick={() => navigate('/teacher/lesson-results?lessonId=' + encodeURIComponent(lesson.id) + (selectedGroupId ? '&groupId=' + selectedGroupId : '&mode=self-study'))}
                                  className={'shrink-0 !min-w-0 !min-h-0 !w-[22px] !h-[22px] p-0 inline-flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition text-xs font-bold'}
                                  title={'Посмотреть результаты урока'}
                                >
                                  📊
                                </button>
                                <button
                                  onClick={() => navigate(`/teacher/lessons/edit/${lesson.id}?lessonId=${lesson.id}&bookId=${bookId}&courseId=${courseId}`)}
                                  className="shrink-0 !min-w-0 !min-h-0 !w-[22px] !h-[22px] p-0 inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition text-xs font-bold"
                                >
                                  ✏️
                                </button>
                                {(isHskCourse || isStarlightCourse) && (
                                  <button
                                    onClick={() => navigate(`/teacher/self-study/${lesson.id}`)}
                                    title={'Самообучение'}
                                    aria-label={'Самообучение'}
                                    className={'shrink-0 !min-w-0 !min-h-0 !w-[22px] !h-[22px] p-0 inline-flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition text-xs font-bold'}
                                  >
                                    ◉
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStartLesson(lesson)}
                                  disabled={startingLessonId === lesson.id}
                                  className="shrink-0 !min-w-0 !min-h-0 !w-[22px] !h-[22px] p-0 inline-flex items-center justify-center bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition text-xs font-bold flex items-center gap-1"
                                >
                                  {startingLessonId === lesson.id ? '⏳' : '▶'}
                                </button>
                              </div>
                              {pct > 0 && (
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${done ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Statistics */}
          <div className="col-span-8 space-y-4">

            {/* Lesson count cards */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Статистика</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{lessons.length}</div>
                  <div className="text-xs text-gray-600 mt-1">Уроков</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-gray-600 mt-1">Пройдено</div>
                </div>
              </div>

              {lessons.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Прогресс</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Group selector */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Прогресс группы</h2>
              {groups.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Нет групп</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {(isHskCourse || isStarlightCourse) && (
                      <button
                        onClick={() => setSelectedGroupId(null)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition font-semibold text-sm ${
                          selectedGroupId === null
                            ? 'border-cyan-400 bg-cyan-50 text-cyan-800'
                            : 'border-gray-200 hover:border-cyan-300 text-gray-700'
                        }`}
                      >
                        ◉ Самообучение
                      </button>
                    )}
                    {groups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroupId(g.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition font-semibold text-sm ${
                          selectedGroupId === g.id
                            ? 'border-purple-400 bg-purple-50 text-purple-800'
                            : 'border-gray-200 hover:border-purple-300 text-gray-700'
                        }`}
                      >
                        👥 {g.name}
                        {g.current_lesson_title && (
                          <div className="text-xs text-blue-600 font-normal mt-0.5 truncate">
                            📍 {g.current_lesson_title}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {lessons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Пройдено уроков</span>
                        <span className="font-semibold text-purple-700">{completedCount} / {lessons.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-right text-xs text-purple-600 font-bold mt-1">{progress}%</div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

