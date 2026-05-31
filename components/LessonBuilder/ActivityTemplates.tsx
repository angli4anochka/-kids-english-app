import { useState } from 'react';
import type { ReactElement } from 'react';

interface Template {
  id: string;
  title: string;
  description?: string;
  preview: ReactElement;
  category: string;
}

const ACTIVITY_TEMPLATES: Template[] = [
  {
    id: 'insert-image',
    title: 'Вставить картинку',
    category: 'media',
    preview: (
      <div className="p-3 text-center">
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
          <span className="text-4xl mb-2">📷</span>
          <span className="text-xs text-gray-500">Нажмите для загрузки картинки</span>
          <span className="text-xs text-gray-400">JPG, PNG, GIF до 10MB</span>
        </div>
        <input
          type="text"
          placeholder="Подпись к картинке (опционально)"
          className="w-full text-xs border rounded px-2 py-1 mt-2"
        />
      </div>
    )
  },
  {
    id: 'youtube-video',
    title: 'Видео с YouTube',
    category: 'media',
    preview: (
      <div className="p-3">
        <div className="w-full h-28 bg-black rounded-lg mb-2 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50 rounded-lg"></div>
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center z-10">
            <span className="text-white text-xl">▶</span>
          </div>
        </div>
        <input
          type="text"
          placeholder="Вставьте ссылку на YouTube видео"
          className="w-full text-xs border rounded px-2 py-1 mb-1"
          defaultValue="https://youtube.com/watch?v=..."
        />
        <div className="flex gap-2 mt-2">
          <label className="flex items-center text-xs">
            <input type="checkbox" className="mr-1" defaultChecked />
            Автовоспроизведение
          </label>
          <label className="flex items-center text-xs">
            <input type="checkbox" className="mr-1" />
            Скрыть контролы
          </label>
        </div>
      </div>
    )
  },
  {
    id: 'internal-video',
    title: 'Внутреннее видео',
    description: 'Видеофайл MP4 с сервера',
    category: 'media',
    preview: (
      <div className="p-3">
        <div className="w-full h-28 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-lg mb-2 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40 rounded-lg"></div>
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center z-10 shadow-lg">
            <span className="text-white text-xl">▶</span>
          </div>
          <div className="absolute top-2 right-2 text-xs bg-purple-500/80 text-white px-2 py-1 rounded z-10">
            MP4
          </div>
        </div>
        <input
          type="text"
          placeholder="Вставьте прямую ссылку на видеофайл (.mp4)"
          className="w-full text-xs border rounded px-2 py-1 mb-1"
          defaultValue="https://storage.yandexcloud.net/..."
        />
        <div className="text-xs text-gray-500 mt-1">
          Поддерживаются: MP4, WebM, MOV
        </div>
      </div>
    )
  },
  {
    id: 'wordwall-game',
    title: 'Игра Wordwall',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mb-2 flex items-center justify-center">
          <div className="text-white">
            <div className="text-2xl font-bold text-center">Wordwall</div>
            <div className="text-xs text-center">Interactive Game</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Вставьте ссылку на игру Wordwall"
          className="w-full text-xs border rounded px-2 py-1 mb-2"
        />
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Quiz</span>
          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Match up</span>
          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Random wheel</span>
        </div>
      </div>
    )
  },
  {
    id: 'genially',
    title: 'Genially',
    description: 'Интерактивная презентация Genially',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-2 left-2 w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-3 right-4 w-6 h-6 bg-white/15 rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-white/10 rounded-full"></div>
          </div>
          <div className="text-white text-center z-10">
            <div className="text-2xl font-bold mb-1">✨ Genially</div>
            <div className="text-xs font-semibold">Интерактивный контент</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Вставьте ссылку на Genially"
          className="w-full text-xs border rounded px-2 py-1 mb-2"
          defaultValue="https://view.genial.ly/..."
        />
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Interactive</span>
          <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded">Games</span>
          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">Quizzes</span>
        </div>
      </div>
    )
  },
  {
    id: 'presentation',
    title: 'Презентация',
    description: 'PowerPoint / Google Slides',
    category: 'media',
    preview: (
      <div className="p-3">
        <div className="w-full h-28 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10"></div>
          <div className="flex flex-col items-center z-10">
            <span className="text-4xl text-white mb-1">📊</span>
            <span className="text-xs text-white font-semibold">Презентация</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button className="flex-1 text-xs bg-blue-100 text-blue-700 py-1 px-2 rounded">Google Slides</button>
            <button className="flex-1 text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded">Экран</button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Покажите презентацию с компьютера
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'interactive-iframe',
    title: 'Интерактивное упражнение',
    description: 'Umaigra, LearningApps и др.',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg mb-2 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl font-bold">🎯</div>
            <div className="text-xs mt-1">Интерактив</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Вставьте iframe код или ссылку"
          className="w-full text-xs border rounded px-2 py-1 mb-2"
        />
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Umaigra</span>
          <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">LearningApps</span>
          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Quizlet</span>
        </div>
      </div>
    )
  },
  {
    id: 'snake-word',
    title: 'Snake Word Builder',
    description: 'Собери слово змейкой',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10"></div>
          <div className="text-white text-center z-10">
            <div className="text-3xl font-bold mb-1">🐍</div>
            <div className="text-xs font-semibold">Snake Word</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-green-500 text-white px-2 py-0.5 rounded">A</span>
              <span className="bg-green-500 text-white px-2 py-0.5 rounded">P</span>
              <span className="bg-green-500 text-white px-2 py-0.5 rounded">P</span>
              <span className="bg-gray-200 px-2 py-0.5 rounded">L</span>
              <span className="bg-gray-200 px-2 py-0.5 rounded">E</span>
            </div>
            <div className="text-xs text-gray-400">Собирайте буквы по порядку</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'letter-trace',
    title: 'Электронные прописи',
    description: 'Обводите буквы стилусом',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-r from-yellow-200 via-orange-200 to-blue-200 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-2 top-3 w-full h-0.5 bg-blue-300"></div>
            <div className="absolute left-2 top-1/2 w-full h-0.5 bg-blue-300 opacity-50"></div>
            <div className="absolute left-2 bottom-3 w-full h-0.5 bg-blue-400"></div>
          </div>
          <div className="text-gray-800 text-center z-10">
            <div className="text-4xl font-bold mb-1">✏️</div>
            <div className="text-xs font-semibold">Прописи</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔊</span>
              <span className="font-mono text-lg text-gray-400" style={{ textDecoration: 'dotted underline' }}>A a</span>
            </div>
            <div className="text-xs text-gray-400">Обводите буквы по точкам</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'letter-race',
    title: 'Гонки букв',
    description: 'Собирайте правильные буквы машинкой',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-br from-blue-100 via-yellow-100 to-purple-100 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-green-600"></div>
            <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-green-600"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-white/80"></div>
          </div>
          <div className="text-gray-800 text-center z-10">
            <div className="text-4xl font-bold mb-1">🏎️</div>
            <div className="text-xs font-semibold">Гонки букв</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-2xl">🚗</span>
                <span className="text-lg font-bold text-green-600">B</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-orange-600">D</span>
                <span className="text-xs text-gray-400">избегать</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">Управляйте машинкой стрелками</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'letter-maze',
    title: 'Лабиринт букв',
    description: 'Найдите буквы в лабиринте по порядку',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-br from-yellow-100 via-blue-100 to-purple-100 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-5 grid-rows-5 gap-0.5 w-full h-full">
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-white"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-white"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-white"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-white"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-white"></div>
              <div className="bg-white"></div>
              <div className="bg-white"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-blue-600"></div>
            </div>
          </div>
          <div className="text-gray-800 text-center z-10">
            <div className="text-4xl font-bold mb-1">🧭</div>
            <div className="text-xs font-semibold">Лабиринт</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-2xl">🙂</span>
                <span className="text-xs text-gray-400">игрок</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-green-600">A → B → C</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">Найдите буквы по порядку</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'secret-key-quest',
    title: 'Секретный ключ',
    description: 'Мини-квест с буквами и приветствиями',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-br from-cyan-200 via-teal-200 to-green-200 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-2 right-2 text-3xl animate-bounce">🗝️</div>
          <div className="text-gray-800 text-center z-10">
            <div className="text-4xl font-bold mb-1">🐶</div>
            <div className="text-xs font-semibold">Квест с хранителем</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xl">🔐</span>
                <span className="text-xs text-gray-400">3 задания</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-yellow-600">🗝️</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">Получи золотой ключ для урока 2</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'letter-jump',
    title: 'Letter Jump',
    description: 'Прыгай и собирай правильные буквы',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-br from-sky-200 via-blue-300 to-blue-500 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-blue-900"></div>
            <div className="absolute bottom-4 left-4 w-16 h-2 bg-blue-800 rounded"></div>
            <div className="absolute bottom-4 right-8 w-20 h-2 bg-blue-800 rounded"></div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-2 bg-blue-800 rounded"></div>
          </div>
          <div className="text-gray-800 text-center z-10">
            <div className="text-4xl font-bold mb-1">🏃</div>
            <div className="text-xs font-semibold">Платформер</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-2xl">🏃</span>
                <span className="text-xs text-gray-400">игрок</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-yellow-600">A B C</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">Прыгай по платформам и собирай буквы</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'bubble-grammar',
    title: 'Bubble Grammar Pop',
    description: 'Лопай пузыри с правильными ответами (мышка + камера)',
    category: 'games',
    preview: (
      <div className="p-3">
        <div className="w-full h-24 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 left-3 w-8 h-8 bg-blue-300 rounded-full blur-sm"></div>
            <div className="absolute top-6 right-5 w-6 h-6 bg-purple-300 rounded-full blur-sm"></div>
            <div className="absolute bottom-3 left-8 w-7 h-7 bg-cyan-300 rounded-full blur-sm"></div>
            <div className="absolute bottom-4 right-3 w-5 h-5 bg-pink-300 rounded-full blur-sm"></div>
          </div>
          <div className="text-white text-center z-10">
            <div className="text-4xl font-bold mb-1">🫧</div>
            <div className="text-xs font-semibold">Grammar Pop</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xl">🖐️</span>
                <span className="text-xs text-gray-400">управление рукой</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-blue-600">📹</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">Present Simple/Continuous через камеру</div>
          </div>
        </div>
      </div>
    )
  }
];

interface ActivityTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

const ActivityTemplates = ({ onSelectTemplate, onClose }: ActivityTemplatesProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = selectedCategory === 'all'
    ? ACTIVITY_TEMPLATES
    : ACTIVITY_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Выберите шаблон активности</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Все шаблоны
            </button>
            <button
              onClick={() => setSelectedCategory('media')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'media'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📷 Медиа
            </button>
            <button
              onClick={() => setSelectedCategory('games')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'games'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🎮 Игры
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                {/* Template Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 min-h-[200px] flex items-center justify-center">
                  {template.preview}
                </div>

                {/* Template Title */}
                <div className="p-4 bg-white border-t">
                  <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                    {template.title}
                  </h3>
                  {template.description && (
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>

                {/* Like Button */}
                <button
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle like
                  }}
                >
                  <span className="text-gray-400 hover:text-red-500">♡</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTemplates;