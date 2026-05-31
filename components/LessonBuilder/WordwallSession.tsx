import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Participant {
  id: number;
  student_id: number;
  student_name: string;
  status: string;
  completed_at: string | null;
}

interface Session {
  id: string;
  status: string;
  participants: Participant[];
}

interface WordwallSessionProps {
  wordwallUrl: string;
  lessonId: string;
  activityIndex: number;
  groupId: number;
  onClose: () => void;
}

export default function WordwallSession({
  wordwallUrl,
  lessonId,
  activityIndex,
  groupId,
  onClose
}: WordwallSessionProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Create session on mount
  useEffect(() => {
    createSession();
  }, []);

  // Poll for updates every 2 seconds
  useEffect(() => {
    if (!session?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/kids-api/sessions/${session.id}`);
        const data = await response.json();

        if (data.success) {
          setSession(data.data);
        }
      } catch (error) {
        console.error('Error polling session:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.id]);

  const createSession = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/kids-api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          activityIndex,
          teacherId: user?.id,
          groupId,
          activityType: 'wordwall',
          activityData: { wordwallUrl }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.data);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Ошибка при создании сессии');
    } finally {
      setIsCreating(false);
    }
  };

  const startActivity = async () => {
    if (!session?.id) return;

    try {
      await fetch(`/kids-api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      setSession({ ...session, status: 'active' });
    } catch (error) {
      console.error('Error starting activity:', error);
    }
  };

  const completeSession = async () => {
    if (!session?.id) return;

    try {
      await fetch(`/kids-api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      setSession({ ...session, status: 'completed' });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  if (isCreating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-center">Создание сессии Wordwall...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Teacher view - waiting for students
  if (session.status === 'waiting') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50 p-8">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              🎮 Wordwall - Ожидание учеников
            </h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl"
            >
              ✕
            </button>
          </div>

          {/* Session Info */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 mb-8 text-center">
            <p className="text-white text-xl mb-2">Код сессии:</p>
            <p className="text-white text-6xl font-bold tracking-wider">
              {session.id.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-purple-100 mt-4">
              Ученики подключатся автоматически
            </p>
          </div>

          {/* Participants List */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Подключенные ученики ({session.participants?.length || 0})
            </h2>

            {session.participants && session.participants.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {session.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-800">
                      {participant.student_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-500">
                  Ожидание подключения учеников...
                </p>
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={startActivity}
            disabled={!session.participants || session.participants.length === 0}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xl font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {session.participants && session.participants.length > 0
              ? `Запустить Wordwall (${session.participants.length} уч.)`
              : 'Ожидание учеников...'}
          </button>
        </div>
      </div>
    );
  }

  // Teacher view - activity in progress
  if (session.status === 'active') {
    const completedCount = session.participants?.filter(p => p.status === 'completed').length || 0;
    const totalCount = session.participants?.length || 0;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50 p-8">
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🎮 Wordwall в процессе
              </h1>
              <p className="text-gray-600">
                Завершено: {completedCount} из {totalCount}
              </p>
            </div>
            <button
              onClick={completeSession}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
            >
              Завершить активность
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Participants Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {session.participants?.map((participant) => (
              <div
                key={participant.id}
                className={`rounded-xl p-4 border-2 ${
                  participant.status === 'completed'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {participant.status === 'completed' ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span className="font-semibold text-gray-800">
                    {participant.student_name}
                  </span>
                </div>

                {participant.status === 'completed' && (
                  <div className="text-center mt-2">
                    <span className="text-sm font-semibold text-green-600">
                      Выполнено {participant.completed_at ? new Date(participant.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center">
            <p className="text-blue-800 text-sm">
              💡 <strong>Совет:</strong> Ученики выполняют задание на Wordwall в своих окнах. Когда закончат, они нажмут "Готово".
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Teacher view - completed
  if (session.status === 'completed') {
    const completedCount = session.participants?.filter(p => p.status === 'completed').length || 0;
    const totalCount = session.participants?.length || 0;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center z-50 p-8">
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-8xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Wordwall завершен!
            </h1>
            <p className="text-2xl text-gray-600">
              Завершили: <span className="font-bold text-green-600">{completedCount} из {totalCount}</span>
            </p>
          </div>

          {/* Results Table */}
          <div className="mb-8 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Ученик</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">Статус</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">Время завершения</th>
                </tr>
              </thead>
              <tbody>
                {session.participants?.map((participant, index) => (
                  <tr
                    key={participant.id}
                    className={`border-b border-gray-200 ${
                      participant.status === 'completed' ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {participant.status === 'completed' && <span className="text-2xl">✅</span>}
                        <span className="font-semibold">{participant.student_name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {participant.status === 'completed' ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          Завершено
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                          Не завершено
                        </span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {participant.completed_at ? (
                        <span className="text-gray-700">
                          {new Date(participant.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xl font-bold rounded-xl transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return null;
}
