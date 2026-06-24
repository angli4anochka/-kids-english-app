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
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingLesson, setStartingLesson] = useState<Lesson | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

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
        if (data.sessionId) {
          navigate(`/teacher/live-session/${data.sessionId}`);
        } else {
          alert(data.error || 'Ошибка запуска урока');
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Назад
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {book ? `${book.emoji} ${book.title}` : 'Книга'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {groups.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">Группа:</label>
                <select
                  value={selectedGroupId || ''}
                  onChange={e => setSelectedGroupId(Number(e.target.value))}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm font-semibold"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => navigate(`/teacher/lessons/create?bookId=${bookId}&courseId=${courseId}`)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
            >
              + Урок
            </button>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div className="px-6 py-6 max-w-sm">
        {lessons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-5xl mb-3">📖</div>
            <p className="text-gray-600 mb-4">Уроков пока нет</p>
            <button
              onClick={() => navigate(`/teacher/lessons/create?bookId=${bookId}&courseId=${courseId}`)}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
            >
              + Создать урок
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="bg-white rounded-xl shadow-sm px-3 py-2 flex items-center gap-2 hover:shadow-md transition"
              >
                <span className="text-sm text-gray-300 w-5 text-center shrink-0">{idx + 1}</span>
                <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{lesson.emoji || '📖'} {lesson.title}</span>
                <button
                  onClick={() => handleStartLesson(lesson)}
                  className="shrink-0 w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-xs font-bold flex items-center justify-center"
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
