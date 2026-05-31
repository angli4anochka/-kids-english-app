import React from 'react';
import type { VideoActivity as VideoActivityType } from '../../../types/activity.types';
import { parseVideoUrl, isYouTubeUrl } from '../../../utils/videoHelpers';
import SyncedVideoPlayer from '../../LessonBuilder/SyncedVideoPlayer';
import SyncedVideoWithAudio from '../../LessonBuilder/SyncedVideoWithAudio';
import TVFrame from '../../Shared/TVFrame';

interface VideoActivityProps {
  activity: VideoActivityType;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  onEdit?: (activity: VideoActivityType) => void;
}

const VideoActivity: React.FC<VideoActivityProps> = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  onEdit,
}) => {
  const videoUrl = activity.contentUrl;

  // В режиме просмотра - видео на весь экран
  if (isViewMode && videoUrl) {
    const videoInfo = parseVideoUrl(videoUrl, isTeacher);

    // Если YouTube - используем синхронизированный плеер
    if (videoInfo.platform === 'youtube') {
      return (
        <TVFrame>
          <SyncedVideoPlayer
            key={activity.id}
            videoUrl={videoUrl}
            isTeacher={isTeacher}
            lessonId={lessonId}
            groupId={groupId}
          />
        </TVFrame>
      );
    }

    // Для прямых видео файлов - используем SyncedVideoWithAudio
    if (videoInfo.platform === 'direct') {
      return (
        <SyncedVideoWithAudio
          videoUrl={videoUrl}
          audioUrl={activity.audioUrl}
          isTeacher={isTeacher}
          lessonId={lessonId}
          groupId={groupId}
          activityId={activity.id}
        />
      );
    }

    // Для VK и RuTube - обычный iframe
    if (videoInfo.embedUrl) {
      return (
        <TVFrame>
          <iframe
            src={videoInfo.embedUrl}
            className="w-full h-full"
            allowFullScreen
            title="Video player"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          />
        </TVFrame>
      );
    }

    // Если URL не распознан
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl text-gray-600">Не удалось загрузить видео</p>
        </div>
      </div>
    );
  }

  // Режим редактирования
  if (!isViewMode) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <VideoUrlEditor
            videoUrl={videoUrl || ''}
            onUrlChange={(url) => onEdit?.({ ...activity, contentUrl: url })}
          />
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">📹</div>
        <p className="text-xl text-gray-600">Видео не загружено</p>
      </div>
    </div>
  );
};

// Вспомогательный компонент для редактора URL
const VideoUrlEditor: React.FC<{
  videoUrl: string;
  onUrlChange: (url: string) => void;
}> = ({ videoUrl, onUrlChange }) => {
  const videoInfo = parseVideoUrl(videoUrl);

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ссылка на видео
        </label>
        <input
          type="text"
          placeholder="YouTube, VK Видео, RuTube или прямая ссылка на видео..."
          value={videoUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Поддерживаются: YouTube, VK Видео, RuTube, MP4/WebM файлы
        </p>
      </div>

      {videoUrl && (
        <div className="w-full">
          {videoInfo.isSupported && videoInfo.embedUrl ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={videoInfo.embedUrl}
                className="w-full h-full"
                allowFullScreen
                title="Video preview"
                allow="encrypted-media"
              />
            </div>
          ) : (
            <div className="border-2 border-red-300 bg-red-50 rounded-xl p-8 text-center">
              <p className="text-red-600 font-semibold mb-2">
                Не удалось распознать ссылку
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>YouTube:</strong> https://www.youtube.com/watch?v=VIDEO_ID</p>
                <p><strong>VK Видео:</strong> https://vk.com/video-123456_789012</p>
                <p><strong>RuTube:</strong> https://rutube.ru/video/VIDEO_ID/</p>
                <p><strong>Прямая ссылка:</strong> https://example.com/video.mp4</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!videoUrl && (
        <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📹</div>
          <p className="text-gray-600">Вставьте ссылку на видео выше</p>
          <p className="text-sm text-gray-500 mt-2">
            YouTube, VK Видео, RuTube или прямая ссылка
          </p>
        </div>
      )}
    </>
  );
};

export default VideoActivity;