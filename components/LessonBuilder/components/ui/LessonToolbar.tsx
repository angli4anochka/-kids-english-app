/**
 * Панель инструментов для управления уроком
 */

import { useNavigate } from '@/utils/routing-adapter';
import { useAuth } from '../../../contexts/AuthContext';

export interface LessonToolbarProps {
  title: string;
  totalActivities: number;
  isSaving: boolean;
  onSave: () => void;
  onTitleChange?: (title: string) => void;
  editingTitleId: string | null;
  editingTitleValue: string;
  onStartEditTitle: () => void;
  onUpdateEditValue: (value: string) => void;
  onSaveTitle: () => void;
  onCancelEditTitle: () => void;
}

export const LessonToolbar = ({
  title,
  totalActivities,
  isSaving,
  onSave,
  editingTitleId,
  editingTitleValue,
  onStartEditTitle,
  onUpdateEditValue,
  onSaveTitle,
  onCancelEditTitle,
}: LessonToolbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      {/* Lesson Title */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        {editingTitleId === 'lesson-title' ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editingTitleValue}
              onChange={(e) => onUpdateEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg text-xl font-bold"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={onSaveTitle}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                ✓ Сохранить
              </button>
              <button
                onClick={onCancelEditTitle}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
              >
                ✕ Отмена
              </button>
            </div>
          </div>
        ) : (
          <h1
            className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-purple-600"
            onClick={onStartEditTitle}
            title="Нажмите для редактирования"
          >
            {title}
          </h1>
        )}
      </div>

      {/* Points Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-xl">
        <div className="text-sm text-gray-600 text-center">
          За урок можно заработать максимум{' '}
          <span className="font-bold text-purple-600">{totalActivities * 10}</span> баллов
        </div>
      </div>

      {/* Save and Back Buttons */}
      <div className="mt-6 space-y-2">
        {user?.role === 'teacher' && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              isSaving
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить урок'}
          </button>
        )}
        <button
          onClick={() => navigate('/teacher/lessons')}
          className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          ← Назад к урокам
        </button>
      </div>
    </div>
  );
};
