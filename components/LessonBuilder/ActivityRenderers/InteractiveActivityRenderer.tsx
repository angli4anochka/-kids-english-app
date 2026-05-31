import type { Activity } from '../../../types';

interface InteractiveActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения интерактивного контента
 * Встраивает iframe с внешними интерактивными ресурсами
 */
const InteractiveActivityRenderer = ({
  activity,
  isViewMode,
  onEdit,
}: InteractiveActivityRendererProps) => {
  const activityData = activity as any;
  const embedUrl = activityData.embedUrl || activityData.externalUrl || '';

  // If in edit mode and no embed URL, show editor
  if (!isViewMode && !embedUrl) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">Interactive Activity</h3>
          <p className="text-gray-600 mb-4">
            Enter the URL of the interactive content you want to embed
          </p>
          <input
            type="url"
            placeholder="https://example.com/interactive-content"
            className="w-full p-3 border rounded-lg"
            onChange={(e) => {
              onEdit({
                ...activity,
                embedUrl: e.target.value,
                externalUrl: e.target.value,
              } as any);
            }}
            value={embedUrl}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        title={activity.title}
        allow="autoplay; fullscreen; microphone; camera"
        allowFullScreen
      />
    </div>
  );
};

export default InteractiveActivityRenderer;
