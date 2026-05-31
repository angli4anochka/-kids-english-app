import type { Activity } from '../../../types';

interface CompleteActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения завершающей активности
 * Показывает сообщение о завершении урока или раздела
 */
const CompleteActivityRenderer = ({
  activity,
}: CompleteActivityRendererProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center p-12 max-w-2xl">
        <div className="text-8xl mb-6">🎉</div>
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          {activity.title || 'Урок завершен!'}
        </h2>
        {activity.subtitle && (
          <p className="text-xl text-gray-600 mb-6">{activity.subtitle}</p>
        )}
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
          <p className="text-lg text-gray-700">
            Отличная работа! Вы завершили все задания.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteActivityRenderer;
