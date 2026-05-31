import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import TeacherScreenYouTube from './TeacherScreenYouTube';

interface Props {
  videoUrl: string;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  socket?: any;
  isConnected?: boolean;
}

// Глобальная переменная для YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SyncedVideoPlayer: React.FC<Props> = ({
  videoUrl,
  isTeacher,
  lessonId,
  groupId,
  socket: propSocket,
  isConnected: propIsConnected
}) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const fallbackSocket = useSocket();

  // Use props if provided, otherwise fallback to hook
  const socket = propSocket || fallbackSocket.socket;
  const isConnected = propIsConnected !== undefined ? propIsConnected : fallbackSocket.isConnected;

  const lastUpdateTimeRef = useRef(0);

  // Debug: Log props when component mounts
  useEffect(() => {
    console.log('[SyncedVideoPlayer] Props:', { videoUrl, isTeacher, lessonId, groupId, hasSocket: !!socket, isConnected });
  }, [videoUrl, isTeacher, lessonId, groupId, socket, isConnected]);

  // Log connection state changes
  useEffect(() => {
    if (isConnected) {
      console.log('[SyncedVideoPlayer] ✅ WebSocket connected!', { isTeacher, lessonId, groupId });
    } else {
      console.log('[SyncedVideoPlayer] ⏳ WebSocket not connected yet...', { isTeacher, hasSocket: !!socket });
    }
  }, [isConnected, isTeacher, lessonId, groupId, socket]);

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

    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoId,
      playerVars: {
        autoplay: 0, // НЕТ автоплея - только учитель управляет
        controls: isTeacher ? 1 : 0, // Контролы только у учителя
        disablekb: !isTeacher ? 1 : 0, // Отключить клавиатуру для учеников
        fs: isTeacher ? 1 : 0, // Fullscreen только для учителя
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3, // Hide video annotations
        mute: !isTeacher ? 1 : 0, // MUTE для студентов - звук только через Zoom!
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

    // For students: add CSS to completely disable pointer events on iframe
    if (!isTeacher) {
      setTimeout(() => {
        const iframe = document.querySelector('#youtube-player iframe');
        if (iframe) {
          (iframe as HTMLElement).style.pointerEvents = 'none';
          console.log('[SyncedVideoPlayer] Disabled pointer events on YouTube iframe for student');
        }
      }, 1000);
    }
  };

  const onPlayerReady = (event: any) => {
    setIsReady(true);

    // Для студентов: принудительно отключить звук
    if (!isTeacher && playerRef.current) {
      playerRef.current.mute();
      console.log('[SyncedVideoPlayer] Student player muted - audio only through Zoom');
    }

    // НЕ запускаем автоматически - учитель запустит вручную кнопкой Play
    // Ученик получит команду через WebSocket от учителя
    console.log('[SyncedVideoPlayer] YouTube player ready', {
      isTeacher,
      hasSocket: !!socket,
      isConnected,
      lessonId,
      groupId
    });
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    const stateNames: { [key: number]: string } = {
      '-1': 'unstarted',
      '0': 'ended',
      '1': 'playing',
      '2': 'paused',
      '3': 'buffering',
      '5': 'cued'
    };

    console.log('[SyncedVideoPlayer] YouTube State changed:', {
      state: state,
      stateName: stateNames[state] || 'unknown',
      isTeacher,
      hasSocket: !!socket,
      isConnected,
      lessonId,
      groupId
    });

    if (!isTeacher) {
      console.log('[SyncedVideoPlayer] Not teacher, skipping emit');
      return;
    }

    if (!socket) {
      console.error('[SyncedVideoPlayer] No socket, cannot emit video-state-change');
      return;
    }

    if (!isConnected) {
      console.error('[SyncedVideoPlayer] Socket not connected, cannot emit video-state-change');
      return;
    }

    if (!lessonId || !groupId) {
      console.error('[SyncedVideoPlayer] Missing lessonId or groupId, cannot emit video-state-change');
      return;
    }

    // Only throttle buffering states, not play/pause
    if (state === 3) { // buffering
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 500) {
        console.log('[SyncedVideoPlayer] Throttled buffering event');
        return;
      }
      lastUpdateTimeRef.current = now;
    }

    const currentTime = playerRef.current?.getCurrentTime() || 0;

    console.log('[SyncedVideoPlayer] 🚀 TEACHER EMITTING video-state-change:', {
      lessonId,
      groupId,
      state: state,
      stateName: stateNames[state] || 'unknown',
      currentTime: currentTime.toFixed(2)
    });

    // Отправляем состояние видео ученикам
    socket.emit('video-state-change', {
      lessonId,
      groupId,
      state: state,
      currentTime: currentTime,
    });
  };

  // Слушаем команды от учителя (для учеников)
  useEffect(() => {
    if (isTeacher) {
      console.log('[SyncedVideoPlayer] Is teacher, not listening for video-state-change');
      return;
    }

    if (!socket || !isConnected) {
      console.log('[SyncedVideoPlayer] Student: No socket or not connected, waiting...');
      return;
    }

    if (!isReady) {
      console.log('[SyncedVideoPlayer] Student: Player not ready yet, waiting...');
      return;
    }

    console.log('[SyncedVideoPlayer] 🎧 Student listening for video-state-change events');

    const handleVideoStateChange = (data: { state: number; currentTime: number }) => {
      const stateNames: { [key: number]: string } = {
        '-1': 'unstarted',
        '0': 'ended',
        '1': 'playing',
        '2': 'paused',
        '3': 'buffering',
        '5': 'cued'
      };

      console.log('[SyncedVideoPlayer] 📩 Student received video-state-change from teacher:', {
        state: data.state,
        stateName: stateNames[data.state] || 'unknown',
        currentTime: data.currentTime.toFixed(2)
      });

      if (!playerRef.current) {
        console.error('[SyncedVideoPlayer] Student: playerRef is null, cannot control video');
        return;
      }

      const currentTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentTime - data.currentTime);

      console.log('[SyncedVideoPlayer] Student current time:', currentTime.toFixed(2), 'diff:', timeDiff.toFixed(2));

      // Если разница во времени больше 2 секунд - синхронизируем
      if (timeDiff > 2) {
        console.log('[SyncedVideoPlayer] Student syncing time to:', data.currentTime.toFixed(2));
        playerRef.current.seekTo(data.currentTime, true);
      }

      // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
      switch (data.state) {
        case 1: // Playing
          if (playerRef.current.getPlayerState() !== 1) {
            console.log('[SyncedVideoPlayer] ▶️ Student starting playback');
            playerRef.current.playVideo();
          } else {
            console.log('[SyncedVideoPlayer] Student already playing');
          }
          break;
        case 2: // Paused
          if (playerRef.current.getPlayerState() !== 2) {
            console.log('[SyncedVideoPlayer] ⏸️ Student pausing playback');
            playerRef.current.pauseVideo();
          } else {
            console.log('[SyncedVideoPlayer] Student already paused');
          }
          break;
        case 0: // Ended
          console.log('[SyncedVideoPlayer] ⏹️ Student video ended, resetting');
          playerRef.current.seekTo(0, true);
          playerRef.current.pauseVideo();
          break;
        default:
          console.log('[SyncedVideoPlayer] Student ignoring state:', stateNames[data.state] || 'unknown');
      }
    };

    socket.on('video-state-change', handleVideoStateChange);

    // Запросить текущее состояние видео у учителя при подключении
    if (lessonId && groupId) {
      console.log('[SyncedVideoPlayer] Student requesting initial video state for lesson:', lessonId, 'group:', groupId);
      socket.emit('request-video-state', { lessonId, groupId });
    }

    return () => {
      console.log('[SyncedVideoPlayer] Student cleaning up video-state-change listener');
      socket.off('video-state-change', handleVideoStateChange);
    };
  }, [socket, isConnected, isReady, isTeacher, lessonId, groupId]);

  // Teacher answers a student's request for the current video state (mid-join sync)
  useEffect(() => {
    if (!isTeacher || !socket || !isConnected) return;

    const handleRequest = () => {
      if (!playerRef.current || !lessonId || !groupId) return;
      const state = playerRef.current.getPlayerState?.() ?? -1;
      const currentTime = playerRef.current.getCurrentTime?.() ?? 0;
      console.log('[SyncedVideoPlayer] Teacher answering request-video-state:', { state, currentTime });
      socket.emit('video-state-change', { lessonId, groupId, state, currentTime });
    };

    socket.on('request-video-state', handleRequest);
    return () => { socket.off('request-video-state', handleRequest); };
  }, [isTeacher, socket, isConnected, lessonId, groupId]);

  // Cleanup: остановить и уничтожить плеер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          // Останавливаем видео
          if (playerRef.current.stopVideo) {
            playerRef.current.stopVideo();
          }
          // Уничтожаем плеер
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

  if (!videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Неверная ссылка на видео</p>
      </div>
    );
  }

  // Students also get YouTube player, but without controls and synced with teacher
  // No separate component needed - just render the player with different settings

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative">
      <div
        id="youtube-player"
        className="w-full h-full"
        style={!isTeacher ? { pointerEvents: 'none' } : {}}
      />
      {/* Invisible overlay for students to block any clicks */}
      {!isTeacher && (
        <div
          className="absolute inset-0 z-50"
          style={{
            pointerEvents: 'auto',
            cursor: 'default',
            background: 'transparent'
          }}
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
};

export default SyncedVideoPlayer;
