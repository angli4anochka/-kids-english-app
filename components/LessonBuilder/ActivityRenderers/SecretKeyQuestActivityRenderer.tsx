import type { Activity } from '../../../types';

interface SecretKeyQuestActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

/**
 * Рендерер квеста «Секретный ключ».
 * Игра — самодостаточный HTML в public/games/secret-key.html (intro → 3 квеста → золотой ключ).
 * Встраиваем через iframe, как остальные эмбеды (Genially/Wordwall).
 */
const SecretKeyQuestActivityRenderer = ({
  activity,
}: SecretKeyQuestActivityRendererProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <iframe
        src="/games/secret-key.html"
        className="w-full h-full border-0"
        title={activity.title || 'Секретный ключ'}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
};

export default SecretKeyQuestActivityRenderer;
