'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/utils/routing-adapter';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import ActivityRenderer from '../components/LessonBuilder/ActivityRenderer';
import type { Activity } from '../types';

interface StudentLiveSessionProps {
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

export default function StudentLiveSession({ sessionId }: StudentLiveSessionProps) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/scoreboard');
  const enrichedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Join group room when socket connects and session is loaded
  useEffect(() => {
    if (!socket || !isConnected || !session?.group_id) return;

    console.log('[Student] Joining group room:', session.group_id);
    socket.emit('join-group-room', { groupId: session.group_id });

    return () => {
      console.log('[Student] Leaving group room:', session.group_id);
      socket.emit('leave-group-room', { groupId: session.group_id });
    };
  }, [socket, isConnected, session?.group_id]);

  // Listen for activity changes from teacher via WebSocket
  useEffect(() => {
    if (!socket || !isConnected || !session) return;

    console.log('[Student] Subscribing to session updates:', sessionId);

    // Listen for activity navigation from teacher
    const handleActivityChanged = (data: { sessionId: string; activityIndex: number }) => {
      console.log('[Student] Received activity change:', data);
      setCurrentActivityIndex(data.activityIndex);
      // Ensure the new activity has full content loaded
      setActivities(prev => {
        const a = prev[data.activityIndex];
        if (a && session?.lesson_id) enrichActivity(session.lesson_id, a.id!);
        return prev;
      });
    };

    // Listen for interactive mode toggle
    const handleInteractiveToggle = (data: { sessionId: string; isInteractive: boolean }) => {
      console.log('[Student] Received interactive toggle:', data);
      // Can add state for isInteractive if needed for student view
    };

    // Listen for session end — show overlay, then redirect by course
    const handleSessionEnded = (data: { sessionId: string }) => {
      console.log('[Student] Received session ended:', data);
      const activeSessionId = data.sessionId || sessionId;
      const url = `/student/lesson-results?sessionId=${activeSessionId}`;
      setRedirectUrl(url);
      setIsSessionEnded(true);
      setTimeout(() => router.push(url), 3000);
    };

    socket.on('session:activity-changed', handleActivityChanged);
    socket.on('session:interactive-toggle', handleInteractiveToggle);
    socket.on('session:ended', handleSessionEnded);

    return () => {
      socket.off('session:activity-changed', handleActivityChanged);
      socket.off('session:interactive-toggle', handleInteractiveToggle);
      socket.off('session:ended', handleSessionEnded);
    };
  }, [socket, isConnected, session, sessionId, router]);

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
    if (enrichedIds.current.has(activityId)) return;
    enrichedIds.current.add(activityId);
    try {
      const resp = await fetch(`/kids-api/lessons/${lessonId}/activities/${activityId}`);
      const data = await resp.json();
      if (data.success) {
        const [enriched] = transformActivities([data.data]);
        setActivities(prev => prev.map(a => a.id === activityId ? enriched : a));
      }
    } catch (err) {
      enrichedIds.current.delete(activityId);
    }
  };

  const loadSession = async () => {
    try {
      setIsLoading(true);

      console.log('[Student] Loading session:', sessionId);
      const sessionResponse = await fetch(`/kids-api/live-sessions/${sessionId}`);
      const sessionData = await sessionResponse.json();

      if (!sessionData.success) {
        throw new Error('Session not found');
      }

      setSession(sessionData.data);
      setCurrentActivityIndex(sessionData.data.current_activity_index || 0);

      // Slim load — fast, shows lesson immediately
      const activitiesResponse = await fetch(`/kids-api/lessons/${sessionData.data.lesson_id}/activities?slim=1`);
      const activitiesData = await activitiesResponse.json();

      if (activitiesData.success) {
        const sorted = transformActivities(activitiesData.data || []);
        setActivities(sorted);
        // Enrich all activities in background; most are <1KB, only base64 images are heavy
        sorted.forEach((a: Activity) => enrichActivity(sessionData.data.lesson_id, a.id!));
      }

      setIsLoading(false);
    } catch (err) {
      console.error('[Student] Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setIsLoading(false);
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
            onClick={() => router.push('/map')}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition"
          >
            Вернуться на карту
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
            <p className="text-gray-600">{redirectUrl === '/scoreboard' ? 'Переход к таблице лидеров...' : 'Переход к разбору ошибок...'}</p>
          </div>
        </div>
      )}
      {/* Top Control Bar */}
      <div className="bg-white shadow-lg border-b-4 border-green-300">
        <div className="w-full px-3 sm:px-5 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/map')}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition font-semibold"
              >
                ← Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Урок в прямом эфире</h1>
                <p className="text-sm text-gray-600">Следуйте за учителем</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{isConnected ? 'Подключено' : 'Отключено'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-1 sm:px-3 lg:px-5 py-2">
        {activities.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <p className="text-2xl text-gray-600">Ждем начала урока...</p>
          </div>
        ) : currentActivity ? (
          <div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 px-5 py-2">
                <h2 className="text-lg font-bold text-white">
                  {currentActivity.title || `Этап ${currentActivityIndex + 1}`}
                </h2>
              </div>

              <div className="p-1 sm:p-2 h-[calc(100vh-125px)] min-h-[520px]">
                <ActivityRenderer
                  key={currentActivity.id}
                  activity={currentActivity}
                  isViewMode={true}
                  isTeacher={false}
                  lessonId={session?.lesson_id}
                  groupId={session?.group_id}
                  sessionId={sessionId}
                  socket={socket}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
