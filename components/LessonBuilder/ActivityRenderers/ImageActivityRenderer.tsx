import SyncedImageWithAudio from '../SyncedImageWithAudio';
import type { Activity } from '../../../types';

interface ImageActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения image-активности с опциональным аудио
 */
const ImageActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  onEdit,
}: ImageActivityRendererProps) => {
  // В режиме просмотра - картинка в рамке телевизора
  if (isViewMode && activity.imageUrl) {
    return (
      <SyncedImageWithAudio
        imageUrl={activity.imageUrl}
        audioUrl={activity.audioUrl}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        activityId={activity.id}
      />
    );
  }

  // Режим редактирования
  return (
    <div className="flex h-full flex-col items-center gap-6 overflow-y-auto p-6">
      {activity.imageUrl ? (
        <div className="flex w-full flex-col gap-4">
          <img
            src={activity.imageUrl}
            alt="Uploaded"
            className="max-h-[55vh] w-full object-contain"
          />
          {!isViewMode && (
            <div className="flex gap-3">
              <button
                onClick={() => onEdit({ ...activity, imageUrl: undefined })}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Удалить картинку
              </button>
            </div>
          )}
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
                    onEdit({
                      ...activity,
                      imageUrl: event.target?.result as string,
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors cursor-pointer inline-block"
            >
              Выбрать файл
            </label>
          </div>
        </div>
      )}

      {/* Audio upload section */}
      <div className="w-full max-w-2xl">
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🎵</div>
          <p className="text-lg mb-3 text-gray-700">Аудио для истории (опционально)</p>
          {activity.audioUrl ? (
            <div className="flex flex-col gap-3 items-center">
              <audio controls src={activity.audioUrl} className="w-full max-w-md" />
              <button
                onClick={() => onEdit({ ...activity, audioUrl: undefined })}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Удалить аудио
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      onEdit({
                        ...activity,
                        audioUrl: event.target?.result as string,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="audio-upload-image"
              />
              <label
                htmlFor="audio-upload-image"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer inline-block"
              >
                Загрузить аудио
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageActivityRenderer;
