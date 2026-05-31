import { useState, useEffect, useRef } from 'react';
import type { LetterTraceConfig, LetterRow } from './LetterTraceGame';

interface Props {
  initialConfig?: LetterTraceConfig;
  onSave: (config: LetterTraceConfig) => void;
}

const LetterTraceBuilder: React.FC<Props> = ({ initialConfig, onSave }) => {
  const [title, setTitle] = useState(initialConfig?.title || 'A words');
  const [subtitle, setSubtitle] = useState(initialConfig?.subtitle || 'Follow the dots');
  const [rows, setRows] = useState<LetterRow[]>(
    initialConfig?.rows || [
      { icon: '🔊', label: 'эй', text: 'A a', translation: 'letter A', desiredRepeats: 3, minRepeats: 2, scale: 1.0 },
    ]
  );

  const addRow = () => {
    setRows([
      ...rows,
      { icon: '📝', label: 'word', text: 'word', translation: 'слово', desiredRepeats: 3, minRepeats: 1, scale: 0.9 },
    ]);
  };

  const updateRow = (index: number, field: keyof LetterRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const deleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === rows.length - 1)) return;
    const newRows = [...rows];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
    setRows(newRows);
  };

  const handleSave = () => {
    onSave({ title, subtitle, rows });
  };

  // Auto-propagate config to the parent on every change (skip initial mount).
  // Keeps activity.letterTraceConfig current without needing the manual save button.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    onSave({ title, subtitle, rows });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, rows]);

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50 p-3">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">✏️ Конструктор прописей</h2>

        {/* Title and subtitle - compact */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
              placeholder="A words"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Подзаголовок</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
              placeholder="Follow the dots"
            />
          </div>
        </div>

        {/* Rows - compact */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-700">Строки для обводки</label>
            <button
              onClick={addRow}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition text-xs"
            >
              + Добавить
            </button>
          </div>

          {rows.map((row, index) => (
            <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                {/* Move buttons - compact */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveRow(index, 'up')}
                    disabled={index === 0}
                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveRow(index, 'down')}
                    disabled={index === rows.length - 1}
                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                </div>

                {/* Row fields - compact grid */}
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Иконка</label>
                    <input
                      type="text"
                      value={row.icon}
                      onChange={(e) => updateRow(index, 'icon', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:border-purple-500 focus:outline-none text-sm"
                      placeholder="🔊"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Подпись</label>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(index, 'label', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:border-purple-500 focus:outline-none text-sm"
                      placeholder="эй"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Текст для обводки</label>
                    <input
                      type="text"
                      value={row.text}
                      onChange={(e) => updateRow(index, 'text', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:border-purple-500 focus:outline-none text-sm"
                      placeholder="A a"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Перевод</label>
                    <input
                      type="text"
                      value={row.translation}
                      onChange={(e) => updateRow(index, 'translation', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:border-purple-500 focus:outline-none text-sm"
                      placeholder="letter A"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Масштаб</label>
                    <input
                      type="number"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={row.scale || 1}
                      onChange={(e) => updateRow(index, 'scale', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:border-purple-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Delete button - compact */}
                <button
                  onClick={() => deleteRow(index)}
                  className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Compact hint */}
        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Все английские буквы A-Z, a-z. Используйте + для разделения строк (apple+ant)
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition text-sm"
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterTraceBuilder;
