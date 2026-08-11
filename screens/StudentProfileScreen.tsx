'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { islands } from '../data/islands';
import { soundManager } from '../utils/sounds';

// Значки открываются по баллам (как на таблице лидеров)
const BADGES = [
  { threshold: 50, emoji: '🥉', name: 'Новичок' },
  { threshold: 150, emoji: '🥈', name: 'Старатель' },
  { threshold: 300, emoji: '🥇', name: 'Молодец' },
  { threshold: 450, emoji: '🏆', name: 'Чемпион' },
  { threshold: 600, emoji: '💎', name: 'Знаток' },
  { threshold: 1000, emoji: '👑', name: 'Легенда' },
];

export default function StudentProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress } = useProgress();
  const [points, setPoints] = useState<number>(0);
  const [achievements, setAchievements] = useState<Array<{
    achievement_key: string;
    name: string;
    emoji: string;
    earned_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [homework, setHomework] = useState<any>(null);
  const [homeworkAnswers, setHomeworkAnswers] = useState<string[]>([]);
  const [homeworkResult, setHomeworkResult] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    fetch(`/kids-api/students/${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setPoints(d.data.points || 0);
          setAchievements(Array.isArray(d.data.achievements) ? d.data.achievements : []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/kids-api/students/${user.id}/homework`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setHomework(d.data);
          setHomeworkAnswers(
            Array.isArray(d.data.answers) && d.data.answers.length
              ? d.data.answers
              : Array(d.data.tasks.length).fill('')
          );
          if (Array.isArray(d.data.checks)) {
            setHomeworkResult({ score: d.data.score, total: d.data.total, checks: d.data.checks });
          }
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const unlockedCount = BADGES.filter((b) => points >= b.threshold).length;
  const nextBadge = BADGES.find((b) => points < b.threshold);
  const prevThreshold = nextBadge
    ? BADGES[BADGES.indexOf(nextBadge) - 1]?.threshold || 0
    : BADGES[BADGES.length - 1].threshold;
  const toNextPct = nextBadge
    ? Math.round(((points - prevThreshold) / (nextBadge.threshold - prevThreshold)) * 100)
    : 100;

  const totalIslands = islands.length;
  const completedIslands = progress.completedIslands?.length || 0;
  const islandPct = totalIslands ? Math.round((completedIslands / totalIslands) * 100) : 0;

  const avatar = (user?.displayName || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Назад */}
        <button
          onClick={() => {
            soundManager.playClick();
            navigate('/map');
          }}
          className="mb-4 px-5 py-2.5 bg-white/80 hover:bg-white text-gray-800 rounded-2xl font-bold shadow-lg transition hover:scale-105 active:scale-95"
        >
          ⬅️ На карту
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Шапка профиля */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 flex items-center gap-5 lg:col-span-2">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg shrink-0"
            style={{ backgroundColor: (user as any)?.avatarColor || '#8b5cf6' }}
          >
            {avatar}
          </div>
          <div>
            <div className="text-sm text-gray-500 font-semibold">Мой кабинет</div>
            <h1 className="text-3xl font-black text-gray-900">{user?.displayName || 'Ученик'}</h1>
            {(user as any)?.groupName && (
              <div className="text-gray-500 font-semibold">Группа: {(user as any).groupName}</div>
            )}
          </div>
        </div>

        {/* Баллы + уровень */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-2xl p-6 text-white lg:col-span-2">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-sm font-bold uppercase tracking-wide opacity-90">Баллы</div>
              <div className="text-6xl font-black leading-none">{isLoading ? '…' : points}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold uppercase tracking-wide opacity-90">Уровень</div>
              <div className="text-5xl font-black leading-none">{unlockedCount}</div>
            </div>
          </div>
          {nextBadge ? (
            <>
              <div className="flex justify-between text-sm font-semibold mb-1 opacity-95">
                <span>До значка «{nextBadge.name}» {nextBadge.emoji}</span>
                <span>{points} / {nextBadge.threshold}</span>
              </div>
              <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, toNextPct))}%` }} />
              </div>
            </>
          ) : (
            <div className="text-center text-lg font-bold">🎉 Все значки открыты!</div>
          )}
        </div>

        {/* Ачивки */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900 mb-4">🏅 Мои достижения</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map((b) => {
              const unlocked = points >= b.threshold;
              return (
                <div
                  key={b.threshold}
                  className={`flex flex-col items-center justify-center rounded-2xl p-3 text-center transition ${
                    unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-amber-300 shadow'
                      : 'bg-gray-100 border-2 border-gray-200 opacity-70'
                  }`}
                >
                  <div className="text-4xl mb-1">{unlocked ? b.emoji : '🔒'}</div>
                  <div className={`text-xs font-bold ${unlocked ? 'text-amber-700' : 'text-gray-400'}`}>{b.name}</div>
                  <div className="text-[10px] text-gray-400">{b.threshold} б.</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Прогресс по островам */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900 mb-3">🗺️ Прогресс по карте</h2>
          <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
            <span>Пройдено островов</span>
            <span>{completedIslands} / {totalIslands}</span>
          </div>
          <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${islandPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {islands.map((isl) => {
              const done = progress.completedIslands?.includes(isl.id);
              return (
                <div
                  key={isl.id}
                  className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold ${
                    done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span>{done ? '✅' : isl.emoji || '🏝️'}</span>
                  <span className="truncate">{isl.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {homework && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 lg:col-span-2">
            <h2 className="text-xl font-black text-gray-900 mb-4">📝 Домашнее задание</h2>
            <div className="space-y-3">
              {homework.tasks.map((task: any, index: number) => (
                <label
                  key={index}
                  className={`block rounded-xl border-2 p-3 ${
                    homeworkResult?.checks?.[index] === true
                      ? 'border-green-300 bg-green-50'
                      : homeworkResult?.checks?.[index] === false
                        ? 'border-red-300 bg-red-50'
                        : 'border-transparent bg-purple-50'
                  }`}
                >
                  <div className="mb-2 font-semibold text-gray-800">{index + 1}. {task.sentence}</div>
                  <input
                    value={homeworkAnswers[index] || ''}
                    onChange={e => setHomeworkAnswers(current => current.map((value, i) => i === index ? e.target.value : value))}
                    className={`w-full rounded-lg border-2 bg-white px-3 py-2 outline-none ${
                      homeworkResult?.checks?.[index] === false
                        ? 'border-red-400'
                        : homeworkResult?.checks?.[index] === true
                          ? 'border-green-400'
                          : 'border-purple-200 focus:border-purple-500'
                    }`}
                    placeholder="Введите ответ"
                  />
                  {homeworkResult?.checks?.[index] === false && (
                    <div className="mt-1 text-sm font-bold text-red-600">Неверно</div>
                  )}
                  {homeworkResult?.checks?.[index] === true && (
                    <div className="mt-1 text-sm font-bold text-green-600">Верно</div>
                  )}
                </label>
              ))}
            </div>
            <button
              onClick={async () => {
                const response = await fetch(`/kids-api/students/${user?.id}/homework/${homework.id}/submit`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ answers: homeworkAnswers }),
                });
                const payload = await response.json();
                if (payload.success) {
                  alert(`Домашнее задание завершено: ${payload.data.score}/${payload.data.total}`);
                  setHomeworkResult(null);
                  setHomework(null);
                }
              }}
              className="mt-4 w-full rounded-xl bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700"
            >
              Проверить
            </button>
            {homeworkResult && (
              <div className="mt-3 text-center text-lg font-black text-purple-700">
                Результат: {homeworkResult.score}/{homeworkResult.total}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-6 lg:col-start-3 lg:row-start-1 lg:row-span-4">
          <h2 className="text-xl font-black text-gray-900 mb-2">✨ Коллекция ачивок</h2>
          <p className="text-sm text-gray-500 font-semibold mb-4">
            Здесь будут открываться особые достижения
          </p>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 15 }, (_, index) => {
              const achievement = achievements[index];
              return (
                <div
                  key={achievement?.achievement_key || index}
                  className={`aspect-square min-h-24 rounded-2xl border-2 flex flex-col items-center justify-center text-center shadow-sm p-2 ${
                    achievement
                      ? 'border-amber-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100'
                      : 'border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50'
                  }`}
                  title={achievement?.name || `Закрытая ачивка ${index + 1}`}
                >
                  <span className={`text-4xl ${achievement ? '' : 'opacity-45'}`}>
                    {achievement?.emoji || '🔒'}
                  </span>
                  <span className={`mt-1 text-[11px] font-bold ${
                    achievement ? 'text-amber-700' : 'text-purple-300'
                  }`}>
                    {achievement?.name || `Ачивка ${index + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
