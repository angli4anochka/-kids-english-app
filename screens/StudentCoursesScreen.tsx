'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';
import { soundManager } from '../utils/sounds';

interface Course {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  is_active: boolean;
}

const COURSE_GRADIENTS = [
  'from-blue-400 to-indigo-600',
  'from-purple-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-red-500',
  'from-cyan-400 to-blue-500',
  'from-violet-400 to-purple-600',
];

export default function StudentCoursesScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.groupId) {
      setIsLoading(false);
      return;
    }
    fetch(`/kids-api/groups/${user.groupId}/courses`)
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user?.groupId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-2xl text-gray-500 animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <button
            onClick={() => { soundManager.playClick(); navigate('/map'); }}
            className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 font-semibold rounded-xl shadow transition hover:scale-105 active:scale-95"
          >
            ← На карту
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Мои курсы</h1>
        </div>

        {/* No group */}
        {!user?.groupId && (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ожидайте учителя</h2>
            <p className="text-gray-500">Вас ещё не добавили в группу. Как только учитель добавит вас, курсы появятся здесь.</p>
          </div>
        )}

        {/* Has group but no courses yet */}
        {user?.groupId && courses.length === 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Курсы ещё не назначены</h2>
            <p className="text-gray-500">Учитель пока не добавил курсы в вашу группу.</p>
          </div>
        )}

        {/* Course cards */}
        {courses.length > 0 && (
          <div className="grid gap-5">
            {courses.map((course, idx) => (
              <button
                key={course.id}
                onClick={() => { soundManager.playClick(); navigate(`/course/${course.id}`); }}
                className={`
                  w-full bg-gradient-to-br ${COURSE_GRADIENTS[idx % COURSE_GRADIENTS.length]}
                  rounded-3xl p-7 flex items-center gap-5
                  shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-150 text-white text-left
                `}
              >
                <span className="text-5xl shrink-0">{course.emoji || '📖'}</span>
                <div>
                  <div className="text-2xl font-black">{course.name}</div>
                  {course.description && (
                    <div className="text-white/80 text-sm mt-1">{course.description}</div>
                  )}
                </div>
                <span className="ml-auto text-3xl opacity-60">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Back to map */}
        <button
          onClick={() => { soundManager.playClick(); navigate('/map'); }}
          className="w-full mt-8 py-4 bg-white/70 hover:bg-white text-gray-700 font-bold text-lg rounded-2xl shadow transition"
        >
          🗺️ Вернуться на карту
        </button>
      </div>
    </div>
  );
}
