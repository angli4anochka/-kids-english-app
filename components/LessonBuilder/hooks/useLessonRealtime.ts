/**
 * Хук для real-time синхронизации урока через WebSocket
 */

import { useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import type { Activity } from '../types/lesson.types';
import { useAuth } from '../../../contexts/AuthContext';
import { useSession } from '../../../hooks/useSession';
import { useSocket } from '../../../hooks/useSocket';

export interface UseLessonRealtimeProps {
  currentLessonId: string | null;
  currentGroupId: number | null;
  activities: Activity[];
  selectedActivity: Activity | null;
  isViewMode: boolean;
  isInteractiveEnabled: boolean;
  setSelectedActivity: (activity: Activity | null) => void;
  setIsInteractiveEnabled: (isInteractiveEnabled: boolean) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setTransitionDirection: (direction: 'left' | 'right') => void;
}

export const useLessonRealtime = ({
  currentLessonId,
  currentGroupId,
  activities,
  selectedActivity,
  isViewMode,
  isInteractiveEnabled,
  setSelectedActivity,
  setIsInteractiveEnabled,
  setIsTransitioning,
  setTransitionDirection,
}: UseLessonRealtimeProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // WebSocket session for live lesson
  const {
    currentActivity: sessionActivity,
    isJoined,
    isLoading: isSessionLoading,
    error: sessionError,
    createSession,
    changeActivity,
    joinSession,
    students: sessionStudents,
  } = useSession();

  // WebSocket for navigation sync
  const { socket, isConnected } = useSocket();

  // Функция для воспроизведения звука "whoosh"
  const playTransitionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // Функция для плавного переключения активности
  const switchActivity = async (newActivity: Activity | null, direction: 'left' | 'right' = 'right') => {
    if (!newActivity) return;

    // Студенты НЕ могут переключать активности вручную
    if (user?.role === 'student') {
      console.log('Students cannot manually switch activities');
      return;
    }

    playTransitionSound();

    setTransitionDirection(direction);
    setIsTransitioning(true);

    // Если учитель переключает - обновляем состояние на сервере
    if (user?.role === 'teacher' && currentLessonId) {
      const activityIndex = activities.findIndex(a => a.id === newActivity.id);
      try {
        await fetch(`/kids-api/lessons/${currentLessonId}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentActivityIndex: activityIndex }),
        });
        console.log('Teacher switched to activity index:', activityIndex);

        // Оповестить студентов через WebSocket
        if (isJoined) {
          changeActivity(activityIndex);
          console.log('Broadcasting activity change to students via WebSocket');
        }
      } catch (error) {
        console.error('Error updating lesson state:', error);
      }
    }

    setTimeout(() => {
      setSelectedActivity(newActivity);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  // Auto-join session for students when lesson loads
  useEffect(() => {
    if (user?.role === 'student' && currentLessonId && currentGroupId && user?.displayName && !isJoined) {
      console.log('[Student] Auto-joining lesson session:', currentLessonId, 'group:', currentGroupId);
      joinSession(currentLessonId, currentGroupId, user.displayName);
    }
  }, [user, currentLessonId, currentGroupId, isJoined, joinSession]);

  // Listen for navigation commands from teacher (for students)
  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'student') return;

    const handleNavigateToLesson = ({ url }: { url: string }) => {
      console.log('[LessonBuilder] Student received navigate command:', url);
      navigate(url);
    };

    socket.on('navigate-to-lesson', handleNavigateToLesson);

    return () => {
      socket.off('navigate-to-lesson', handleNavigateToLesson);
    };
  }, [socket, isConnected, user?.role, navigate]);

  // Listen to activity changes from teacher via WebSocket
  useEffect(() => {
    if (user?.role === 'student' && sessionActivity !== null && activities.length > 0) {
      const activityIndex = parseInt(sessionActivity);
      const newActivity = activities[activityIndex];

      if (newActivity && newActivity.id !== selectedActivity?.id) {
        console.log('[Student] Teacher changed activity to index:', activityIndex);
        playTransitionSound();

        setTransitionDirection('right');
        setIsTransitioning(true);

        setTimeout(() => {
          setSelectedActivity(newActivity);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 300);
      }
    }
  }, [sessionActivity, activities, user, selectedActivity, setSelectedActivity, setIsTransitioning, setTransitionDirection]);

  // Enable interactive mode
  const enableInteractive = async () => {
    if (user?.role !== 'teacher' || !currentLessonId) return;

    setIsInteractiveEnabled(true);

    try {
      await fetch(`/kids-api/lessons/${currentLessonId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInteractiveEnabled: true }),
      });
      console.log('Interactive mode enabled');
    } catch (error) {
      console.error('Error enabling interactive mode:', error);
    }
  };

  // Disable interactive mode
  const disableInteractive = async () => {
    if (user?.role !== 'teacher' || !currentLessonId) return;

    setIsInteractiveEnabled(false);

    try {
      await fetch(`/kids-api/lessons/${currentLessonId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInteractiveEnabled: false }),
      });
      console.log('Interactive mode disabled');
    } catch (error) {
      console.error('Error disabling interactive mode:', error);
    }
  };

  return {
    // WebSocket state
    isJoined,
    isSessionLoading,
    sessionError,
    sessionStudents,

    // Methods
    switchActivity,
    createSession,
    changeActivity,
    joinSession,
    enableInteractive,
    disableInteractive,
  };
};
