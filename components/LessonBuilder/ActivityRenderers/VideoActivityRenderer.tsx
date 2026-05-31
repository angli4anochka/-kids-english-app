import TVFrame from '../../Shared/TVFrame';
import SyncedVideoPlayer from '../SyncedVideoPlayer';
import SyncedVideoWithAudio from '../SyncedVideoWithAudio';
import { parseVideoUrl, extractYoutubeId } from '../utils/videoUtils';
import type { Activity } from '../../../types';
import type { Socket } from 'socket.io-client';

interface VideoActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  socket: Socket | null;
  isConnected: boolean;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения видео-активности
 * Поддерживает YouTube (с синхронизацией), VK, RuTube и прямые ссылки на видео
 */
const VideoActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  socket,
  isConnected,
  onEdit,
}: VideoActivityRendererProps) => {
  console.log('[VIDEO RENDER]', {
    isViewMode,
    videoUrl: activity.videoUrl,
    title: activity.title,
    audioUrl: activity.audioUrl,
  });

  // В режиме просмотра - видео на весь экран
  if (isViewMode && activity.videoUrl) {
    const parsedVideo = parseVideoUrl(activity.videoUrl, isTeacher);

    // Если YouTube - используем синхронизированный плеер
    if (parsedVideo.platform === 'youtube' && parsedVideo.supportsSync) {
      return (
        <TVFrame>
          <SyncedVideoPlayer
            key={activity.id}
            videoUrl={activity.videoUrl}
            isTeacher={isTeacher}
            lessonId={lessonId}
            groupId={groupId}
            socket={socket}
            isConnected={isConnected}
          />
        </TVFrame>
      );
    }

    // Для VK, RuTube - обычный iframe
    if (parsedVideo.platform === 'vk' || parsedVideo.platform === 'rutube') {
      return (
        <TVFrame>
          <iframe
            src={parsedVideo.embedUrl}
            className="w-full h-full"
            allowFullScreen
            title="Video player"
            allow="autoplay; fullscreen; encrypted-media"
          />
        </TVFrame>
      );
    }

    // Для прямых ссылок на видео файлы
    if (parsedVideo.platform === 'direct') {
      return (
        <SyncedVideoWithAudio
          videoUrl={activity.videoUrl}
          audioUrl={activity.audioUrl}
          isTeacher={isTeacher}
          lessonId={lessonId}
          groupId={groupId}
          activityId={activity.id}
        />
      );
    }

    return null;
  }

  // Режим редактирования
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-5xl">
        {/* Video URL input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ссылка на видео
          </label>
          <input
            type="text"
            placeholder="YouTube, VK Видео, RuTube или прямая ссылка на .mp4/.webm/.mov..."
            value={activity.videoUrl || ''}
            onChange={(e) => {
              onEdit({
                ...activity,
                videoUrl: e.target.value,
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Поддерживаются: YouTube, VK Видео, RuTube, прямые видеофайлы (mp4/webm/mov)
          </p>
        </div>

        {/* Video preview */}
        {activity.videoUrl && (
          <div className="w-full">
            {(() => {
              const parsedVideo = parseVideoUrl(activity.videoUrl, false);

              if (parsedVideo.platform === 'direct') {
                return (
                  <video
                    src={parsedVideo.embedUrl}
                    controls
                    playsInline
                    className="w-full max-h-[60vh] rounded-xl bg-black"
                  />
                );
              } else if (parsedVideo.embedUrl) {
                return (
                  <iframe
                    src={parsedVideo.embedUrl}
                    className="w-full h-[60vh]"
                    allowFullScreen
                    title="Video player"
                    allow="encrypted-media"
                  />
                );
              } else {
                return (
                  <div className="border-2 border-red-300 bg-red-50 rounded-xl p-8 text-center">
                    <p className="text-red-600 font-semibold mb-2">
                      Не удалось распознать ссылку
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>YouTube:</strong> https://www.youtube.com/watch?v=VIDEO_ID
                      </p>
                      <p>
                        <strong>VK Видео:</strong> https://vk.com/video-123456_789012
                      </p>
                      <p>
                        <strong>RuTube:</strong> https://rutube.ru/video/VIDEO_ID/
                      </p>
                      <p>
                        <strong>Прямой файл:</strong> https://.../video.mp4 (поддерживается .mp4, .webm, .mov)
                      </p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Empty state */}
        {!activity.videoUrl && (
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <p className="text-gray-600">Вставьте ссылку на видео выше</p>
            <p className="text-sm text-gray-500 mt-2">YouTube, VK Видео, RuTube или .mp4/.webm/.mov</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default VideoActivityRenderer;
