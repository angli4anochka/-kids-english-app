import { useRef, useState } from 'react';
import TVFrame from '../Shared/TVFrame';

interface Props {
  imageUrl: string;
  audioUrl?: string;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  activityId: string;
}

const SyncedImageWithAudio: React.FC<Props> = ({ imageUrl, audioUrl, isTeacher }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    audioRef.current.currentTime = 0;
    await audioRef.current.play();
    setIsPlaying(true);
  };

  return (
    <TVFrame>
      <div className="relative h-full w-full">
        <img src={imageUrl} alt="Fullscreen" className="h-full w-full object-contain" />
        {isTeacher && audioUrl && (
          <>
            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
            <button
              type="button"
              onClick={toggleAudio}
              className="absolute bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border-4 border-white bg-purple-600 px-6 py-4 text-xl font-black text-white shadow-2xl transition hover:scale-105 hover:bg-purple-700"
              title={isPlaying ? 'Остановить аудио' : 'Воспроизвести аудио'}
            >
              <span className="text-3xl">{isPlaying ? '⏹️' : '▶️'}</span>
              <span>{isPlaying ? 'Стоп' : 'Аудио'}</span>
            </button>
          </>
        )}
      </div>
    </TVFrame>
  );
};

export default SyncedImageWithAudio;
