import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TVFrame from '../Shared/TVFrame';

interface ImageWithAudioProps {
  imageUrl: string;
  audioUrl?: string;
}

/**
 * Component for displaying an image with optional audio playback control
 * Only visible to teachers when audioUrl is provided
 */
const ImageWithAudio = ({ imageUrl, audioUrl }: ImageWithAudioProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();

  // Debug logging
  console.log('ImageWithAudio rendered:', { imageUrl: imageUrl?.substring(0, 50), audioUrl, hasAudio: !!audioUrl });

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <TVFrame>
      <div className="relative w-full h-full">
        <img
          src={imageUrl}
          alt="Fullscreen"
          className="w-full h-full object-contain"
        />
        {audioUrl && user?.role === 'teacher' && (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={toggleAudio}
              className="absolute bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-6 shadow-2xl transition transform hover:scale-110 z-50 text-3xl"
              title={isPlaying ? 'Остановить аудио' : 'Воспроизвести аудио'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          </>
        )}
      </div>
    </TVFrame>
  );
};

export default ImageWithAudio;
