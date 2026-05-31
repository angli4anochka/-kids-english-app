import { useState, useEffect, useRef } from 'react';
import type { LetterRaceConfig } from './LetterRaceGame';

interface Props {
  initialConfig?: LetterRaceConfig;
  onSave: (config: LetterRaceConfig) => void;
}

const LetterRaceBuilder: React.FC<Props> = ({ initialConfig, onSave }) => {
  const [title, setTitle] = useState(initialConfig?.title || 'Гонки B / D');
  const [subtitle, setSubtitle] = useState(
    initialConfig?.subtitle || 'Рули машинкой и собирай только правильную букву'
  );
  const [letterA, setLetterA] = useState(initialConfig?.letterA || 'B');
  const [letterB, setLetterB] = useState(initialConfig?.letterB || 'D');
  const [targetGoal, setTargetGoal] = useState(initialConfig?.targetGoal || 10);

  const handleSave = () => {
    onSave({
      title,
      subtitle,
      letterA,
      letterB,
      targetGoal,
    });
  };

  // Auto-propagate config to the parent on every change (skip initial mount so we
  // don't re-save on open). Keeps activity.letterRaceConfig current without needing
  // to press the manual save button.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    onSave({ title, subtitle, letterA, letterB, targetGoal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, letterA, letterB, targetGoal]);

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">🏎️ Конструктор гонок букв</h2>

        {/* Title and subtitle */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
              placeholder="Гонки B / D"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Подзаголовок</label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="Рули машинкой и собирай только правильную букву"
              rows={2}
            />
          </div>
        </div>

        {/* Letter Configuration */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Буквы для игры</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
              <label className="block text-sm font-semibold text-green-800 mb-2">
                Буква A (правильная)
              </label>
              <input
                type="text"
                maxLength={1}
                value={letterA}
                onChange={(e) => setLetterA(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-2xl font-bold text-center uppercase"
                placeholder="B"
              />
              <p className="text-xs text-green-700 mt-2">
                Эту букву нужно собрать
              </p>
            </div>

            <div className="p-5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200">
              <label className="block text-sm font-semibold text-orange-800 mb-2">
                Буква B (неправильная)
              </label>
              <input
                type="text"
                maxLength={1}
                value={letterB}
                onChange={(e) => setLetterB(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:border-orange-500 focus:outline-none text-2xl font-bold text-center uppercase"
                placeholder="D"
              />
              <p className="text-xs text-orange-700 mt-2">
                Эту букву нужно избегать
              </p>
            </div>
          </div>
        </div>

        {/* Goal Configuration */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Цель игры</h3>
          <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
            <label className="block text-sm font-semibold text-blue-800 mb-2">
              Сколько букв нужно собрать для победы?
            </label>
            <input
              type="number"
              min={5}
              max={30}
              value={targetGoal}
              onChange={(e) => setTargetGoal(parseInt(e.target.value) || 10)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none text-2xl font-bold text-center"
            />
            <div className="flex gap-2 mt-3">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setTargetGoal(num)}
                  className={`flex-1 px-3 py-2 rounded-lg font-bold text-sm transition ${
                    targetGoal === num
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800 font-semibold">
            💡 Подсказка: Ребёнок будет управлять машинкой стрелками (← →) или клавишами A/D, собирая правильные
            буквы и избегая неправильных. За неправильную букву машинка тормозит и теряется один балл.
          </p>
        </div>

        {/* Preview */}
        <div className="mb-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Предпросмотр настроек</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-gray-700">Заголовок:</span>{' '}
              <span className="text-gray-600">{title}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Подзаголовок:</span>{' '}
              <span className="text-gray-600">{subtitle}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Правильная буква:</span>{' '}
              <span className="text-green-600 font-bold text-lg">{letterA}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Неправильная буква:</span>{' '}
              <span className="text-orange-600 font-bold text-lg">{letterB}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Цель:</span>{' '}
              <span className="text-blue-600 font-bold">{targetGoal} букв</span>
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterRaceBuilder;
