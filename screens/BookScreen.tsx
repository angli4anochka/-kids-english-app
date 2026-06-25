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

  const [book, setBook] = useState<CourseBook | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});

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
            setSelectedGroupId(groupsData.data[0].id);
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
    if (!selectedGroupId) return;
    fetch(`/kids-api/groups/${selectedGroupId}/progress`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const map: Record<string, boolean> = {};
          d.data.forEach((item: any) => { map[item.lesson_id] = item.is_completed; });
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
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
      </div>
    );
  }

  const completedCount = lessons.filter(l => lessonProgress[l.id]).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentGroup = groups.find(g => g.id === selectedGroupId);

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
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
          >
            + Урок
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* LEFT — Lessons list */}
          <div className="col-span-7">
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
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => {
                    const done = lessonProgress[lesson.id];
                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition hover:shadow-sm ${
                          done ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-sm text-gray-400 w-6 text-center shrink-0 font-mono">{idx + 1}</span>
                        <span className="text-lg shrink-0">{lesson.emoji || '📖'}</span>
                        <span className={`flex-1 text-sm font-semibold truncate ${done ? 'text-green-700' : 'text-gray-800'}`}>
                          {lesson.title}
                        </span>
                        {done && <span className="text-green-500 text-xs shrink-0 font-semibold">✓ пройден</span>}
                        <button
                          onClick={() => handleStartLesson(lesson)}
                          className="shrink-0 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-xs font-bold flex items-center gap-1"
                        >
                          ▶ Начать
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Statistics */}
          <div className="col-span-5 space-y-4">

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
                <div className="space-y-2">
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
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
