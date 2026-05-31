import { useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import type { Activity } from '../types';
import { playTransitionSound } from '../utils/activityUtils';

interface UseLessonSyncParams {
  userRole?: 'teacher' | 'student';
  currentLessonId: string | null;
  activities: Activity[];
  selectedActivity: Activity | null;
  isInteractiveEnabled: boolean;
  socket?: any;
  isConnected?: boolean;
  sessionActivity: string | null;
  setSelectedActivity: (activity: Activity) => void;
  setIsInteractiveEnabled: (enabled: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setTransitionDirection: (direction: 'left' | 'right') => void;
}

/**
 * Hook for syncing lesson state between teacher and students
 * Handles activity sync, navigation sync, and interactive permission sync
 */
export const useLessonSync = ({
  userRole,
  currentLessonId,
  activities,
  selectedActivity,
  isInteractiveEnabled,
  socket,
  isConnected,
  sessionActivity,
  setSelectedActivity,
  setIsInteractiveEnabled,
  setIsTransitioning,
  setTransitionDirection,
}: UseLessonSyncParams) => {
  const navigate = useNavigate();

  // Listen for navigation commands from teacher (for students)
  useEffect(() => {
    if (!socket || !isConnected || userRole !== 'student') return;

    const handleNavigateToLesson = ({ url }: { url: string }) => {
      console.log('[LessonBuilder] Student received navigate command:', url);
      // Navigate to the lesson URL provided by teacher
      navigate(url);
    };

    socket.on('navigate-to-lesson', handleNavigateToLesson);

    return () => {
      socket.off('navigate-to-lesson', handleNavigateToLesson);
    };
  }, [socket, isConnected, userRole, navigate]);

  // Sync activity with teacher for students (polling every 1 second for instant sync)
  useEffect(() => {
    if (userRole !== 'student' || !currentLessonId || activities.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/kids-api/lessons/${currentLessonId}/state`);
        const data = await response.json();

        if (data.success) {
          const serverIndex = data.data.currentActivityIndex;
          const serverInteractive = data.data.isInteractiveEnabled;
          const currentIndex = activities.findIndex(a => a.id === selectedActivity?.id);

          // Update interactive permission
          if (serverInteractive !== isInteractiveEnabled) {
            console.log('Student syncing interactive permission:', serverInteractive);
            setIsInteractiveEnabled(serverInteractive);
          }

          // INSTANT SYNC: Students immediately follow teacher's activity index
          if (serverIndex !== currentIndex && activities[serverIndex]) {
            console.log('Student syncing to activity index:', serverIndex);
            setSelectedActivity(activities[serverIndex]);
          }
        }
      } catch (error) {
        console.error('Error syncing lesson state:', error);
      }
    }, 1000); // Poll every 1 second for faster sync

    return () => {
      clearInterval(interval);
    };
  }, [userRole, currentLessonId, activities, selectedActivity, isInteractiveEnabled, setSelectedActivity, setIsInteractiveEnabled]);

  // Listen to activity changes from teacher via WebSocket
  useEffect(() => {
    if (userRole !== 'student' || sessionActivity === null || activities.length === 0) return;

    const activityIndex = parseInt(sessionActivity);
    const newActivity = activities[activityIndex];

    if (newActivity && newActivity.id !== selectedActivity?.id) {
      console.log('[Student] Teacher changed activity to index:', activityIndex);
      // Воспроизводим звук
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
  }, [sessionActivity, activities, userRole, selectedActivity, setSelectedActivity, setIsTransitioning, setTransitionDirection]);
};
