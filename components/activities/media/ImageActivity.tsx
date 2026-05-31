import React from 'react';
import type { ImageActivity as ImageActivityType } from '../../../types/activity.types';
import SyncedImageWithAudio from '../../LessonBuilder/SyncedImageWithAudio';

interface ImageActivityProps {
  activity: ImageActivityType;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  onEdit?: (activity: ImageActivityType) => void;
}

const ImageActivity: React.FC<ImageActivityProps> = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  onEdit,
}) => {
  // В режиме просмотра - картинка с аудио синхронизацией
  if (isViewMode && activity.contentUrl) {
    return (
      <SyncedImageWithAudio
        imageUrl={activity.contentUrl}
        audioUrl={activity.audioUrl}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        activityId={activity.id}
      />
    );
  }

  // Режим редактирования
  if (!isViewMode) {
    return (
      <div className="flex flex-col items-center h-full justify-center">
        {activity.contentUrl ? (
          <div className="w-full h-full">
            <img
              src={activity.contentUrl}
              alt={activity.title || 'Activity image'}
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => onEdit?.({ ...activity, contentUrl: '' })}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mt-4"
            >
              Удалить картинку
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-xl mb-4 text-gray-700">Загрузите картинку</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      onEdit?.({
                        ...activity,
                        contentUrl: event.target?.result as string
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id={`image-upload-${activity.id}`}
              />
              <label
                htmlFor={`image-upload-${activity.id}`}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors cursor-pointer inline-block"
              >
                Выбрать файл
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback для режима просмотра без изображения
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">🖼️</div>
        <p className="text-xl text-gray-600">Изображение не загружено</p>
      </div>
    </div>
  );
};

export default ImageActivity;