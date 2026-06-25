'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '@/utils/routing-adapter';

const ADMIN_EMAIL = 'angli4anochka@gmail.com';

const PLANS = [
  { key: 'monthly',   label: '1 мес',  days: 30  },
  { key: 'quarterly', label: '3 мес',  days: 90  },
  { key: 'annual',    label: '1 год',  days: 365 },
];

const STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  trial:         { label: 'Пробный',      cls: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '⏳' },
  active:        { label: 'Активна',      cls: 'bg-green-100  text-green-700  border-green-300',  icon: '✅' },
  expired:       { label: 'Истекла',      cls: 'bg-red-100    text-red-700    border-red-300',    icon: '🔒' },
  trial_expired: { label: 'Нет подписки', cls: 'bg-red-100    text-red-700    border-red-300',    icon: '🔒' },
};

const STATUS_ORDER: Record<string, number> = { trial_expired: 0, expired: 1, trial: 2, active: 3 };

function daysText(n: number) {
  if (n === 1) return '1 день';
  if (n < 5)  return `${n} дня`;
  return `${n} дней`;
}

export default function AdminScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/kids-api/admin/teachers');
      const d = await r.json();
      if (d.success) setTeachers(d.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.email !== ADMIN_EMAIL) {
      navigate('/teacher/dashboard');
      return;
    }
    fetchTeachers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const activate = async (teacherId: string, teacherName: string, days: number, plan: string) => {
    const key = teacherId + plan;
    setActivating(key);
    try {
      const r = await fetch('/kids-api/teacher-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, days, plan }),
      });
      const d = await r.json();
      if (d.success) {
        await fetchTeachers();
        setToast(`✅ ${teacherName} — подписка активирована`);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setActivating(null);
    }
  };

  const sorted = [...teachers].sort((a, b) =>
    (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4)
  );

  if (!user) return null;
  if (user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm animate-fade-in">
          {toast}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Панель администратора</h1>
              <p className="text-sm text-gray-500">{ADMIN_EMAIL}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition"
          >
            ← Дашборд
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Всего', count: teachers.length, color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'Активны', count: teachers.filter(t => t.status === 'active').length, color: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Пробный', count: teachers.filter(t => t.status === 'trial').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { label: 'Истекла', count: teachers.filter(t => t.status === 'expired' || t.status === 'trial_expired').length, color: 'bg-red-50 border-red-200 text-red-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
                <div className="text-3xl font-black">{s.count}</div>
                <div className="text-sm font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Teachers list */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
            <div className="text-4xl mb-3 animate-spin">⏳</div>
            Загрузка...
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">👥</div>
            Нет зарегистрированных учителей
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(teacher => {
              const st = STATUS[teacher.status] ?? STATUS.trial_expired;
              return (
                <div key={teacher.id}
                  className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: teacher.avatarColor || '#7c3aed' }}>
                      {teacher.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800 truncate">{teacher.displayName}</div>
                      <div className="text-sm text-gray-500 truncate">{teacher.email}</div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${st.cls}`}>
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                    {teacher.daysLeft > 0 && (
                      <span className="opacity-70">· {daysText(teacher.daysLeft)}</span>
                    )}
                  </div>

                  {/* Plan buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {PLANS.map(plan => {
                      const key = teacher.id + plan.key;
                      const busy = activating === key;
                      return (
                        <button
                          key={plan.key}
                          onClick={() => activate(teacher.id, teacher.displayName, plan.days, plan.key)}
                          disabled={!!activating}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition border
                            ${busy
                              ? 'bg-purple-100 border-purple-300 text-purple-400 cursor-wait'
                              : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-500 hover:text-white hover:border-purple-500'
                            }`}
                        >
                          {busy ? '...' : plan.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Кнопки добавляют срок к текущей подписке (не сбрасывают). Страница доступна только для {ADMIN_EMAIL}.
        </p>
      </div>
    </div>
  );
}
