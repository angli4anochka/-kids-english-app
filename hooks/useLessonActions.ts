import { useState } from 'react';
import type { Activity } from '../types';

interface UseLessonActionsParams {
  islandId?: string;
  lessonNumber?: string;
  unitTitle: string;
  currentLessonId: string | null;
  currentGroupId: number | null;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  setSelectedActivity: (activity: Activity | null) => void;
}

interface UseLessonActionsReturn {
  isSaving: boolean;
  handleSelectTemplate: (templateId: string) => void;
  handleDeleteActivity: (id: string) => void;
  handleEditActivity: (activity: Activity) => Promise<void>;
  handleSaveLesson: () => Promise<void>;
  checkForActiveSession: () => Promise<void>;
}

/**
 * Hook for managing lesson actions (CRUD operations)
 * Handles adding, editing, deleting activities and saving lessons
 */
export const useLessonActions = ({
  islandId,
  lessonNumber,
  unitTitle,
  currentLessonId,
  currentGroupId,
  activities,
  setActivities,
  setSelectedActivity,
}: UseLessonActionsParams): UseLessonActionsReturn => {
  const [isSaving, setIsSaving] = useState(false);

  const getTemplateName = (templateId: string): string => {
    const names: Record<string, string> = {
      'insert-image': 'Картинка',
      'youtube-video': 'Видео YouTube',
      'internal-video': 'Внутреннее видео',
      'wordwall-game': 'Игра Wordwall',
      'genially': 'Genially',
      'presentation': 'Презентация',
      'drag-text': 'Перетаскивание слов',
      'fill-text': 'Заполнение пропусков',
      'choose-word': 'Выбор правильной формы',
      'drag-image': 'Слова к картинкам',
      'type-image': 'Подписи к картинкам',
      'select-image': 'Выбор слова к картинке',
      'test-no-timer': 'Тест без таймера',
      'test-timer': 'Тест с таймером',
      'interactive-iframe': 'Интерактивное упражнение',
      'snake-word': 'Snake Word Builder',
      'letter-trace': 'Электронные прописи',
      'letter-race': 'Гонки букв',
      'letter-maze': 'Letter Maze',
      'secret-key-quest': 'Секретный ключ',
      'letter-jump': 'Letter Jump',
      'bubble-grammar': 'Bubble Grammar Pop',
    };
    return names[templateId] || 'Активность';
  };

  const handleSelectTemplate = (templateId: string) => {
    // Map template IDs to activity types
    const templateMapping: Record<string, string> = {
      'insert-image': 'image',
      'youtube-video': 'video',
      'internal-video': 'internal-video',
      'wordwall-game': 'wordwall',
      'genially': 'genially',
      'presentation': 'presentation',
      'drag-text': 'drag-text',
      'fill-text': 'quiz',
      'choose-word': 'quiz',
      'drag-image': 'game',
      'type-image': 'game',
      'select-image': 'game',
      'test-no-timer': 'quiz',
      'test-timer': 'quiz',
      'interactive-iframe': 'game',
      'snake-word': 'snake-word',
      'letter-trace': 'letter-trace',
      'letter-race': 'letter-race',
      'letter-maze': 'letter-maze',
      'secret-key-quest': 'secret-key-quest',
      'letter-jump': 'letter-jump',
      'bubble-grammar': 'bubble-grammar',
    };

    const activityType = templateMapping[templateId] || 'quiz';

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: activityType,
      title: getTemplateName(templateId),
      subtitle: '',
      isCompleted: false,
      points: 10,
      tags: templateId === 'wordwall-game' ? ['Wordwall'] : templateId === 'genially' ? ['Genially'] : templateId === 'snake-word' ? ['Snake'] : templateId === 'letter-trace' ? ['Letter Trace'] : templateId === 'letter-race' ? ['Letter Race'] : templateId === 'letter-maze' ? ['Letter Maze'] : templateId === 'secret-key-quest' ? ['Quest'] : templateId === 'letter-jump' ? ['Letter Jump'] : templateId === 'bubble-grammar' ? ['Bubble', 'Grammar'] : undefined,
      snakeWordConfig: templateId === 'snake-word' ? {
        words: [],
        speedMs: 390,
        lives: 3,
        collectMode: 'letters-in-order' as const,
        wrongLetterPenalty: 'lose-life' as const,
        showHint: true,
      } : undefined,
      letterTraceConfig: templateId === 'letter-trace' ? {
        title: 'A words',
        subtitle: 'Follow the dots',
        rows: [
          { icon: '🔊', label: 'эй', text: 'A a', translation: 'letter A', desiredRepeats: 3, minRepeats: 2, scale: 1.0 },
        ],
      } : undefined,
      letterRaceConfig: templateId === 'letter-race' ? {
        title: 'Гонки B / D',
        subtitle: 'Рули машинкой и собирай только правильную букву',
        letterA: 'B',
        letterB: 'D',
        targetGoal: 10,
      } : undefined,
      letterMazeConfig: templateId === 'letter-maze' ? {
        title: 'Letter Maze',
        subtitle: 'Control: arrows, WASD or screen buttons. Correct letter: +1. Wrong letter: -1 and minus life.',
        targetLetters: ['A', 'B', 'C', 'D'],
        lives: 3,
      } : undefined,
    };

    setActivities([...activities, newActivity]);
    setSelectedActivity(newActivity);
  };

  const handleDeleteActivity = (id: string) => {
    const newActivities = activities.filter(a => a.id !== id);
    setActivities(newActivities);
    setSelectedActivity(newActivities[0] || null);
  };

  const handleEditActivity = async (activity: Activity) => {
    // Обновляем локальное состояние сразу для быстрого отклика
    setActivities(activities.map(a => a.id === activity.id ? activity : a));

    // Отправляем изменения на сервер
    if (currentLessonId && activity.id) {
      try {
        console.log('Saving activity to server:', activity.id, activity);

        const body = {
          type: activity.type,
          title: activity.title,
          subtitle: activity.subtitle,
          points: activity.points,
          contentUrl: activity.imageUrl || activity.audioUrl || (activity as any).videoUrl,
          contentData: {
            ...activity.contentData,
            letterTraceConfig: activity.letterTraceConfig,
            letterRaceConfig: activity.letterRaceConfig,
            letterMazeConfig: activity.letterMazeConfig,
            snakeWordConfig: activity.snakeWordConfig,
          },
        };

        const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

        if (isUuid(String(activity.id))) {
          const response = await fetch(`/kids-api/lessons/${currentLessonId}/activities/${activity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const result = await response.json();
          if (result.success) {
            console.log('Activity saved successfully');
          } else {
            console.error('Failed to save activity:', result.error);
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
              setActivities(activities.map(a => a.id === activity.id ? { ...a, id: newId } : a));
              setSelectedActivity({ ...activity, id: newId });
            }
            console.log('Activity created successfully', newId);
          } else {
            const err = await response.json().catch(() => ({}));
            console.error('Failed to create activity:', err.error || response.status);
          }
        }
      } catch (error) {
        console.error('Error saving activity:', error);
      }
    }
  };

  const handleSaveLesson = async () => {
    setIsSaving(true);
    try {
      // Преобразуем islandId из "island-1" в число 1
      const islandNumber = islandId ? parseInt(islandId.replace('island-', '')) : 1;

      // Update existing lesson or create new one
      let savedLesson;

      if (currentLessonId) {
        // Update existing lesson
        console.log('Updating existing lesson:', currentLessonId);
        const lessonResponse = await fetch(`/kids-api/lessons/${currentLessonId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: unitTitle || `Unit ${lessonNumber}`,
            description: `Урок ${lessonNumber}`,
          }),
        });

        const lessonResult = await lessonResponse.json();
        if (!lessonResult.success) {
          throw new Error(lessonResult.error || 'Failed to update lesson');
        }
        savedLesson = lessonResult.data;
      } else {
        // Create new lesson (should rarely happen)
        console.log('Creating new lesson');
        const lessonResponse = await fetch('/kids-api/lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: unitTitle || `Unit ${lessonNumber}`,
            description: `Урок ${lessonNumber}`,
            islandId: islandNumber,
            emoji: '📚',
            groupId: currentGroupId
          }),
        });

        const lessonResult = await lessonResponse.json();
        if (!lessonResult.success) {
          throw new Error(lessonResult.error || 'Failed to create lesson');
        }
        savedLesson = lessonResult.data;
      }

      // Получаем существующие активности
      console.log('Fetching existing activities for lesson:', savedLesson.id);
      const existingActivitiesResponse = await fetch(`/kids-api/lessons/${savedLesson.id}/activities`);
      const existingActivitiesData = await existingActivitiesResponse.json();
      const existingActivities = existingActivitiesData.success ? existingActivitiesData.data : [];

      console.log('Existing activities:', existingActivities.length);
      console.log('New activities:', activities.length);

      // Используем Set для отслеживания ID активностей, которые нужно сохранить
      const activitiesToKeep = new Set(activities.map(a => a.id));

      // Удаляем активности, которых больше нет в списке
      for (const existingActivity of existingActivities) {
        if (!activitiesToKeep.has(existingActivity.id)) {
          console.log('Deleting activity:', existingActivity.id);
          await fetch(`/kids-api/lessons/${savedLesson.id}/activities/${existingActivity.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Обновляем или создаём активности
      console.log('Saving', activities.length, 'activities...');
      const updatedActivities: Activity[] = [];

      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const activityData = {
          type: activity.type,
          title: activity.title,
          subtitle: activity.subtitle || '',
          contentUrl: activity.videoUrl || activity.wordwallUrl || activity.geniallyUrl || activity.imageUrl || (activity as any).presentationUrl || null,
          audioUrl: activity.audioUrl || null,
          contentData: {
            // All possible activity data fields
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
          order_index: i  // Сохраняем порядок
        };

        // Проверяем, существует ли уже эта активность (по UUID из базы данных)
        const existingActivity = existingActivities.find((a: any) => a.id === activity.id);

        let activityResponse;
        if (existingActivity) {
          // Обновляем существующую активность
          console.log('Updating activity:', activity.id, activity.title);
          activityResponse = await fetch(`/kids-api/lessons/${savedLesson.id}/activities/${activity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData),
          });
        } else {
          // Создаём новую активность
          console.log('Creating new activity:', activity.title);
          activityResponse = await fetch(`/kids-api/lessons/${savedLesson.id}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData),
          });
        }

        const activityResult = await activityResponse.json();

        // Backend может вернуть либо { success: true, data: {...} } либо просто {...}
        let savedActivity;
        if (activityResult.success) {
          savedActivity = activityResult.data;
        } else if (activityResult.id) {
          // Backend вернул объект активности напрямую
          savedActivity = activityResult;
        } else {
          console.error('Failed to save activity:', activity.title, activityResult);
          // Сохраняем активность с текущим ID, даже если не удалось сохранить
          updatedActivities.push(activity);
          continue;
        }

        console.log('Saved activity:', activity.title, savedActivity.id);
        // ВАЖНО: Обновляем ID активности на тот, что вернул сервер
        updatedActivities.push({
          ...activity,
          id: savedActivity.id  // Используем ID из базы данных
        });
      }

      // Обновляем локальный state с новыми ID
      setActivities(updatedActivities);

      console.log('Successfully saved all activities to database');

      console.log('Lesson saved to server:', savedLesson);

      alert('Урок успешно сохранен на сервер!');
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Ошибка при сохранении урока: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const checkForActiveSession = async () => {
    // Implementation moved from LessonBuilder
    // This function is currently not used in the refactored version
    // but kept for future reference
  };

  return {
    isSaving,
    handleSelectTemplate,
    handleDeleteActivity,
    handleEditActivity,
    handleSaveLesson,
    checkForActiveSession,
  };
};
