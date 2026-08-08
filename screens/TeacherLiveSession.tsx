'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/utils/routing-adapter';
import { useSocket } from '../hooks/useSocket';
import ActivityRenderer from '../components/LessonBuilder/ActivityRenderer';
import type { Activity } from '../types';
import TutorDeskCompletionModal from '../components/TutorDeskCompletionModal';

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
  course_name?: string;
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
  const enrichedActivityIds = useRef<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInteractive, setIsInteractive] = useState(false);

  // Safety net: never spin forever — bail after 15 s
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      setIsLoading(false);
      setError('Не удалось загрузить урок. Попробуйте обновить страницу.');
    }, 15_000);
    return () => clearTimeout(t);
  }, [isLoading]);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [spotlightResults, setSpotlightResults] = useState<SpotlightResult[]>([]);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [showTutorDeskCompletion, setShowTutorDeskCompletion] = useState(false);

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

  const transformActivities = (data: any[]): Activity[] => {
    const transformed = data.map((activity: any) => {
      const contentData = activity.content_data || {};
      return {
        ...activity,
        ...contentData,
        wordwallUrl: activity.type === 'wordwall' ? activity.content_url : contentData.wordwallUrl,
        presentationUrl: activity.type === 'presentation' ? activity.content_url : contentData.presentationUrl,
        geniallyUrl: activity.type === 'genially' ? activity.content_url : contentData.geniallyUrl,
        videoUrl: (activity.type === 'video' || activity.type === 'internal-video') ? activity.content_url : contentData.videoUrl,
        imageUrl: contentData.imageUrl || (activity.type === 'image' ? activity.content_url : undefined),
      };
    });
    return transformed.sort((a: Activity, b: Activity) =>
      (a.order_index || 0) - (b.order_index || 0)
    );
  };

  const enrichActivity = async (lessonId: string, activityId: string) => {
    if (enrichedActivityIds.current.has(activityId)) return;
    enrichedActivityIds.current.add(activityId);
    try {
      const resp = await fetch(`/kids-api/lessons/${lessonId}/activities/${activityId}`);
      const data = await resp.json();
      if (data.success) {
        const [enriched] = transformActivities([data.data]);
        setActivities(prev => prev.map(a => a.id === activityId ? enriched : a));
      }
    } catch (err) {
      enrichedActivityIds.current.delete(activityId);
      console.error('Error enriching activity:', activityId, err);
    }
  };

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

      // Load lesson activities — slim (no content_data) for fast initial load
      console.log('Loading activities for lesson:', sessionData.data.lesson_id);
      const activitiesResponse = await fetch(`/kids-api/lessons/${sessionData.data.lesson_id}/activities?slim=1`);
      const activitiesData = await activitiesResponse.json();

      if (activitiesData.success) {
        const transformed = transformActivities(activitiesData.data || []);
        console.log('Loaded slim activities:', transformed.length);
        setActivities(transformed);
      } else {
        console.error('Failed to load activities:', activitiesData);
      }

      setIsLoading(false);
      // Background: enrich ALL activities with full content_data in parallel
      // Most are tiny (<1KB), only the rare base64 image is heavy
      if (activitiesData.data?.length) {
        activitiesData.data.forEach((a: any) => enrichActivity(sessionData.data.lesson_id, a.id));
      }
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

  // When current activity changes, fetch its full content_data if not yet loaded
  useEffect(() => {
    const activity = activities[currentActivityIndex];
    if (activity && session?.lesson_id) {
      enrichActivity(session.lesson_id, activity.id);
    }
  }, [currentActivityIndex, activities.length, session?.lesson_id]);

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

  const finishSession = async () => {
    try {
      await fetch(`/kids-api/live-sessions/${sessionId}`, { method: 'DELETE' });

      if (socket && isConnected && session?.group_id) {
        socket.emit('session:ended', { sessionId, groupId: session.group_id });
      }

      setShowTutorDeskCompletion(false);
      const teacherRedirect = `/teacher/lesson-results?sessionId=${sessionId}`;
      setIsSessionEnded(true);
      setTimeout(() => router.push(teacherRedirect), 1500);
    } catch {
      alert('Не удалось завершить урок');
    }
  };

  const endSession = () => {
    if (!session?.group_id) return;
    setShowTutorDeskCompletion(true);
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
            <p className="text-gray-600">{((session?.course_name || '').toLowerCase().includes('spotlight') || (session?.course_name || '').toLowerCase().includes('спотлайт')) ? 'Переход к разбору ошибок...' : 'Возврат к урокам...'}</p>
          </div>
        </div>
      )}
      {showTutorDeskCompletion && session?.group_id && (
        <TutorDeskCompletionModal
          groupId={session.group_id}
          topic={session.course_name || 'Урок на UniPlay'}
          onDone={finishSession}
          onCancel={() => setShowTutorDeskCompletion(false)}
        />
      )}
      {/* Top Control Bar */}
      <div className="bg-white shadow-lg border-b-4 border-purple-300">
        <div className="w-full px-3 sm:px-5 lg:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                onClick={endSession}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition"
              >
                Завершить урок
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-4 lg:gap-6">
          {/* Left Sidebar - Activities List + Who finished */}
          <div className="flex flex-col gap-4 min-w-0">
            <div className="bg-white rounded-2xl shadow-xl p-4 xl:sticky xl:top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Этапы урока</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 max-h-[28vh] xl:max-h-[40vh] overflow-y-auto">
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
            {(() => {
              const GAME_LABELS: Record<string, string> = {
                'snake-word': '🐍 Змейка',
                'letter-race': '🏎️ Гонки',
                'letter-trace': '✏️ Прописи',
              };
              const gameResults = results.filter(r => {
                const act = activities.find(a => a.id === r.activity_id);
                return act && GAME_LABELS[act.type];
              });
              const totalCount = spotlightResults.length + gameResults.length;
              return (
                <div className="bg-white rounded-2xl shadow-xl p-4">
                  <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    Кто завершил
                    {totalCount > 0 && (
                      <span className="text-xs font-normal bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                        {totalCount}
                      </span>
                    )}
                  </h2>
                  {totalCount === 0 ? (
                    <p className="text-xs text-gray-400">Пока никто не завершил</p>
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
                      {[...gameResults]
                        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                        .map((r, i) => {
                          const act = activities.find(a => a.id === r.activity_id);
                          const label = act ? (GAME_LABELS[act.type] || act.title || '—') : '—';
                          const time = r.created_at
                            ? new Date(r.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                            : '';
                          return (
                            <div key={`game-${r.activity_id}-${r.student_id}-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                              <span className="text-xs text-gray-400 shrink-0 mt-0.5 font-mono">{time}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-800 truncate">{r.student_name || '—'}</div>
                                <div className="text-xs text-blue-600 truncate">{label}</div>
                              </div>
                              <span className="text-xs font-bold shrink-0 text-green-600">
                                {r.score > 0 ? `${r.score} ★` : '✓'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Main Content - Current Activity */}
          <div className="min-w-0">
            {activities.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
                <p className="text-2xl text-gray-600">В этом уроке пока нет этапов</p>
              </div>
            ) : currentActivity ? (
              <div>
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
                    <h2 className="text-xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">
                      {currentActivity.title || `Этап ${currentActivityIndex + 1}`}
                    </h2>
                    {currentActivity.subtitle && (
                      <p className="text-purple-100">{currentActivity.subtitle}</p>
                    )}
                  </div>

                  <div className="p-1 sm:p-2 lg:p-3 h-[calc(100vh-180px)] min-h-[520px]">
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

              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
