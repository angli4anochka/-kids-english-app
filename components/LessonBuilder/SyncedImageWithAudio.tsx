import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import TVFrame from '../Shared/TVFrame';

interface Props {
  imageUrl: string;
  audioUrl?: string;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  activityId: string;
}

const SyncedImageWithAudio: React.FC<Props> = ({ imageUrl, audioUrl, isTeacher, lessonId, groupId, activityId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { socket, isConnected } = useSocket();

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

  return (
    <TVFrame>
      <div className="relative w-full h-full">
        <img
          src={imageUrl}
          alt="Fullscreen"
          className="w-full h-full object-contain"
        />
        {audioUrl && (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
            />
            {isTeacher && (
              <button
                onClick={toggleAudio}
                className="absolute bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-6 shadow-2xl transition transform hover:scale-110 z-50 text-3xl"
                title={isPlaying ? 'Остановить аудио' : 'Воспроизвести аудио'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
            )}
          </>
        )}
      </div>
    </TVFrame>
  );
};

export default SyncedImageWithAudio;
