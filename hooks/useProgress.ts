import { useState, useEffect } from 'react';
import type { UserProgress, TeamName } from '../types';

const STORAGE_KEY = 'kids-english-progress';

// Начальное состояние для нового пользователя
const createInitialProgress = (team: TeamName = 'lions'): UserProgress => ({
  userId: 'demo-user',
  userName: 'Ученик',
  team,
  completedIslands: [],
  currentIsland: 'island-1',
  islandProgress: {},
  totalPoints: 0,
});

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    // Загружаем из localStorage при инициализации
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Ошибка загрузки прогресса:', e);
        return createInitialProgress();
      }
    }
    return createInitialProgress();
  });

  // Сохраняем в localStorage при каждом изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Завершить этап
  const completeStage = (islandId: string, stageId: string, points: number) => {
    setProgress((prev) => {
      const islandProg = prev.islandProgress[islandId] || {
        completedStages: [],
        earnedPoints: 0,
      };

      // Проверяем, не завершён ли уже этап
      if (islandProg.completedStages.includes(stageId)) {
        return prev; // Уже завершён, не добавляем баллы повторно
      }

      return {
        ...prev,
        islandProgress: {
          ...prev.islandProgress,
          [islandId]: {
            ...islandProg,
            completedStages: [...islandProg.completedStages, stageId],
            earnedPoints: islandProg.earnedPoints + points,
          },
        },
        totalPoints: prev.totalPoints + points,
      };
    });
  };

  // Завершить остров целиком
  const completeIsland = (islandId: string) => {
    setProgress((prev) => ({
      ...prev,
      completedIslands: [...prev.completedIslands, islandId],
      currentIsland: undefined, // Сбрасываем текущий остров
    }));
  };

  // Начать остров
  const startIsland = (islandId: string) => {
    setProgress((prev) => ({
      ...prev,
      currentIsland: islandId,
      islandProgress: {
        ...prev.islandProgress,
        [islandId]: prev.islandProgress[islandId] || {
          completedStages: [],
          earnedPoints: 0,
        },
      },
    }));
  };

  // Установить команду (для учителя)
  const setTeam = (team: TeamName) => {
    setProgress((prev) => ({
      ...prev,
      team,
    }));
  };

  // Сбросить прогресс (для тестирования)
  const resetProgress = () => {
    setProgress(createInitialProgress());
  };

  // Получить прогресс конкретного острова
  const getIslandProgress = (islandId: string) => {
    return progress.islandProgress[islandId] || {
      completedStages: [],
      earnedPoints: 0,
    };
  };

  // Проверить, завершён ли этап
  const isStageCompleted = (islandId: string, stageId: string) => {
    const islandProg = progress.islandProgress[islandId];
    return islandProg?.completedStages.includes(stageId) || false;
  };

  return {
    progress,
    completeStage,
    completeIsland,
    startIsland,
    setTeam,
    resetProgress,
    getIslandProgress,
    isStageCompleted,
  };
};
