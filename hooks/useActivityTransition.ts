import { useState } from 'react';
import type { Activity } from '../types';
import { playTransitionSound } from '../utils/activityUtils';

interface UseActivityTransitionReturn {
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right';
  switchActivity: (newActivity: Activity | null, direction?: 'left' | 'right') => Promise<void>;
}

interface UseActivityTransitionParams {
  userRole?: 'teacher' | 'student';
  currentLessonId: string | null;
  activities: Activity[];
  isJoined: boolean;
  changeActivity: (index: number) => void;
}

/**
 * Hook for managing smooth activity transitions with animations
 */
export const useActivityTransition = ({
  userRole,
  currentLessonId,
  activities,
  isJoined,
  changeActivity,
}: UseActivityTransitionParams): UseActivityTransitionReturn => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');

  const switchActivity = async (newActivity: Activity | null, direction: 'left' | 'right' = 'right') => {
    if (!newActivity) return;

    // Студенты НЕ могут переключать активности вручную
    if (userRole === 'student') {
      console.log('Students cannot manually switch activities');
      return;
    }

    // Воспроизводим звук
    playTransitionSound();

    setTransitionDirection(direction);
    setIsTransitioning(true);

    // Если учитель переключает - обновляем состояние на сервере
    if (userRole === 'teacher' && currentLessonId) {
      const activityIndex = activities.findIndex(a => a.id === newActivity.id);
      try {
        await fetch(`/kids-api/lessons/${currentLessonId}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentActivityIndex: activityIndex })
        });
        console.log('Teacher switched to activity index:', activityIndex);

        // Оповестить студентов через WebSocket о смене активности
        if (isJoined) {
          changeActivity(activityIndex);
          console.log('Broadcasting activity change to students via WebSocket');
        }
      } catch (error) {
        console.error('Error updating lesson state:', error);
      }
    }

    // Запускаем анимацию выхода, затем меняем активность и анимацию входа
    setTimeout(() => {
      // Activity will be updated by parent component
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  return {
    isTransitioning,
    transitionDirection,
    switchActivity,
  };
};
