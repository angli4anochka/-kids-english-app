import React, { useRef, useEffect, useState, useCallback } from 'react';

interface OptimizedVideoProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  style?: React.CSSProperties;
  onPlay?: () => void;
  onPause?: () => void;
  onCanPlay?: () => void;
  onLoadStart?: () => void;
  onProgress?: () => void;
  forwardRef?: React.RefObject<HTMLVideoElement | null>;
}

const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  src,
  className = '',
  controls = false,
  autoPlay = false,
  playsInline = true,
  style,
  onPlay,
  onPause,
  onCanPlay,
  onLoadStart,
  onProgress,
  forwardRef,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = forwardRef || localVideoRef;
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setShouldLoad(true);
          }
        });
      },
      {
        rootMargin: '100px', // Начать загрузку за 100px до появления
        threshold: 0.01,
      }
    );

    observer.observe(videoRef.current);

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  // Обработка прогресса загрузки
  const handleProgress = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      if (duration > 0) {
        const progress = (bufferedEnd / duration) * 100;
        setLoadingProgress(Math.round(progress));
      }
    }

    onProgress?.();
  }, [onProgress]);

  // Обработка начала загрузки
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
    onLoadStart?.();
  }, [onLoadStart]);

  // Обработка готовности к воспроизведению
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    onCanPlay?.();
  }, [onCanPlay]);

  // Обработка ошибок
  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    let errorMessage = 'Ошибка загрузки видео';

    if (video.error) {
      switch (video.error.code) {
        case 1:
          errorMessage = 'Загрузка видео была прервана';
          break;
        case 2:
          errorMessage = 'Сетевая ошибка при загрузке видео';
          break;
        case 3:
          errorMessage = 'Ошибка декодирования видео';
          break;
        case 4:
          errorMessage = 'Формат видео не поддерживается';
          break;
      }
    }

    setError(errorMessage);
    setIsLoading(false);
    console.error('[OptimizedVideo] Error loading video:', errorMessage, video.error);
  }, []);

  // Создание постера из первого кадра видео
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldLoad || !videoRef.current || posterUrl) return;

    const video = videoRef.current;

    const captureFirstFrame = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPosterUrl(dataUrl);
      }
    };

    // Захват первого кадра при загрузке метаданных
    const handleLoadedMetadata = () => {
      video.currentTime = 0.1; // Немного сдвигаем от начала
    };

    const handleSeeked = () => {
      captureFirstFrame();
      video.currentTime = 0; // Возвращаем в начало
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [shouldLoad, posterUrl]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        muted={autoPlay}
        playsInline={playsInline}
        style={style}
        preload={shouldLoad ? "metadata" : "none"}
        poster={posterUrl || undefined}
        onPlay={onPlay}
        onPause={onPause}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        onProgress={handleProgress}
        onError={handleError}
        {...(shouldLoad && { src })}
      >
        Ваш браузер не поддерживает видео.
      </video>

      {/* Индикатор загрузки */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center text-white">
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 mx-auto" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold">Загрузка видео...</p>
            {loadingProgress > 0 && (
              <div className="mt-2">
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{loadingProgress}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center text-white p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-xl font-semibold mb-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setShouldLoad(true);
                setIsLoading(true);
              }}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Кнопка загрузки для больших видео */}
      {!shouldLoad && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <button
            onClick={() => setShouldLoad(true)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <span className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              Загрузить видео
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedVideo;