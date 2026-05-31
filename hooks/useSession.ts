import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useUserRole } from './useUserRole';
import { API_CONFIG } from '../config/api';
import type { UserRole } from '../types';

interface SessionStudent {
  studentId: string;
  displayName: string;
  avatarColor: string;
  isReady: boolean;
}

interface UseSessionReturn {
  sessionId: string | null;
  sessionCode: string | null;
  currentActivity: string | null;
  students: SessionStudent[];
  isJoined: boolean;
  isLoading: boolean;
  error: string | null;
  createSession: (lessonId: string, groupId: number, teacherName: string) => Promise<void>;
  joinSession: (lessonId: string, groupId: number, studentName: string) => Promise<void>;
  changeActivity: (activityIndex: number) => void;
  updateProgress: (activityId: string, score: number, data?: any) => void;
  leaveSession: () => void;
}

export const useSession = (): UseSessionReturn => {
  const { socket, isConnected } = useSocket();
  const { role } = useUserRole();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);
  const [students, setStudents] = useState<SessionStudent[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create new session (teacher only) - simplified for our backend
  const createSession = useCallback(async (lessonId: string, groupId: number, teacherName: string) => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Directly join as teacher via WebSocket
      socket.emit(API_CONFIG.socketEvents.joinSession, {
        lessonId,
        groupId,
        role: 'teacher' as UserRole,
        displayName: teacherName,
      }, (response: any) => {
        setIsLoading(false);

        if (response.success) {
          setSessionId(lessonId);
          setSessionCode(`${lessonId}-${groupId}`);
          setIsJoined(true);
          setCurrentActivity(response.session?.currentActivityIndex?.toString() || '0');

          if (response.session?.students) {
            setStudents(response.session.students);
          }
        } else {
          setError(response.error || 'Failed to create session');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [isConnected, socket, role]);

  // Join existing session (student)
  const joinSession = useCallback(async (lessonId: string, groupId: number, studentName: string) => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }

    setIsLoading(true);
    setError(null);

    socket.emit(API_CONFIG.socketEvents.joinSession, {
      lessonId,
      groupId,
      displayName: studentName,
      role: role,
    }, (response: any) => {
      setIsLoading(false);

      if (response.success) {
        setSessionId(lessonId);
        setSessionCode(`${lessonId}-${groupId}`);
        setIsJoined(true);
        setCurrentActivity(response.session?.currentActivityIndex?.toString() || '0');
      } else {
        setError(response.error || 'Failed to join session');
      }
    });
  }, [socket, isConnected, role]);

  // Change activity (teacher only)
  const changeActivity = useCallback((activityIndex: number) => {
    if (!socket || !isJoined || role !== 'teacher') return;

    socket.emit(API_CONFIG.socketEvents.changeActivity, { activityIndex }, (response: any) => {
      if (!response.success) {
        setError(response.error || 'Failed to change activity');
      }
    });
  }, [socket, isJoined, role]);

  // Update progress (student)
  const updateProgress = useCallback((activityId: string, score: number, data?: any) => {
    if (!socket || !isJoined || role !== 'student') return;

    socket.emit(API_CONFIG.socketEvents.updateProgress, {
      activityId,
      score,
      data,
    });
  }, [socket, isJoined, role]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    setSessionId(null);
    setSessionCode(null);
    setIsJoined(false);
    setStudents([]);
    setCurrentActivity(null);
  }, [socket]);

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return;

    // Activity changed
    socket.on(API_CONFIG.socketEvents.activityChanged, ({ activityIndex }) => {
      setCurrentActivity(activityIndex.toString());
    });

    // Participant joined
    socket.on(API_CONFIG.socketEvents.participantJoined, ({ displayName, role: participantRole, totalStudents }) => {
      console.log(`[Session] ${displayName} (${participantRole}) joined. Total students: ${totalStudents}`);
    });

    // Participant left
    socket.on(API_CONFIG.socketEvents.participantLeft, ({ displayName, totalStudents }) => {
      console.log(`[Session] ${displayName} left. Total students: ${totalStudents}`);
    });

    // Student progress update
    socket.on(API_CONFIG.socketEvents.studentProgress, (progress: any) => {
      console.log('[Session] Student progress:', progress);
    });

    // Teacher left
    socket.on(API_CONFIG.socketEvents.teacherLeft, () => {
      console.log('[Session] Teacher left the session');
      setError('Teacher left the session');
    });

    return () => {
      socket.off(API_CONFIG.socketEvents.activityChanged);
      socket.off(API_CONFIG.socketEvents.participantJoined);
      socket.off(API_CONFIG.socketEvents.participantLeft);
      socket.off(API_CONFIG.socketEvents.studentProgress);
      socket.off(API_CONFIG.socketEvents.teacherLeft);
    };
  }, [socket]);

  return {
    sessionId,
    sessionCode,
    currentActivity,
    students,
    isJoined,
    isLoading,
    error,
    createSession,
    joinSession,
    changeActivity,
    updateProgress,
    leaveSession,
  };
};
