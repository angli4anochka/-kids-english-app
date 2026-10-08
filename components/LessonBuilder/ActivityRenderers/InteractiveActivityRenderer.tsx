import { useInteractivePageSync } from '../../../hooks/useInteractivePageSync';
import { useEffect, useState } from 'react';
import type { Activity } from '../../../types';

interface InteractiveActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

/**
 * Р С™Р С•Р СР С—Р С•Р Р…Р ВµР Р…РЎвЂљ Р Т‘Р В»РЎРЏ Р С•РЎвЂљР С•Р В±РЎР‚Р В°Р В¶Р ВµР Р…Р С‘РЎРЏ Р С‘Р Р…РЎвЂљР ВµРЎР‚Р В°Р С”РЎвЂљР С‘Р Р†Р Р…Р С•Р С–Р С• Р С”Р С•Р Р…РЎвЂљР ВµР Р…РЎвЂљР В°
 * Р вЂ™РЎРѓРЎвЂљРЎР‚Р В°Р С‘Р Р†Р В°Р ВµРЎвЂљ iframe РЎРѓ Р Р†Р Р…Р ВµРЎв‚¬Р Р…Р С‘Р СР С‘ Р С‘Р Р…РЎвЂљР ВµРЎР‚Р В°Р С”РЎвЂљР С‘Р Р†Р Р…РЎвЂ№Р СР С‘ РЎР‚Р ВµРЎРѓРЎС“РЎР‚РЎРѓР В°Р СР С‘
 */
const InteractiveActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  sessionId,
  onEdit,
}: InteractiveActivityRendererProps) => {
  const activityData = activity as any;
  const savedPhrase = activityData.contentData?.buildPhrase || '';
  const [phraseDraft, setPhraseDraft] = useState(savedPhrase);
  const isBuildPhrase = activity.title === 'Build the phrase' || activityData.tags?.includes('Build phrase');

  useEffect(() => { setPhraseDraft(savedPhrase); }, [savedPhrase]);
  const rawEmbedUrl = activityData.embedUrl || activityData.externalUrl || '';
  const embedUrl = savedPhrase && rawEmbedUrl && !/[?&]phrase=/.test(rawEmbedUrl)
    ? `${rawEmbedUrl}${rawEmbedUrl.includes('?') ? '&' : '?'}phrase=${encodeURIComponent(savedPhrase)}`
    : rawEmbedUrl;

  const pageSync = activityData.contentData?.pageSync || activityData.pageSync;
  const {frame,error} = useInteractivePageSync({enabled:!!pageSync, pageCount:pageSync?.pageCount || 0,
    sessionId,activityId:activity.id,isTeacher,src:embedUrl});

  if (!isViewMode && isBuildPhrase) {
    const savePhrase = () => {
      const phrase = phraseDraft.trim();
      if (!phrase) return;
      const baseUrl = 'https://storage.yandexcloud.net/kids-app/public-assets/games/island-build-my-name-game.html';
      const gameUrl = `${baseUrl}?phrase=${encodeURIComponent(phrase)}`;
      onEdit({
        ...activity,
        embedUrl: gameUrl,
        externalUrl: gameUrl,
        contentData: { ...(activityData.contentData || {}), buildPhrase: phrase },
      } as any);
    };

    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 p-8">
        <div className="w-full max-w-2xl rounded-3xl border-4 border-white bg-white p-8 text-center shadow-2xl">
          <h3 className="mb-3 text-3xl font-black text-sky-700">Build the phrase</h3>
          <p className="mb-5 text-lg font-semibold text-slate-600">{'\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0444\u0440\u0430\u0437\u0443, \u043a\u043e\u0442\u043e\u0440\u0443\u044e \u0443\u0447\u0435\u043d\u0438\u043a \u0431\u0443\u0434\u0435\u0442 \u0441\u043e\u0431\u0438\u0440\u0430\u0442\u044c \u043f\u043e \u0431\u0443\u043a\u0432\u0430\u043c'}</p>
          <input
            type="text"
            maxLength={60}
            value={phraseDraft}
            onChange={(event) => setPhraseDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') savePhrase(); }}
            placeholder="MY NAME IS KIKI"
            className="w-full rounded-2xl border-4 border-sky-300 px-5 py-4 text-center text-3xl font-black uppercase text-slate-800 outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={savePhrase}
            disabled={!phraseDraft.trim()}
            className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-10 py-4 text-2xl font-black text-white shadow-xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}
          </button>
          {savedPhrase && <p className="mt-4 font-bold text-emerald-700">{'\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e'}: {savedPhrase}</p>}
        </div>
      </div>
    );
  }
  // If in edit mode and no embed URL, show editor
  if (!isViewMode && !embedUrl) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">СЂСџР‹Р‡</div>
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
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
      {error && <div role="alert" className="w-full shrink-0 bg-amber-50 px-3 py-1 text-sm">{error}</div>}
      <iframe
        ref={frame}
        src={embedUrl}
        className="w-full min-h-0 flex-1 border-0"
        title={activity.title}
        allow="autoplay; fullscreen; microphone; camera"
        allowFullScreen
      />
    </div>
  );
};

export default InteractiveActivityRenderer;
