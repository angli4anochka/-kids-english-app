import { useState } from 'react';
import type { LetterMazeConfig } from './LetterMazeGame';

interface Props {
  initialConfig?: LetterMazeConfig;
  onSave: (config: LetterMazeConfig) => void;
}

const LetterMazeBuilder: React.FC<Props> = ({ initialConfig, onSave }) => {
  const [title, setTitle] = useState(initialConfig?.title || 'Letter Maze');
  const [subtitle, setSubtitle] = useState(
    initialConfig?.subtitle || 'Control: arrows, WASD or screen buttons. Correct letter: +1. Wrong letter: -1 and minus life.'
  );
  const [targetLetters, setTargetLetters] = useState<string[]>(initialConfig?.targetLetters || ['A', 'B', 'C', 'D']);
  const [lives, setLives] = useState(initialConfig?.lives || 3);
  const [newLetter, setNewLetter] = useState('');

  const handleAddLetter = () => {
    if (newLetter && newLetter.length === 1 && !targetLetters.includes(newLetter.toUpperCase())) {
      setTargetLetters([...targetLetters, newLetter.toUpperCase()]);
      setNewLetter('');
    }
  };

  const handleRemoveLetter = (index: number) => {
    setTargetLetters(targetLetters.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      title,
      subtitle,
      targetLetters,
      lives,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 p-3">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">🧭 Лабиринт букв</h2>

        {/* Title and subtitle - compact */}
        <div className="space-y-2 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              placeholder="Letter Maze"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Инструкция</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              placeholder="Control: arrows, WASD..."
            />
          </div>
        </div>

        {/* Target Letters - compact */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">Буквы для поиска (по порядку)</label>

          <div className="flex flex-wrap gap-2 mb-2">
            {targetLetters.map((letter, index) => (
              <div
                key={index}
                className="group relative inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-lg border border-green-300"
              >
                <span className="text-lg font-bold text-green-800">{letter}</span>
                <span className="text-xs font-semibold text-green-600">#{index + 1}</span>
                <button
                  onClick={() => handleRemoveLetter(index)}
                  className="opacity-0 group-hover:opacity-100 transition absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={1}
              value={newLetter}
              onChange={(e) => setNewLetter(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLetter()}
              className="w-16 px-2 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-xl font-bold text-center uppercase"
              placeholder="E"
            />
            <button
              onClick={handleAddLetter}
              disabled={!newLetter || newLetter.length !== 1}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-sm"
            >
              + Добавить
            </button>
          </div>
        </div>

        {/* Lives - compact */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">Количество жизней</label>
          <div className="flex gap-2">
            {[1, 3, 5, 7].map((num) => (
              <button
                key={num}
                onClick={() => setLives(num)}
                className={`flex-1 px-2 py-2 rounded-lg font-bold text-sm transition ${
                  lives === num
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {'❤️'.repeat(num)}
              </button>
            ))}
          </div>
        </div>

        {/* Compact preview */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Буквы:</strong> {targetLetters.join(' → ')} | <strong>Жизни:</strong> {'❤️'.repeat(lives)}
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition text-sm"
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterMazeBuilder;
