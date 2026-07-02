import type { Activity } from '../../../types';

interface AbcQuestActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

/**
 * Рендерер квиза «ABC Quest».
 * Игра — самодостаточный HTML в public/games/abc-quest.html.
 * Встраиваем через iframe, как остальные эмбеды (Secret Key/Genially/Wordwall).
 */
const AbcQuestActivityRenderer = ({
  activity,
}: AbcQuestActivityRendererProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <iframe
        src="/games/abc-quest.html"
        className="w-full h-full border-0"
        title={activity.title || 'ABC Quest'}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
};

export default AbcQuestActivityRenderer;
