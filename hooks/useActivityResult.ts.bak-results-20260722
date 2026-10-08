import { useAuth } from '../contexts/AuthContext';
import { useSocket } from './useSocket';

interface SubmitOpts {
  activityId: string;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  isTeacher?: boolean;
}

interface Result {
  score?: number;
  status?: 'completed' | 'failed';
  timeSeconds?: number | null;
  details?: any;
}

export function useActivityResult({ activityId, lessonId, groupId, sessionId, isTeacher }: SubmitOpts) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const submit = async (result: Result) => {
    if (isTeacher || !activityId) return;

    const payload = {
      activityId,
      lessonId: lessonId || null,
      studentId: (user as any)?.id || null,
      studentName: (user as any)?.displayName || (user as any)?.username || 'Аноним',
      score: result.score ?? 0,
      status: result.status ?? 'completed',
      timeSeconds: result.timeSeconds ?? null,
      details: result.details,
      groupId,
    };

    if (sessionId) {
      try {
        await fetch(`/kids-api/live-sessions/${sessionId}/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('[ActivityResult] POST failed:', err);
      }
    }

    if (socket && isConnected && groupId != null) {
      socket.emit('activity-result', payload);
    }
  };

  return submit;
}
