import { useState, useEffect } from 'react';
import TVFrame from '../../Shared/TVFrame';
import SyncedVideoPlayer from '../SyncedVideoPlayer';
import SyncedVideoWithAudio from '../SyncedVideoWithAudio';
import { parseVideoUrl } from '../utils/videoUtils';
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
  const savedUrl = activity.videoUrl || '';
  const [inputUrl, setInputUrl] = useState(savedUrl);
  const [previewUrl, setPreviewUrl] = useState(savedUrl);

  useEffect(() => {
    setInputUrl(activity.videoUrl || '');
    setPreviewUrl(activity.videoUrl || '');
  }, [activity.id]);

  const handleApply = () => {
    setPreviewUrl(inputUrl);
    onEdit({ ...activity, videoUrl: inputUrl });
  };

  // View mode — full screen video
  if (isViewMode && activity.videoUrl) {
    const parsedVideo = parseVideoUrl(activity.videoUrl, isTeacher);

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

  // Edit mode — URL bar + full-height preview
  const parsed = previewUrl ? parseVideoUrl(previewUrl, false) : null;

  return (
    <div className="flex flex-col h-full">
      {/* URL input bar */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200 shrink-0">
        <span className="text-sm text-gray-500 shrink-0">🎬 Видео URL:</span>
        <input
          type="text"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
          placeholder="YouTube, VK Видео, RuTube или .mp4..."
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400"
        />
        <button
          onClick={handleApply}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition shrink-0"
        >
          Применить
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 bg-black">
        {parsed && parsed.embedUrl ? (
          parsed.platform === 'direct' ? (
            <video
              src={parsed.embedUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <iframe
              src={parsed.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              title="Video preview"
              allow="autoplay; fullscreen; encrypted-media"
            />
          )
        ) : previewUrl ? (
          <div className="flex items-center justify-center h-full text-red-400 flex-col gap-2">
            <span className="text-4xl">⚠️</span>
            <span className="text-sm">Не удалось распознать ссылку</span>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
            <span className="text-5xl">🎬</span>
            <span className="text-sm">Вставьте ссылку и нажмите «Применить»</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoActivityRenderer;
