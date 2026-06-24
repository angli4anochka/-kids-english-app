'use client';
import { useState, useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';

interface CourseBook {
  id: string;
  course_id: string;
  title: string;
  level_number: number;
  emoji: string;
  order_index: number;
}

interface Course {
  id: string;
  name: string;
  emoji: string;
  description?: string;
}

interface CourseScreenProps {
  courseId: string;
}

const LEVEL_COLORS = [
  'from-green-400 to-emerald-500',
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-orange-400 to-amber-500',
  'from-red-400 to-rose-600',
  'from-slate-400 to-gray-600',
];

export default function CourseScreen({ courseId }: CourseScreenProps) {
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [books, setBooks] = useState<CourseBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [booksRes, coursesRes] = await Promise.all([
          fetch(`/kids-api/courses/${courseId}/books`),
          fetch(`/kids-api/courses/${courseId}`),
        ]);
        const booksData = await booksRes.json();
        if (booksData.success) setBooks(booksData.data);

        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          if (cData.success) setCourse(cData.data);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId]);

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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/lessons')}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {course ? `${course.emoji} ${course.name}` : 'Курс'}
          </h1>
        </div>
      </div>

      {/* Books grid */}
      <div className="container mx-auto px-4 py-10">
        <p className="text-center text-gray-500 mb-8 text-lg">Выберите класс:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {books.map((book, idx) => (
            <button
              key={book.id}
              onClick={() => navigate(`/course/${courseId}/book/${book.id}`)}
              className={`
                bg-gradient-to-br ${LEVEL_COLORS[idx % LEVEL_COLORS.length]}
                rounded-2xl p-6 flex flex-col items-center gap-3
                shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
                transition-all duration-150 text-white
              `}
            >
              <span className="text-4xl">{book.emoji}</span>
              <span className="text-xl font-bold">{book.title}</span>
              <span className="text-sm opacity-80">класс</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
