import { useEffect, useRef, useState } from 'react';

interface Props {
  socket?: any;
  isConnected?: boolean;
  lessonId?: string;
  groupId?: number;
}

const TeacherScreenViewer: React.FC<Props> = ({
  socket,
  isConnected,
  lessonId,
  groupId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const frameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !lessonId || !groupId) {
      console.log('[TeacherScreenViewer] Not ready:', { hasSocket: !!socket, isConnected, lessonId, groupId });
      return;
    }

    console.log('[TeacherScreenViewer] Setting up stream listener for lesson:', lessonId, 'group:', groupId);

    // Handler for receiving video frames from teacher
    const handleVideoFrame = (data: { frame: string; width: number; height: number; timestamp: number }) => {
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Store the frame data
      frameRef.current = data.frame;

      // Set canvas size if changed
      if (canvasRef.current.width !== data.width || canvasRef.current.height !== data.height) {
        canvasRef.current.width = data.width;
        canvasRef.current.height = data.height;
      }

      // Create and draw image from base64 data
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, data.width, data.height);
        setIsStreamActive(true);
        setErrorMessage(null);
      };
      img.onerror = () => {
        console.error('[TeacherScreenViewer] Failed to load frame');
        setErrorMessage('Ошибка загрузки видео');
      };
      img.src = data.frame;
    };

    // Handler for stream status
    const handleStreamStatus = (data: { active: boolean; message?: string }) => {
      console.log('[TeacherScreenViewer] Stream status:', data);
      setIsStreamActive(data.active);
      if (!data.active && data.message) {
        setErrorMessage(data.message);
      }
    };

    // Handler for stream error
    const handleStreamError = (data: { error: string }) => {
      console.error('[TeacherScreenViewer] Stream error:', data.error);
      setErrorMessage(data.error);
      setIsStreamActive(false);
    };

    socket.on('video-frame', handleVideoFrame);
    socket.on('stream-status', handleStreamStatus);
    socket.on('stream-error', handleStreamError);

    // Request current stream status
    socket.emit('request-stream-status', { lessonId, groupId });

    return () => {
      socket.off('video-frame', handleVideoFrame);
      socket.off('stream-status', handleStreamStatus);
      socket.off('stream-error', handleStreamError);
    };
  }, [socket, isConnected, lessonId, groupId]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative">
      {/* Canvas for displaying teacher's video stream */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ display: isStreamActive ? 'block' : 'none' }}
      />

      {/* Loading/Error states */}
      {!isStreamActive && (
        <div className="text-center text-white">
          {errorMessage ? (
            <div>
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold mb-2">Ошибка трансляции</h3>
              <p className="text-lg opacity-80">{errorMessage}</p>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-4 animate-pulse">📺</div>
              <h3 className="text-2xl font-bold mb-2">Ожидание трансляции</h3>
              <p className="text-lg opacity-80">Учитель скоро начнет показ видео</p>
            </div>
          )}
        </div>
      )}

      {/* Overlay to show it's teacher's screen */}
      {isStreamActive && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          🔴 LIVE - Экран учителя
        </div>
      )}
    </div>
  );
};

export default TeacherScreenViewer;