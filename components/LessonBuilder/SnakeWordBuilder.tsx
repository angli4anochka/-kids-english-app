import { useState, useEffect } from 'react';
import SnakeWordGame from './SnakeWordGame';
import type { GameResult } from './SnakeWordGame';

export interface SnakeWordConfig {
  words: string[];
  speedMs: number;
  lives: number;
  collectMode: 'letters-in-order';
  wrongLetterPenalty: 'lose-life' | 'minus-score' | 'restart-word';
  showHint: boolean;
  timeLimitSec?: number;
}

interface SnakeWordBuilderProps {
  value: SnakeWordConfig;
  onChange?: (config: SnakeWordConfig) => void;
  isViewMode?: boolean;
  onFinish?: (result: GameResult) => void;
}

const SnakeWordBuilder = ({ value, onChange, isViewMode = false, onFinish }: SnakeWordBuilderProps) => {
  const [config, setConfig] = useState<SnakeWordConfig>(value || {
    words: [],
    speedMs: 390,
    lives: 3,
    collectMode: 'letters-in-order',
    wrongLetterPenalty: 'lose-life',
    showHint: true,
  });

  const [wordsText, setWordsText] = useState(config.words.join('\n'));
  const [showPreview, setShowPreview] = useState(false);

  // Update parent when config changes (skip in view mode — students don't edit)
  useEffect(() => {
    if (isViewMode) return;
    onChange?.(config);
  }, [config, isViewMode]);

  // Parse words from textarea
  const handleWordsChange = (text: string) => {
    setWordsText(text);
    const words = text
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    setConfig({ ...config, words });
  };

  const handleSpeedChange = (speed: string) => {
    const speedMap: Record<string, number> = {
      slow: 500,
      normal: 390,
      fast: 250,
    };
    setConfig({ ...config, speedMs: speedMap[speed] || 390 });
  };

  const getSpeedLabel = (speedMs: number): string => {
    if (speedMs >= 450) return 'slow';
    if (speedMs <= 300) return 'fast';
    return 'normal';
  };

  // View mode - show the game
  if (isViewMode) {
    return (
      <div className="w-full h-full">
        <SnakeWordGame
          words={config.words}
          speedMs={config.speedMs}
          lives={config.lives}
          wrongLetterPenalty={config.wrongLetterPenalty}
          showHint={config.showHint}
          onFinish={onFinish}
        />
      </div>
    );
  }

  // Edit mode - show configuration form
  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden p-3">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">🐍</span>
            <h2 className="text-2xl font-bold text-gray-800">Snake Word Builder</h2>
          </div>
          <p className="text-sm text-gray-600">
            Students collect letters in order to build words by controlling a snake
          </p>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          {/* Words Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Words (one per line) *
            </label>
            <textarea
              value={wordsText}
              onChange={(e) => handleWordsChange(e.target.value)}
              placeholder="apple&#10;banana&#10;orange&#10;milk&#10;cake"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none h-40 font-mono text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each word on a new line. Words will be converted to uppercase in game.
            </p>
            {config.words.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {config.words.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
                  >
                    {word.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Speed */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Snake Speed
            </label>
            <select
              value={getSpeedLabel(config.speedMs)}
              onChange={(e) => handleSpeedChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="slow">🐌 Slow (500ms)</option>
              <option value="normal">🐍 Normal (390ms)</option>
              <option value="fast">⚡ Fast (250ms)</option>
            </select>
          </div>

          {/* Lives */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lives
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.lives}
              onChange={(e) => setConfig({ ...config, lives: parseInt(e.target.value) || 3 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of lives student has. Default: 3
            </p>
          </div>

          {/* Wrong Letter Penalty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Wrong Letter Penalty
            </label>
            <select
              value={config.wrongLetterPenalty}
              onChange={(e) => setConfig({ ...config, wrongLetterPenalty: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="lose-life">💔 Lose a life</option>
              <option value="minus-score">📉 Minus 5 points</option>
              <option value="restart-word">🔄 Restart current word</option>
            </select>
          </div>

          {/* Show Hint */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showHint}
                onChange={(e) => setConfig({ ...config, showHint: e.target.checked })}
                className="w-5 h-5"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700">Show Hint</span>
                <p className="text-xs text-gray-500">Display current word and next letter to collect</p>
              </div>
            </label>
          </div>

          {/* Time Limit (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time Limit (optional)
            </label>
            <input
              type="number"
              min="0"
              placeholder="No limit"
              value={config.timeLimitSec || ''}
              onChange={(e) => setConfig({
                ...config,
                timeLimitSec: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Time limit in seconds. Leave empty for no limit.
            </p>
          </div>
        </div>

        {/* Preview Button */}
        {config.words.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl font-bold rounded-xl transition transform hover:scale-105"
            >
              {showPreview ? '✏️ Edit Settings' : '👁️ Preview Game'}
            </button>

            {showPreview && (
              <div className="mt-6 border-4 border-purple-300 rounded-2xl overflow-hidden">
                <div className="bg-purple-100 px-4 py-2 text-center font-semibold text-purple-700">
                  Preview Mode
                </div>
                <div style={{ height: '600px' }}>
                  <SnakeWordGame
                    words={config.words}
                    speedMs={config.speedMs}
                    lives={config.lives}
                    wrongLetterPenalty={config.wrongLetterPenalty}
                    showHint={config.showHint}
                    previewMode={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {config.words.length === 0 && (
          <div className="mt-8 p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
            <div className="text-6xl mb-4">🐍</div>
            <p className="text-gray-600 text-lg mb-2">No words added yet</p>
            <p className="text-gray-400 text-sm">Add words above to configure the game</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeWordBuilder;
