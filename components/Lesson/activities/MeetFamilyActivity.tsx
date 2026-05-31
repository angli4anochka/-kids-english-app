import { useState, useRef } from 'react';

interface MeetFamilyActivityProps {
  audioUrl?: string;
}

const MeetFamilyActivity = ({ audioUrl = '/audio/track1.wma' }: MeetFamilyActivityProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Audio playback error:', error);
          setHasAudioError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    console.error('Audio file not found or cannot be loaded');
    setHasAudioError(true);
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image */}
      <img
        src="/lesson-plan.png"
        alt="Star Family"
        className="w-full h-full object-cover"
      />

      {/* Audio Control Button - positioned over the image */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        <button
          onClick={handlePlayPause}
          disabled={hasAudioError}
          className={`px-8 py-4 ${hasAudioError ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all text-xl flex items-center gap-3`}
        >
          {isPlaying ? (
            <>
              <span className="text-3xl">⏸️</span>
              <span>Пауза</span>
            </>
          ) : (
            <>
              <span className="text-3xl">▶️</span>
              <span>Слушать аудио</span>
            </>
          )}
        </button>
        {hasAudioError && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
            ⚠️ Аудио файл не найден или не поддерживается браузером
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleAudioEnd}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={handleAudioError}
      />
    </div>
  );
};

export default MeetFamilyActivity;
