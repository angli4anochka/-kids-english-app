import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import TVFrame from '../Shared/TVFrame';

interface Props {
  videoUrl: string;
  audioUrl?: string;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  activityId: string;
}

const SyncedVideoWithAudio: React.FC<Props> = ({ videoUrl, audioUrl, isTeacher, lessonId, groupId, activityId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [studentsReady, setStudentsReady] = useState<Set<string>>(new Set());
  const [debugMessage, setDebugMessage] = useState<string>('');
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { socket, isConnected } = useSocket();

  // Video sync handlers (teacher only)
  const handleVideoPlay = () => {
    if (!isTeacher || !socket || !isConnected || !videoRef.current) return;

    console.log('[SyncedVideoWithAudio] Teacher played video, sending to students');
    socket.emit('video-control', {
      lessonId,
      groupId,
      activityId,
      action: 'play',
      currentTime: videoRef.current.currentTime,
    });
  };

  const handleVideoPause = () => {
    if (!isTeacher || !socket || !isConnected || !videoRef.current) return;

    console.log('[SyncedVideoWithAudio] Teacher paused video, sending to students');
    socket.emit('video-control', {
      lessonId,
      groupId,
      activityId,
      action: 'pause',
      currentTime: videoRef.current.currentTime,
    });
  };

  const toggleAudio = () => {
    if (!audioRef.current || !isTeacher) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);

      // Send stop command to students
      if (socket && isConnected && lessonId && groupId) {
        socket.emit('audio-control', {
          lessonId,
          groupId,
          activityId,
          action: 'stop',
        });
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);

      // Send play command to students
      if (socket && isConnected && lessonId && groupId) {
        socket.emit('audio-control', {
          lessonId,
          groupId,
          activityId,
          action: 'play',
        });
      }
    }
  };

  // Listen to audio commands from teacher (for students)
  useEffect(() => {
    if (isTeacher || !socket || !isConnected || !audioRef.current) return;

    const handleAudioControl = (data: { activityId: string; action: 'play' | 'stop' }) => {
      if (data.activityId !== activityId || !audioRef.current) return;

      if (data.action === 'play') {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      } else if (data.action === 'stop') {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };

    socket.on('audio-control', handleAudioControl);

    return () => {
      socket.off('audio-control', handleAudioControl);
    };
  }, [socket, isConnected, isTeacher, activityId]);

  // Listen to video commands from teacher (for students)
  useEffect(() => {
    if (isTeacher || !socket || !isConnected) return;

    const handleVideoControl = (data: { activityId: string; action: 'play' | 'pause'; currentTime: number }) => {
      // Show debug message for students
      setDebugMessage(`📺 Получено: ${data.action === 'play' ? 'PLAY ▶️' : 'PAUSE ⏸️'} (время: ${data.currentTime.toFixed(1)}с)`);
      setTimeout(() => setDebugMessage(''), 3000);

      if (data.activityId !== activityId) {
        console.log('[SyncedVideoWithAudio] Ignoring video control for different activity:', data.activityId, 'current:', activityId);
        setDebugMessage(`⚠️ Другая активность: ${data.activityId.substring(0, 8)}`);
        setTimeout(() => setDebugMessage(''), 3000);
        return;
      }

      if (!videoRef.current) {
        console.error('[SyncedVideoWithAudio] Student received video control but videoRef is null');
        setDebugMessage('❌ Видео не найдено');
        setTimeout(() => setDebugMessage(''), 3000);
        return;
      }

      console.log('[SyncedVideoWithAudio] Student received video control:', data.action, 'at time:', data.currentTime);

      // Sync time first
      const timeDiff = Math.abs(videoRef.current.currentTime - data.currentTime);
      if (timeDiff > 2) {
        console.log('[SyncedVideoWithAudio] Syncing video time from', videoRef.current.currentTime, 'to', data.currentTime);
        videoRef.current.currentTime = data.currentTime;
      }

      if (data.action === 'play') {
        console.log('[SyncedVideoWithAudio] Playing video for student');

        // Student is always muted — sound comes from the teacher's tab only
        videoRef.current.muted = true;

        // Try to play the video
        const playPromise = videoRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('[SyncedVideoWithAudio] Student failed to play video:', err);

            // If autoplay is blocked, try with muted
            if (err.name === 'NotAllowedError') {
              console.log('[SyncedVideoWithAudio] Autoplay blocked, trying with muted video');
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {
                  // If even muted doesn't work, show button to user
                  setNeedsUserInteraction(true);
                  setDebugMessage(`🔇 Нажмите на видео для воспроизведения`);
                });
              }
            } else {
              setDebugMessage(`❌ Ошибка воспроизведения: ${err.message}`);
              setTimeout(() => setDebugMessage(''), 5000);
            }
          });
        }
      } else if (data.action === 'pause') {
        console.log('[SyncedVideoWithAudio] Pausing video for student');
        videoRef.current.pause();
      }
    };

    socket.on('video-control', handleVideoControl);
    console.log('[SyncedVideoWithAudio] Student listening for video-control events on activity:', activityId);
    setDebugMessage(`✅ Подключено! Ожидание команд...`);
    setTimeout(() => setDebugMessage(''), 2000);

    return () => {
      socket.off('video-control', handleVideoControl);
    };
  }, [socket, isConnected, isTeacher, activityId]);

  // Handle video load event
  const handleVideoCanPlay = () => {
    setVideoLoaded(true);

    // Student notifies teacher that video is ready
    if (!isTeacher && socket && isConnected && lessonId && groupId) {
      console.log('[SyncedVideoWithAudio] Student video loaded, notifying teacher');
      socket.emit('video-ready', {
        lessonId,
        groupId,
        activityId,
      });
    }
  };

  // Teacher listens for students' ready status
  useEffect(() => {
    if (!isTeacher || !socket || !isConnected) return;

    const handleVideoReady = (data: { activityId: string; studentId: string; studentName: string }) => {
      if (data.activityId !== activityId) return;

      console.log('[SyncedVideoWithAudio] Student ready:', data.studentName);
      setStudentsReady(prev => new Set(prev).add(data.studentName));
    };

    socket.on('video-ready', handleVideoReady);

    return () => {
      socket.off('video-ready', handleVideoReady);
    };
  }, [socket, isConnected, isTeacher, activityId]);

  // Force the <video> to refetch when the source URL changes. React updates
  // the `src` DOM attribute but the element does not always reload on its own.
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl]);


  return (
    <TVFrame>
      <div className="relative w-full h-full">
        <video
          key={videoUrl}
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          controls={isTeacher === true}
          muted={!isTeacher}
          autoPlay={false}
          playsInline
          preload="metadata"
          style={{ objectFit: 'contain', backgroundColor: '#000' }}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onCanPlay={handleVideoCanPlay}
          onLoadedMetadata={() => console.log('[Video] Metadata loaded')}
          onError={(e) => {
            console.error('[Video] Error loading video:', e);
            console.error('[Video] Error details:', {
              error: e.currentTarget.error,
              code: e.currentTarget.error?.code,
              message: e.currentTarget.error?.message,
              src: videoUrl
            });
          }}
        >
          Ваш браузер не поддерживает видео.
        </video>
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Ready status indicator for teacher */}
        {isTeacher && studentsReady.size > 0 && (
          <div className="absolute top-4 right-4 bg-green-600/90 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-bold mb-1">✓ Готовы к просмотру:</div>
            <div className="text-xs space-y-1">
              {Array.from(studentsReady).map((name, i) => (
                <div key={i}>{name}</div>
              ))}
            </div>
          </div>
        )}

        {/* User interaction button for students */}
        {!isTeacher && needsUserInteraction && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.play().then(() => {
                    setNeedsUserInteraction(false);
                    setDebugMessage('✅ Видео запущено!');
                    setTimeout(() => setDebugMessage(''), 2000);
                  }).catch(err => {
                    console.error('[SyncedVideoWithAudio] Failed to play after user interaction:', err);
                    setDebugMessage(`❌ Не удалось запустить: ${err.message}`);
                  });
                }
              }}
              className="px-12 py-8 bg-green-600 hover:bg-green-700 text-white rounded-3xl font-bold text-4xl transition-all transform hover:scale-105 shadow-2xl border-4 border-white animate-pulse"
            >
              ▶️ НАЖМИ ДЛЯ ВОСПРОИЗВЕДЕНИЯ
            </button>
          </div>
        )}
      </div>
    </TVFrame>
  );
};

export default SyncedVideoWithAudio;
