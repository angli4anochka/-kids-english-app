'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';

interface ActivityResult {
  id: string;
  activity_id: string;
  activity_title: string;
  order_index: number;
  results: { answers: Record<string, { value: string; correct: boolean }> };
  score: number;
  total: number;
}

export default function LessonResultsScreen() {
  const router = useRouter();
  const [searchParams] = useSearchParams ? [useSearchParams()] : [null];
  const { user } = useAuth();
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('sessionId');
      setSessionId(sid);
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !user?.id) return;
    const load = async () => {
      try {
        const res = await fetch(`/kids-api/spotlight/session-results?sessionId=${sessionId}&studentId=${user.id}`);
        const data = await res.json();
        if (data.success) setResults(data.data);
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [sessionId, user?.id]);

  const wrongActivities = results.filter(r => {
    const answers = r.results?.answers || {};
    return Object.values(answers).some(a => !a.correct && a.value);
  });

  const totalWrong = wrongActivities.reduce((sum, r) => {
    const answers = r.results?.answers || {};
    return sum + Object.values(answers).filter(a => !a.correct && a.value).length;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-xl text-gray-600">Загрузка результатов...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center">
          <div className="text-6xl mb-3">{totalWrong === 0 ? '🎉' : '📝'}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {totalWrong === 0 ? 'Отлично!' : 'Разбор ошибок'}
          </h1>
          {totalWrong === 0 ? (
            <p className="text-gray-500 text-lg">Нет ошибок — урок выполнен без ошибок!</p>
          ) : (
            <p className="text-gray-500 text-lg">
              Допущено ошибок: <span className="font-bold text-red-500">{totalWrong}</span>
            </p>
          )}
        </div>

        {/* Mistakes by activity */}
        {wrongActivities.map(activity => {
          const answers = activity.results?.answers || {};
          const wrongs = Object.entries(answers).filter(([, a]) => !a.correct && a.value);
          if (wrongs.length === 0) return null;
          return (
            <div key={activity.id} className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-red-100 text-red-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                  {wrongs.length}
                </span>
                {activity.activity_title || 'Упражнение'}
              </h2>
              <div className="space-y-3">
                {wrongs.map(([key, answer]) => {
                  const qNum = key.replace('q', '');
                  return (
                    <div key={key} className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <div className="flex items-start gap-3">
                        <span className="text-red-400 font-bold text-sm mt-0.5">#{qNum}</span>
                        <div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-500">✗</span>
                            <span className="text-red-700 font-medium">{answer.value || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
            <p>Нет данных об упражнениях в этом уроке.</p>
          </div>
        )}

        <button
          onClick={() => router.push('/map')}
          className="w-full mt-4 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition"
        >
          На карту →
        </button>
      </div>
    </div>
  );
}
