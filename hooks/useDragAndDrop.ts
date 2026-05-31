import { useState } from 'react';
import type { Activity } from '../types';

/**
 * Hook for managing drag and drop functionality for reordering activities
 */
export const useDragAndDrop = () => {
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, activity: Activity) => {
    e.stopPropagation();
    setDraggedActivity(activity);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', activity.id);
  };

  const handleDragOver = (e: React.DragEvent, index: number, activities: Activity[]) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedActivity && activities[index].id !== draggedActivity.id) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    dropIndex: number,
    activities: Activity[]
  ): Activity[] | null => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedActivity) return null;

    const dragIndex = activities.findIndex(a => a.id === draggedActivity.id);
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedActivity(null);
      setDragOverIndex(null);
      return null;
    }

    // Reorder the activities array
    const newActivities = [...activities];
    const [removed] = newActivities.splice(dragIndex, 1);
    newActivities.splice(dropIndex, 0, removed);

    setDraggedActivity(null);
    setDragOverIndex(null);

    return newActivities;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedActivity(null);
    setDragOverIndex(null);
  };

  return {
    draggedActivity,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};
