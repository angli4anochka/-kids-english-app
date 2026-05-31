import React from 'react';
import type { LetterRaceActivity as LetterRaceActivityType } from '../../../types/activity.types';
import LetterRace from '../../LessonBuilder/LetterRaceGame';

interface LetterRaceActivityProps {
  activity: LetterRaceActivityType;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  isInteractive?: boolean;
  onEdit?: (activity: LetterRaceActivityType) => void;
  onComplete?: () => void;
}

const LetterRaceActivity: React.FC<LetterRaceActivityProps> = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  isInteractive = false,
  onEdit,
  onComplete,
}) => {
  const letters = activity.contentData?.letters || [];
  const speed = activity.contentData?.speed || 3;

  // В режиме просмотра - показываем игру
  if (isViewMode && letters.length > 0) {
    const isEnabled = isTeacher || isInteractive;

    return (
      <LetterRace
        config={{
          title: activity.title || 'Letter Race',
          subtitle: activity.subtitle || '',
          letterA: letters[0] || 'A',
          letterB: letters[1] || 'B',
          targetGoal: speed * 10,
        }}
        onComplete={onComplete}
      />
    );
  }

  // Режим редактирования
  if (!isViewMode) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <h3 className="text-xl font-semibold mb-4">Настройки Letter Race</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Буквы для игры (через запятую)
            </label>
            <input
              type="text"
              value={letters.join(', ')}
              onChange={(e) => {
                const newLetters = e.target.value
                  .split(',')
                  .map(l => l.trim())
                  .filter(l => l.length > 0);
                onEdit?.({
                  ...activity,
                  contentData: {
                    ...activity.contentData,
                    letters: newLetters,
                  },
                });
              }}
              placeholder="A, B, C, D"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Скорость (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => {
                onEdit?.({
                  ...activity,
                  contentData: {
                    ...activity.contentData,
                    speed: Number(e.target.value),
                  },
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {letters.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                Добавьте буквы для игры
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">🏃</div>
        <p className="text-xl text-gray-600">Letter Race</p>
        <p className="text-gray-500 mt-2">Не настроена</p>
      </div>
    </div>
  );
};

export default LetterRaceActivity;