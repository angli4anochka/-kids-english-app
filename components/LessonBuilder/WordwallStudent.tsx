import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WordwallStudentProps {
  wordwallUrl: string;
  sessionId: string;
}

export default function WordwallStudent({ wordwallUrl, sessionId }: WordwallStudentProps) {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Join session on mount
  useEffect(() => {
    joinSession();
  }, []);

  const joinSession = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/kids-api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id })
      });

      if (response.ok) {
        setIsJoined(true);
      }
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const markAsCompleted = async () => {
    if (!user?.id) return;

    try {
      await fetch(`/kids-api/sessions/${sessionId}/participants/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  // Extract wordwall URL properly
  const getWordwallEmbedUrl = () => {
    if (wordwallUrl.includes('iframe')) {
      // Extract src from iframe HTML
      const srcMatch = wordwallUrl.match(/src="([^"]*)"/);
      if (srcMatch && srcMatch[1]) {
        return srcMatch[1];
      }
      return wordwallUrl;
    }
    return wordwallUrl;
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl">Подключение к сессии...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-2xl">
          <div className="text-8xl mb-6">✅</div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Отлично!
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Вы отметили задание как выполненное
          </p>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <p className="text-blue-800 text-lg">
              Ждите следующей активности от учителя...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              🎮 Wordwall - {user?.displayName || 'Ученик'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Выполните задание и нажмите "Готово"
            </p>
          </div>
          <button
            onClick={markAsCompleted}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold rounded-xl transition shadow-lg transform hover:scale-105"
          >
            ✓ Готово
          </button>
        </div>
      </div>

      {/* Wordwall iframe - fullscreen */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {wordwallUrl.includes('iframe') ? (
            <div
              dangerouslySetInnerHTML={{
                __html: wordwallUrl
                  .replace(/width="[^"]*"/g, 'width="100%"')
                  .replace(/height="[^"]*"/g, 'height="100%"')
                  .replace(/style="[^"]*"/g, 'style="width:100%;height:100%"')
              }}
              className="w-full h-full"
            />
          ) : (
            <iframe
              src={getWordwallEmbedUrl()}
              className="w-full h-full"
              allowFullScreen
              title="Wordwall Activity"
            />
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-center">
        <p className="text-white text-lg font-semibold">
          💡 После завершения игры нажмите кнопку "Готово" в правом верхнем углу
        </p>
      </div>
    </div>
  );
}
