import { useState, useEffect } from 'react';
import type { Activity } from '../../../types';

interface WordwallActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  onEdit: (activity: Activity) => void;
}

const WordwallActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  onEdit,
}: WordwallActivityRendererProps) => {
  const activityData = activity as any;
  const savedUrl: string = activityData.wordwallUrl || activityData.embedHtml || activityData.contentData?.wordwallUrl || '';

  const [inputUrl, setInputUrl] = useState(savedUrl);
  const [previewUrl, setPreviewUrl] = useState(savedUrl);

  useEffect(() => {
    setInputUrl(savedUrl);
    setPreviewUrl(savedUrl);
  }, [activity.id]);

  const toEmbedUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.includes('<iframe')) {
      const m = trimmed.match(/src="([^"]+)"/);
      return m ? m[1] : '';
    }
    // wordwall.net/resource/XXX → wordwall.net/embed/XXX
    return trimmed.replace('wordwall.net/resource/', 'wordwall.net/embed/');
  };

  const handleApply = () => {
    const embed = toEmbedUrl(inputUrl);
    setPreviewUrl(embed);
    onEdit({
      ...activity,
      wordwallUrl: embed,
      contentData: { ...(activityData.contentData || {}), wordwallUrl: embed },
    } as any);
  };

  // Student / view-only mode — just show the iframe
  if (isViewMode || !isTeacher) {
    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-lg">
          Ссылка на Wordwall не добавлена
        </div>
      );
    }
    return (
      <div className="w-full h-full">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={activity.title}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // Teacher edit mode — always show URL input + preview
  return (
    <div className="flex flex-col h-full">
      {/* URL input bar */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200 shrink-0">
        <span className="text-sm text-gray-500 shrink-0">🎮 Wordwall URL:</span>
        <input
          type="text"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
          placeholder="Вставьте ссылку wordwall.net..."
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400"
        />
        <button
          onClick={handleApply}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition shrink-0"
        >
          Применить
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={activity.title}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
            <span className="text-5xl">🎮</span>
            <span className="text-sm">Вставьте ссылку и нажмите «Применить»</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordwallActivityRenderer;
