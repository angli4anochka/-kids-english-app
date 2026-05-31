import type { Activity } from '../../../types';

interface WordwallActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения Wordwall игры
 * Встраивает iframe с Wordwall контентом
 */
const WordwallActivityRenderer = ({
  activity,
  isViewMode,
  onEdit,
}: WordwallActivityRendererProps) => {
  const activityData = activity as any;
  const embedHtml = activityData.embedHtml || activityData.wordwallUrl || '';

  // If in edit mode and no embed HTML, show editor
  if (!isViewMode && !embedHtml) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold mb-2">Wordwall Activity</h3>
          <p className="text-gray-600 mb-4">
            Paste the Wordwall embed code or URL to display the game
          </p>
          <textarea
            placeholder="Paste Wordwall embed HTML or URL here..."
            className="w-full p-3 border rounded-lg min-h-32"
            onChange={(e) => {
              onEdit({
                ...activity,
                embedHtml: e.target.value,
                wordwallUrl: e.target.value,
              } as any);
            }}
            value={embedHtml}
          />
        </div>
      </div>
    );
  }

  // Extract iframe src from embed HTML if it's HTML
  let iframeSrc = embedHtml;
  if (embedHtml.includes('<iframe')) {
    const srcMatch = embedHtml.match(/src="([^"]+)"/);
    if (srcMatch) {
      iframeSrc = srcMatch[1];
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        title={activity.title}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
};

export default WordwallActivityRenderer;
