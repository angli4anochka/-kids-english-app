/**
 * Хук для операций изменения данных урока (mutations)
 */

import { useState } from 'react';
import type { Activity } from '../types/lesson.types';

export interface UseLessonMutationsProps {
  currentLessonId: string | null;
  currentGroupId: number | null;
  islandId: string | undefined;
  lessonNumber: string | undefined;
  title: string;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  setSelectedActivity: (activity: Activity | null) => void;
  setIsSaving: (isSaving: boolean) => void;
}

export const useLessonMutations = ({
  currentLessonId,
  currentGroupId,
  islandId,
  lessonNumber,
  title,
  activities,
  setActivities,
  setSelectedActivity,
  setIsSaving,
}: UseLessonMutationsProps) => {
  // Save lesson to database
  const saveLesson = async () => {
    setIsSaving(true);
    try {
      const islandNumber = islandId ? parseInt(islandId.replace('island-', '')) : 1;

      let savedLesson;

      if (currentLessonId) {
        // Update existing lesson
        console.log('Updating existing lesson:', currentLessonId);
        const lessonResponse = await fetch(`/kids-api/lessons/${currentLessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            description: `Урок ${lessonNumber}`,
          }),
        });

        const lessonResult = await lessonResponse.json();
        if (!lessonResult.success) {
          throw new Error(lessonResult.error || 'Failed to update lesson');
        }
        savedLesson = lessonResult.data;
      } else {
        // Create new lesson
        console.log('Creating new lesson');
        const lessonResponse = await fetch('/kids-api/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            description: `Урок ${lessonNumber}`,
            islandId: islandNumber,
            emoji: '📚',
            groupId: currentGroupId,
          }),
        });

        const lessonResult = await lessonResponse.json();
        if (!lessonResult.success) {
          throw new Error(lessonResult.error || 'Failed to create lesson');
        }
        savedLesson = lessonResult.data;
      }

      // Delete old activities before saving new ones
      console.log('Deleting old activities for lesson:', savedLesson.id);
      const deleteResponse = await fetch(`/kids-api/lessons/${savedLesson.id}/activities`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!deleteResponse.ok) {
        console.warn('Failed to delete old activities, continuing anyway');
      }

      // Save all activities
      console.log('Saving', activities.length, 'activities...');
      for (const activity of activities) {
        const activityResponse = await fetch(`/kids-api/lessons/${savedLesson.id}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: activity.type,
            title: activity.title,
            subtitle: activity.subtitle || '',
            contentUrl: activity.videoUrl || activity.wordwallUrl || activity.geniallyUrl || activity.imageUrl || (activity as any).presentationUrl || null,
            audioUrl: activity.audioUrl || null,
            contentData: {
              imageUrl: activity.imageUrl,
              videoUrl: activity.videoUrl,
              wordwallUrl: activity.wordwallUrl,
              geniallyUrl: activity.geniallyUrl,
              audioUrl: activity.audioUrl,
              dragTextData: activity.dragTextData,
              presentationType: (activity as any).presentationType,
              presentationUrl: (activity as any).presentationUrl,
              currentSlide: (activity as any).currentSlide,
              isCompleted: activity.isCompleted,
              tags: activity.tags,
              content: activity.content,
              snakeWordConfig: activity.snakeWordConfig,
              letterTraceConfig: activity.letterTraceConfig,
              letterRaceConfig: activity.letterRaceConfig,
              letterMazeConfig: activity.letterMazeConfig,
            },
            points: activity.points,
          }),
        });

        const activityResult = await activityResponse.json();

        if (!activityResult.success) {
          console.error('Failed to save activity:', activity.title);
        } else {
          console.log('Saved activity:', activity.title);
        }
      }

      console.log('Successfully saved all activities to database');
      alert('Урок успешно сохранен на сервер!');
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Ошибка при сохранении урока: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Edit activity (optimistic update + server sync). When the activity has a temp
  // id (Date.now()) it was never persisted — POST instead of PUT and swap in the
  // returned UUID locally.
  const editActivity = async (activity: Activity) => {
    setActivities(activities.map(a => (a.id === activity.id ? activity : a)));
    setSelectedActivity(activity);

    if (!currentLessonId || !activity.id) return;

    const body = {
      type: activity.type,
      title: activity.title,
      subtitle: activity.subtitle,
      points: activity.points,
      contentUrl: activity.imageUrl || activity.audioUrl || (activity as any).videoUrl || (activity as any).content_url,
      contentData: {
        ...activity.contentData,
        letterTraceConfig: activity.letterTraceConfig,
        letterRaceConfig: activity.letterRaceConfig,
        letterMazeConfig: activity.letterMazeConfig,
        snakeWordConfig: activity.snakeWordConfig,
      },
    };

    const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

    try {
      if (isUuid(String(activity.id))) {
        console.log('PUT activity', activity.id);
        const response = await fetch(`/kids-api/lessons/${currentLessonId}/activities/${activity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!result.success) {
          console.error('Failed to save activity:', result.error || response.status);
        }
      } else {
        console.log('POST activity (had temp id)', activity.id);
        const response = await fetch(`/kids-api/lessons/${currentLessonId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (response.ok) {
          const created = await response.json();
          const newId = created?.id;
          if (newId) {
            setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, id: newId } : a));
            // Also update selected activity reference so subsequent edits use the UUID
            setSelectedActivity({ ...activity, id: newId });
          }
        } else {
          const err = await response.json().catch(() => ({}));
          console.error('Failed to create activity:', err.error || response.status);
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  // Delete activity
  const deleteActivity = (id: string) => {
    const newActivities = activities.filter(a => a.id !== id);
    setActivities(newActivities);

    // If deleted activity was selected, select first activity
    if (activities.find(a => a.id === id)?.id === id) {
      setSelectedActivity(newActivities[0] || null);
    }
  };

  // Add new activity
  const addActivity = (newActivity: Activity) => {
    setActivities([...activities, newActivity]);
    setSelectedActivity(newActivity);
  };

  // Reorder activities (drag and drop) + persist to backend
  const reorderActivities = async (dragIndex: number, dropIndex: number) => {
    const newActivities = [...activities];
    const [removed] = newActivities.splice(dragIndex, 1);
    newActivities.splice(dropIndex, 0, removed);
    setActivities(newActivities);

    if (currentLessonId) {
      try {
        const { lessonService } = await import('../../../services/lessonService');
        await lessonService.reorderActivities(
          currentLessonId,
          newActivities.map((a) => a.id).filter(Boolean) as string[]
        );
      } catch (err) {
        console.error('[LessonBuilder] Failed to persist activity order:', err);
      }
    }
  };

  return {
    saveLesson,
    editActivity,
    deleteActivity,
    addActivity,
    reorderActivities,
  };
};
