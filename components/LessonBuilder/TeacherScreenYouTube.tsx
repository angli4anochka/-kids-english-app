import { useEffect, useRef, useState } from 'react';

interface Props {
  videoUrl: string;
  socket?: any;
  isConnected?: boolean;
  lessonId?: string;
  groupId?: number;
}

// Глобальная переменная для YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const TeacherScreenYouTube: React.FC<Props> = ({
  videoUrl,
  socket,
  isConnected,
  lessonId,
  groupId,
}) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState<string>('waiting');
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Извлекаем YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/watch\?v=([^&\s]+)/,
      /youtu\.be\/([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Если это просто ID (11 символов)
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
      return url;
    }

    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  // Загрузка YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    // Проверяем, загружен ли уже API
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    // Загружаем YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Callback когда API загрузится
    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };
  }, [videoId]);

  const initPlayer = () => {
    if (!videoId) return;

    // Create invisible YouTube player
    playerRef.current = new window.YT.Player('hidden-youtube-player', {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          setIsReady(true);
          console.log('[TeacherScreenYouTube] Hidden player ready');
        },
      },
    });
  };

  // Listen for video state changes from teacher
  useEffect(() => {
    if (!socket || !isConnected || !isReady) return;

    const handleVideoStateChange = (data: { state: number; currentTime: number }) => {
      const stateNames: { [key: number]: string } = {
        '-1': 'unstarted',
        '0': 'ended',
        '1': 'playing',
        '2': 'paused',
        '3': 'buffering',
        '5': 'cued'
      };

      console.log('[TeacherScreenYouTube] Received state:', stateNames[data.state], 'time:', data.currentTime);

      setPlayerState(stateNames[data.state] || 'unknown');
      setCurrentTime(data.currentTime);

      if (!playerRef.current) return;

      // Sync the hidden player
      const currentPlayerTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentPlayerTime - data.currentTime);

      if (timeDiff > 2) {
        playerRef.current.seekTo(data.currentTime, true);
      }

      switch (data.state) {
        case 1: // Playing
          if (playerRef.current.getPlayerState() !== 1) {
            playerRef.current.playVideo();
          }
          break;
        case 2: // Paused
          if (playerRef.current.getPlayerState() !== 2) {
            playerRef.current.pauseVideo();
          }
          break;
        case 0: // Ended
          playerRef.current.seekTo(0, true);
          playerRef.current.pauseVideo();
          break;
      }
    };

    socket.on('video-state-change', handleVideoStateChange);

    // Request initial state
    if (lessonId && groupId) {
      socket.emit('request-video-state', { lessonId, groupId });
    }

    return () => {
      socket.off('video-state-change', handleVideoStateChange);
    };
  }, [socket, isConnected, isReady, lessonId, groupId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          if (playerRef.current.stopVideo) {
            playerRef.current.stopVideo();
          }
          if (playerRef.current.destroy) {
            playerRef.current.destroy();
          }
        } catch (e) {
          console.error('Error cleaning up YouTube player:', e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative">
      {/* Hidden YouTube player for audio */}
      <div
        id="hidden-youtube-player"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />

      {/* Visual representation of teacher's screen */}
      <div className="w-full h-full flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-6">
          {playerState === 'playing' ? '▶️' : playerState === 'paused' ? '⏸️' : '📺'}
        </div>

        <h2 className="text-3xl font-bold mb-4">
          Экран учителя
        </h2>

        <div className="bg-gray-800 px-6 py-3 rounded-lg mb-4">
          <p className="text-xl">
            {playerState === 'playing' ? 'Воспроизведение' :
             playerState === 'paused' ? 'Пауза' :
             playerState === 'ended' ? 'Завершено' :
             'Ожидание...'}
          </p>
        </div>

        {playerState === 'playing' && (
          <div className="text-lg opacity-80">
            Время: {formatTime(currentTime)}
          </div>
        )}

        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          🔴 LIVE
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-center text-sm opacity-60">
          Видео воспроизводится с экрана учителя. Звук синхронизирован.
        </div>
      </div>
    </div>
  );
};

export default TeacherScreenYouTube;