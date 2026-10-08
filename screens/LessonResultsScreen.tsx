'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';
import { normalizeAnswerDetails, type AnswerDetail } from '../utils/resultDetails';

interface ActivityResult {
  id: string;
  activity_id: string;
  activity_title: string;
  order_index: number;
  results: AnswerDetail[];
  score: number;
  total: number;
  status?: string;
  pendingReview?: boolean;
}

export default function LessonResultsScreen() {
  const router = useRouter();
  const [searchParams] = useSearchParams ? [useSearchParams()] : [null];
  const { user } = useAuth();
  const [loadError, setLoadError] = useState(false);
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
        setLoadError(false);
        const [response, savedResponse] = await Promise.all([
          fetch(`/kids-api/spotlight/session-results?sessionId=${encodeURIComponent(sessionId)}&studentId=${encodeURIComponent(user.id)}`),
          fetch(`/kids-api/live-sessions/${encodeURIComponent(sessionId)}/results`),
        ]);
        const [data, saved] = await Promise.all([response.json(), savedResponse.json()]);
        if (!response.ok || !savedResponse.ok || !data.success || !saved.success) throw new Error('Could not load results');
        const latest = new Map<string, any>();
        for (const raw of saved.data || []) {
          if (String(raw.student_id) !== String(user.id)) continue;
          const details = typeof raw.details === 'string' ? JSON.parse(raw.details) : raw.details;
          if (!['oge-2027','oge-2026-v1','oge-reading'].includes(details?.source)) continue;
          const prior = latest.get(raw.activity_id);
          if (prior && Date.parse(prior.updated_at || prior.created_at) > Date.parse(raw.updated_at || raw.created_at)) continue;
          latest.set(raw.activity_id, { ...raw, activity_title: raw.activity_title || details.activityTitle,
            results: details.results || [], total: details.total || 0, pendingReview: details.pendingReview });
        }
        setResults([...(data.data || []).filter((r: any) => !latest.has(r.activity_id)), ...latest.values()]);
      } catch { setLoadError(true); }
      setIsLoading(false);
    };
    load();
  }, [sessionId, user?.id]);

  const wrongActivities = results.filter(r => (r.total - r.score) > 0);
  const totalWrong = wrongActivities.reduce((sum, r) => sum + (r.total - r.score), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-xl text-gray-600">Загрузка результатов...</div>
      </div>
    );
  }

  if (loadError) return <div className="p-8 text-center"><p role="alert">Не удалось загрузить результаты. Ответы не удалены. Обновите страницу, чтобы повторить загрузку.</p></div>;
  const hasIncomplete = results.some(r => r.status === 'in_progress');
  const reviewed = results.filter(r => !r.pendingReview);
  const perfect = reviewed.length > 0 && !hasIncomplete && totalWrong === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center">
          <div className="text-6xl mb-3">{perfect ? '🎉' : '📝'}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {perfect ? 'Отлично!' : results.some(r => r.pendingReview) && totalWrong === 0 ? 'Ответы сохранены' : results.length ? 'Разбор ошибок' : 'Результаты урока'}
          </h1>
          {perfect ? (
            <p className="text-gray-500 text-lg">Нет ошибок — урок выполнен без ошибок!</p>
          ) : (
            <p className="text-gray-500 text-lg">
              {results.some(r => r.pendingReview) && totalWrong === 0 ? "Ответы ожидают проверки учителем" : <>Допущено ошибок: <span className="font-bold text-red-500">{totalWrong}</span></>}
            </p>
          )}
        </div>

        {hasIncomplete && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-800">Есть незавершённые части. Здесь показаны сохранённые ответы.</p>}
        {results.filter(r => r.pendingReview).map(activity => <div key={activity.id} className="mb-4 rounded-xl bg-white p-5"><h2 className="font-bold">{activity.activity_title} · Ожидает проверки учителем</h2>{normalizeAnswerDetails(activity.results).map((a,i) => <p key={i} className="mt-2 whitespace-pre-wrap"><b>{(a as any).questionLabel || i+1}. </b>{a.studentAnswer || 'Нет ответа'}</p>)}</div>)}
        {/* Mistakes by activity */}
        {wrongActivities.map(activity => {
          const wrongCount = activity.total - activity.score;
          const details = normalizeAnswerDetails(activity.results).filter(a => !a.isCorrect);
          return (
            <div key={activity.id} className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-red-100 text-red-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                  {wrongCount}
                </span>
                {activity.activity_title || 'Упражнение'}
              </h2>
              {details.length > 0 ? (
                <div className="space-y-3">
                  {details.map((answer, idx) => (
                    <div key={idx} className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <div className="flex items-start gap-3">
                        <span className="text-red-400 font-bold text-sm mt-0.5">{(answer as any).questionLabel || `#${(answer.questionIndex ?? idx) + 1}`}</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-500">✗</span>
                            <span className="text-red-700 line-through">{answer.studentAnswer || '—'}</span>
                          </div>
                          {answer.sentence ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-500">✓</span>
                              <span className="text-green-700 font-semibold">{answer.sentence}</span>
                            </div>
                          ) : answer.correctAnswer && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-500">✓</span>
                              <span className="text-green-700 font-semibold">{answer.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Ошибок: {wrongCount} из {activity.total} (детали ответов не сохранены для этого упражнения)
                </p>
              )}
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
