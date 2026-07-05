'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/utils/routing-adapter';
import { useSocket } from '../hooks/useSocket';
import ActivityRenderer from '../components/LessonBuilder/ActivityRenderer';
import type { Activity } from '../types';

interface TeacherLiveSessionProps {
  sessionId: string;
}

interface SessionData {
  id: string;
  lesson_id: string;
  group_id: number;
  teacher_id: string;
  current_activity_index: number;
  is_interactive: boolean;
  created_at: string;
}

interface ActivityResult {
  id?: string;
  activity_id: string;
  student_id: string | null;
  student_name: string | null;
  score: number;
  status: string;
  time_seconds: number | null;
  details?: any;
  created_at?: string;
  updated_at?: string;
}

interface SpotlightResult {
  id: string;
  activity_id: string | null;
  student_name: string;
  score: number;
  total: number;
  submitted_at: string;
}

export default function TeacherLiveSession({ sessionId }: TeacherLiveSessionProps) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [session, setSession] = useState<SessionData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInteractive, setIsInteractive] = useState(false);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [spotlightResults, setSpotlightResults] = useState<SpotlightResult[]>([]);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Join group room when socket connects and session is loaded
  useEffect(() => {
    if (!socket || !isConnected || !session?.group_id) return;

    console.log('[Teacher] Joining group room:', session.group_id);
    socket.emit('join-group-room', { groupId: session.group_id });

    return () => {
      console.log('[Teacher] Leaving group room:', session.group_id);
      socket.emit('leave-group-room', { groupId: session.group_id });
    };
  }, [socket, isConnected, session?.group_id]);

  // Load existing results + subscribe to live results
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/kids-api/live-sessions/${sessionId}/results`)
      .then((r) => r.json())
      .then((d) => { if (d?.success) setResults(d.data || []); })
      .catch(() => {});
  }, [sessionId]);

  // Poll spotlight results every 8 seconds
  useEffect(() => {
    if (!sessionId || !session?.lesson_id) return;
    const fetchSpotlight = () => {
      fetch(`/kids-api/spotlight/results/${session.lesson_id}?sessionId=${sessionId}`)
        .then(r => r.json())
        .then(d => { if (d?.success) setSpotlightResults(d.data || []); })
        .catch(() => {});
    };
    fetchSpotlight();
    const timer = setInterval(fetchSpotlight, 8000);
    return () => clearInterval(timer);
  }, [sessionId, session?.lesson_id]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleResult = (data: any) => {
      console.log('[Teacher] Got student result:', data);
      const row: ActivityResult = {
        activity_id: data.activityId,
        student_id: data.studentId ?? null,
        student_name: data.studentName ?? null,
        score: data.score ?? 0,
        status: data.status ?? 'completed',
        time_seconds: data.timeSeconds ?? null,
        details: data.details,
        created_at: new Date().toISOString(),
      };
      setResults((prev) => {
        // Replace existing result for same student+activity, otherwise prepend
        const idx = prev.findIndex(r => r.activity_id === row.activity_id && r.student_id === row.student_id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = row;
          return next;
        }
        return [row, ...prev];
      });
    };
    socket.on('activity-result', handleResult);
    return () => { socket.off('activity-result', handleResult); };
  }, [socket, isConnected]);

  const loadSession = async () => {
    try {
      setIsLoading(true);

      // Load session data
      console.log('Loading session:', sessionId);
      const sessionResponse = await fetch(`/kids-api/live-sessions/${sessionId}`);
      const sessionData = await sessionResponse.json();
      console.log('Session data:', sessionData);

      if (!sessionData.success) {
        throw new Error('Session not found');
      }

      setSession(sessionData.data);
      setCurrentActivityIndex(sessionData.data.current_activity_index || 0);
      setIsInteractive(sessionData.data.is_interactive || false);

      // Load lesson activities
      console.log('Loading activities for lesson:', sessionData.data.lesson_id);
      const activitiesResponse = await fetch(`/kids-api/lessons/${sessionData.data.lesson_id}/activities`);
      const activitiesData = await activitiesResponse.json();
      console.log('Activities data:', activitiesData);

      if (activitiesData.success) {
        // Transform activities from backend format to frontend format
        const transformed = (activitiesData.data || []).map((activity: any) => {
          const contentData = activity.content_data || {};
          return {
            ...activity,
            // Spread content_data fields to top level
            ...contentData,
            // Map content_url to specific fields based on type
            wordwallUrl: activity.type === 'wordwall' ? activity.content_url : contentData.wordwallUrl,
            presentationUrl: activity.type === 'presentation' ? activity.content_url : contentData.presentationUrl,
            geniallyUrl: activity.type === 'genially' ? activity.content_url : contentData.geniallyUrl,
            videoUrl: (activity.type === 'video' || activity.type === 'internal-video') ? activity.content_url : contentData.videoUrl,
            imageUrl: activity.type === 'image' ? activity.content_url : contentData.imageUrl,
          };
        });

        const sorted = transformed.sort((a: Activity, b: Activity) =>
          (a.order_index || 0) - (b.order_index || 0)
        );
        console.log('Sorted and transformed activities:', sorted);
        setActivities(sorted);
      } else {
        console.error('Failed to load activities:', activitiesData);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setIsLoading(false);
    }
  };

  const handleNavigateActivity = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= activities.length) return;

    try {
      // Update session on backend
      await fetch(`/kids-api/live-sessions/${sessionId}/activity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityIndex: newIndex }),
      });

      setCurrentActivityIndex(newIndex);

      // Notify students via WebSocket
      if (socket && isConnected && session?.group_id) {
        console.log('[Teacher] Broadcasting activity change to group:', session.group_id, 'activityIndex:', newIndex);
        socket.emit('session:activity-change', {
          sessionId: sessionId,
          groupId: session.group_id,
          activityIndex: newIndex,
        });
      }
    } catch (err) {
      console.error('Failed to update activity:', err);
    }
  };

  const toggleInteractive = async () => {
    try {
      const newValue = !isInteractive;
      await fetch(`/kids-api/live-sessions/${sessionId}/interactive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInteractive: newValue }),
      });

      setIsInteractive(newValue);

      // Notify students via WebSocket
      if (socket && isConnected && session?.group_id) {
        console.log('[Teacher] Broadcasting interactive toggle to group:', session.group_id, 'isInteractive:', newValue);
        socket.emit('session:interactive-toggle', {
          sessionId: sessionId,
          groupId: session.group_id,
          isInteractive: newValue,
        });
      }
    } catch (err) {
      console.error('Failed to toggle interactive:', err);
    }
  };

  const endSession = async () => {
    if (!confirm('Завершить урок?')) return;

    try {
      await fetch(`/kids-api/live-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      // Notify students via WebSocket
      if (socket && isConnected && session?.group_id) {
        console.log('[Teacher] Broadcasting session end to group:', session.group_id);
        socket.emit('session:ended', {
          sessionId: sessionId,
          groupId: session.group_id,
        });
      }

      setIsSessionEnded(true);
      setTimeout(() => router.push('/scoreboard'), 3000);
    } catch (err) {
      alert('Failed to end session');
    }
  };


  const handleEditActivity = async (updatedActivity: Activity) => {
    // Update local state
    setActivities(activities.map(a => a.id === updatedActivity.id ? updatedActivity : a));

    // Save to backend
    if (session?.lesson_id && updatedActivity.id) {
      try {
        // Extract presentation-specific fields, everything else goes into content_data
        const { presentationType, presentationUrl, id, type, title, subtitle, points, content_url, audioUrl, videoUrl, imageUrl, wordwallUrl, geniallyUrl, ...rest } = updatedActivity as any;

        const contentData: Record<string, any> = { ...rest };
        if (updatedActivity.type === 'presentation') {
          if (presentationType) contentData.presentationType = presentationType;
          if (presentationUrl) contentData.presentationUrl = presentationUrl;
        }
        if (audioUrl) contentData.audioUrl = audioUrl;

        const resolvedContentUrl =
          updatedActivity.type === 'presentation' ? presentationUrl
          : (videoUrl || imageUrl || wordwallUrl || geniallyUrl || content_url);

        // Backend uses camelCase keys (contentUrl/contentData)
        const payload = {
          type: updatedActivity.type,
          title: updatedActivity.title,
          subtitle: updatedActivity.subtitle,
          contentUrl: resolvedContentUrl,
          contentData: Object.keys(contentData).length > 0 ? contentData : undefined,
          points: updatedActivity.points,
        };

        const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

        if (isUuid(String(updatedActivity.id))) {
          console.log('[Teacher] PUT activity', updatedActivity.id);
          const resp = await fetch(`/kids-api/lessons/${session.lesson_id}/activities/${updatedActivity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            console.error('Failed to save activity:', err.error || resp.status);
          }
        } else {
          // Temp id (e.g. Date.now()) → activity never persisted; POST instead
          console.log('[Teacher] POST activity (was temp id)', updatedActivity.id);
          const resp = await fetch(`/kids-api/lessons/${session.lesson_id}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (resp.ok) {
            const created = await resp.json();
            const newId = created?.id;
            if (newId) {
              setActivities(prev => prev.map(a => a.id === updatedActivity.id ? { ...a, id: newId } : a));
            }
          } else {
            const err = await resp.json().catch(() => ({}));
            console.error('Failed to create activity:', err.error || resp.status);
          }
        }
      } catch (error) {
        console.error('Error saving activity:', error);
      }
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-2xl font-semibold text-gray-700">Загрузка урока...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/teacher/lessons')}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition"
          >
            Вернуться к урокам
          </button>
        </div>
      </div>
    );
  }

  const currentActivity = activities[currentActivityIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {isSessionEnded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Урок завершен!</h2>
            <p className="text-gray-600">Переход к таблице лидеров...</p>
          </div>
        </div>
      )}
      {/* Top Control Bar */}
      <div className="bg-white shadow-lg border-b-4 border-purple-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/teacher/lessons')}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition font-semibold"
              >
                ← Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Session</h1>
                <p className="text-sm text-gray-600">ID: {sessionId.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">{isConnected ? 'Подключено' : 'Отключено'}</span>
              </div>
              <button
                onClick={toggleInteractive}
                className={`px-6 py-2 rounded-xl font-semibold transition ${
                  isInteractive
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {isInteractive ? '🟢 Интерактив' : '⚪ Интерактив'}
              </button>

              <button
                onClick={endSession}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition"
              >
                Завершить урок
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Activities List + Who finished */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Этапы урока</h2>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {activities.map((activity, index) => (
                  <button
                    key={activity.id}
                    onClick={() => handleNavigateActivity(index)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition ${
                      index === currentActivityIndex
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{index + 1}.</span>
                      <span className="font-semibold text-sm truncate">
                        {activity.title || 'Этап ' + (index + 1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Who finished panel */}
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                Кто завершил
                {spotlightResults.length > 0 && (
                  <span className="text-xs font-normal bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                    {spotlightResults.length}
                  </span>
                )}
              </h2>
              {spotlightResults.length === 0 ? (
                <p className="text-xs text-gray-400">Пока никто не сдал задание</p>
              ) : (
                <div className="space-y-1.5 max-h-[calc(100vh-520px)] overflow-y-auto">
                  {[...spotlightResults]
                    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                    .map(r => {
                      const actTitle = activities.find(a => a.id === r.activity_id)?.title || '—';
                      const time = new Date(r.submitted_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                      const perfect = r.score === r.total;
                      return (
                        <div key={r.id} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-xs text-gray-400 shrink-0 mt-0.5 font-mono">{time}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800 truncate">{r.student_name}</div>
                            <div className="text-xs text-gray-500 truncate">{actTitle}</div>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${perfect ? 'text-green-600' : 'text-orange-500'}`}>
                            {r.score}/{r.total}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Current Activity */}
          <div className="col-span-9">
            {activities.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
                <p className="text-2xl text-gray-600">В этом уроке пока нет этапов</p>
              </div>
            ) : currentActivity ? (
              <div>
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {currentActivity.title || `Этап ${currentActivityIndex + 1}`}
                    </h2>
                    {currentActivity.subtitle && (
                      <p className="text-purple-100">{currentActivity.subtitle}</p>
                    )}
                  </div>

                  <div className="p-3 h-[calc(100vh-200px)]">
                    <ActivityRenderer
                      key={currentActivity.id}
                      activity={currentActivity}
                      isViewMode={true}
                      isTeacher={true}
                      lessonId={session?.lesson_id}
                      groupId={session?.group_id}
                      sessionId={sessionId}
                      socket={socket}
                      isConnected={isConnected}
                      onEdit={handleEditActivity}
                    />
                  </div>
                </div>

                {/* Student results for current activity */}
                {currentActivity && (() => {
                  const activityResults = results
                    .filter(r => r.activity_id === currentActivity.id)
                    .sort((a, b) => (b.score || 0) - (a.score || 0));
                  return (
                    <div className="mt-6 bg-white rounded-3xl shadow-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        🏆 Результаты учеников
                        <span className="text-sm font-normal text-gray-500">({activityResults.length})</span>
                      </h3>
                      {activityResults.length === 0 ? (
                        <p className="text-gray-500 text-sm">Пока никто не завершил эту активити</p>
                      ) : (
                        <div className="space-y-2">
                          {activityResults.map((r, i) => (
                            <div
                              key={(r.student_id || 'anon') + '-' + i}
                              className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-100"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'}`}>
                                  {i + 1}
                                </span>
                                <span className="font-semibold text-gray-800">{r.student_name || 'Аноним'}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {r.status === 'completed' ? '✓ прошёл' : '✗ не прошёл'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-bold text-purple-700">{r.score} баллов</span>
                                {r.time_seconds != null && (
                                  <span className="text-gray-500">⏱ {r.time_seconds}с</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
