import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useNavigate } from '@/utils/routing-adapter';
import type {
  ActivityChangeEvent,
  InteractiveToggleEvent,
  NavigateEvent
} from '../types/activity.types';

interface UseLessonSocketProps {
  lessonId?: string;
  groupId?: number;
  isTeacher: boolean;
  onActivityChange?: (newIndex: number) => void;
  onInteractiveToggle?: (isEnabled: boolean) => void;
}

/**
 * Custom hook for managing WebSocket communication in lessons
 * Handles navigation, activity changes, and interactive mode toggling
 */
export const useLessonSocket = ({
  lessonId,
  groupId,
  isTeacher,
  onActivityChange,
  onInteractiveToggle,
}: UseLessonSocketProps) => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Listen for navigation events (students only)
  useEffect(() => {
    if (!socket || !isConnected || isTeacher) return;

    const handleNavigateToLesson = (event: { url: string }) => {
      console.log('[useLessonSocket] Student received navigate-to-lesson:', event.url);

      if (event.url && event.url !== window.location.pathname + window.location.search) {
        console.log('[useLessonSocket] Navigating student to:', event.url);
        navigate(event.url);
      }
    };

    socket.on('navigate-to-lesson', handleNavigateToLesson);

    return () => {
      socket.off('navigate-to-lesson', handleNavigateToLesson);
    };
  }, [socket, isConnected, isTeacher, navigate]);

  // Listen for activity change events
  useEffect(() => {
    if (!socket || !isConnected || !lessonId) return;

    const handleActivityChange = (event: ActivityChangeEvent) => {
      if (event.lessonId === lessonId) {
        console.log('[useLessonSocket] Activity changed to index:', event.newIndex);
        onActivityChange?.(event.newIndex);
      }
    };

    socket.on('activity-change', handleActivityChange);

    return () => {
      socket.off('activity-change', handleActivityChange);
    };
  }, [socket, isConnected, lessonId, onActivityChange]);

  // Listen for interactive mode toggle events
  useEffect(() => {
    if (!socket || !isConnected || !lessonId || isTeacher) return;

    const handleInteractiveToggle = (event: InteractiveToggleEvent) => {
      if (event.lessonId === lessonId) {
        console.log('[useLessonSocket] Interactive mode toggled:', event.isEnabled);
        onInteractiveToggle?.(event.isEnabled);
      }
    };

    socket.on('interactive-toggle', handleInteractiveToggle);

    return () => {
      socket.off('interactive-toggle', handleInteractiveToggle);
    };
  }, [socket, isConnected, lessonId, isTeacher, onInteractiveToggle]);

  // Send navigate-to-lesson event (teacher only)
  const sendNavigateToLesson = useCallback((url: string) => {
    if (!socket || !isConnected || !isTeacher || !lessonId || !groupId) {
      console.warn('[useLessonSocket] Cannot send navigate event - missing requirements');
      return;
    }

    const event: NavigateEvent = {
      lessonId,
      groupId,
      url,
    };

    console.log('[useLessonSocket] Teacher sending navigate-to-lesson:', event);
    socket.emit('navigate-to-lesson', event);
  }, [socket, isConnected, isTeacher, lessonId, groupId]);

  // Send activity change event (teacher only)
  const sendActivityChange = useCallback((newIndex: number) => {
    if (!socket || !isConnected || !isTeacher || !lessonId || !groupId) {
      console.warn('[useLessonSocket] Cannot send activity change - missing requirements');
      return;
    }

    const event: ActivityChangeEvent = {
      lessonId,
      groupId,
      newIndex,
    };

    console.log('[useLessonSocket] Teacher sending activity-change:', event);
    socket.emit('activity-change', event);
  }, [socket, isConnected, isTeacher, lessonId, groupId]);

  // Send interactive toggle event (teacher only)
  const sendInteractiveToggle = useCallback((isEnabled: boolean) => {
    if (!socket || !isConnected || !isTeacher || !lessonId || !groupId) {
      console.warn('[useLessonSocket] Cannot send interactive toggle - missing requirements');
      return;
    }

    const event: InteractiveToggleEvent = {
      lessonId,
      groupId,
      isEnabled,
    };

    console.log('[useLessonSocket] Teacher sending interactive-toggle:', event);
    socket.emit('interactive-toggle', event);
  }, [socket, isConnected, isTeacher, lessonId, groupId]);

  // Join lesson session
  const joinLessonSession = useCallback(() => {
    if (!socket || !isConnected || !lessonId || !groupId) return;

    const sessionData = {
      lessonId,
      groupId,
      role: isTeacher ? 'teacher' : 'student',
    };

    console.log('[useLessonSocket] Joining lesson session:', sessionData);
    socket.emit('join-lesson-session', sessionData);
  }, [socket, isConnected, lessonId, groupId, isTeacher]);

  // Leave lesson session
  const leaveLessonSession = useCallback(() => {
    if (!socket || !isConnected || !lessonId || !groupId) return;

    const sessionData = {
      lessonId,
      groupId,
    };

    console.log('[useLessonSocket] Leaving lesson session:', sessionData);
    socket.emit('leave-lesson-session', sessionData);
  }, [socket, isConnected, lessonId, groupId]);

  // Send progress update (student only)
  const sendProgressUpdate = useCallback((activityIndex: number, score: number = 0, completed: boolean = false) => {
    if (!socket || !isConnected || isTeacher) return;

    const progressData = {
      activityIndex,
      score,
      completed,
    };

    console.log('[useLessonSocket] Student sending progress update:', progressData);
    socket.emit('update-progress', progressData);
  }, [socket, isConnected, isTeacher]);

  // Auto-join session on mount
  useEffect(() => {
    if (socket && isConnected && lessonId && groupId) {
      joinLessonSession();

      return () => {
        leaveLessonSession();
      };
    }
  }, [socket, isConnected, lessonId, groupId, joinLessonSession, leaveLessonSession]);

  return {
    isConnected,
    sendNavigateToLesson,
    sendActivityChange,
    sendInteractiveToggle,
    joinLessonSession,
    leaveLessonSession,
    sendProgressUpdate,
  };
};