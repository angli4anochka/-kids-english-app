import ActivityTypeCard from './ActivityTypeCard';

interface ActivityLibraryProps {
  onSelectType: (type: string) => void;
}

export default function ActivityLibrary({ onSelectType }: ActivityLibraryProps) {
  // Preview components for different activity types
  const DragWordToGapPreview = () => (
    <div className="w-full space-y-2 text-sm">
      <div className="flex gap-2 justify-center mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">red</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">school</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">computer</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">class</span>
      </div>
      <p className="text-gray-700 text-center">
        Hello! I am a <span className="inline-block w-16 h-6 border-b-2 border-dashed border-blue-400"></span> is a modern...
        Today I have a big test in <span className="inline-block w-16 h-6 border-b-2 border-dashed border-blue-400"></span>.
        I open my <span className="inline-block w-16 h-6 border-b-2 border-dashed border-blue-400"></span>...
      </p>
    </div>
  );

  const TypeWordToGapPreview = () => (
    <div className="w-full space-y-2 text-sm">
      <p className="text-gray-700 text-center leading-relaxed">
        Hello! I am a <span className="inline-block w-20 px-2 py-0.5 bg-blue-50 border border-blue-300 rounded text-blue-600">student</span> is a modern...
        Today I have a <input className="w-16 px-1 border-b border-gray-400 text-center" placeholder="..." disabled />
        and I check this <input className="w-16 px-1 border-b border-gray-400 text-center" placeholder="..." disabled />.
        Then I the first question and start to write.
      </p>
    </div>
  );

  const SelectWordFormToGapPreview = () => (
    <div className="w-full space-y-2 text-sm">
      <p className="text-gray-700 text-center leading-relaxed">
        Hello! I am a{' '}
        <select className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white" disabled>
          <option>student</option>
        </select>{' '}
        is a modern... I open my{' '}
        <select className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white" disabled>
          <option>computer</option>
        </select>
        ... the first question and start on write.
      </p>
    </div>
  );

  const DragWordToImagePreview = () => (
    <div className="w-full">
      <div className="flex gap-2 justify-center mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Woman</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Cat</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Dog</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {['👩', '🐕', '👧', '🐱'].map((emoji, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-2xl mb-1">
              {emoji}
            </div>
            {i === 0 && <div className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Woman</div>}
          </div>
        ))}
      </div>
    </div>
  );

  const SelectWordFormToImagePreview = () => (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2">
        {[
          { emoji: '👨', options: ['Man', 'Cat', 'Girl'] },
          { emoji: '🐕', options: ['Cat', 'Dog'] },
          { emoji: '👧', options: ['Man', 'Girl'] },
          { emoji: '🐱', options: ['Cat', 'Dog'] },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-2xl mb-1">
              {item.emoji}
            </div>
            <select className="text-xs px-1 py-0.5 border border-gray-300 rounded bg-white" disabled>
              {item.options.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const TestWithoutTimerPreview = () => (
    <div className="w-full space-y-3">
      <p className="text-xs text-gray-600 text-center">
        They are going to the cinema at the moment
      </p>
      <div className="flex items-center gap-2 text-xs">
        <input type="checkbox" className="w-4 h-4" disabled />
        <span className="text-gray-700">are going</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input type="checkbox" className="w-4 h-4" disabled />
        <span className="text-gray-700">going</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input type="checkbox" className="w-4 h-4" disabled />
        <span className="text-gray-700">go</span>
      </div>
    </div>
  );

  const TestWithTimerPreview = () => (
    <div className="w-full space-y-3">
      <div className="flex justify-center gap-2 mb-3">
        <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded">Not started</button>
        <button className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded">00:10</button>
        <button className="px-3 py-1 bg-orange-500 text-white text-xs rounded">Complete the test</button>
      </div>
      <p className="text-xs text-gray-600 text-center">
        They are going to the cinema at the moment
      </p>
      <div className="flex items-center gap-2 text-xs">
        <input type="checkbox" className="w-4 h-4" disabled />
        <span className="text-gray-700">are going</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input type="checkbox" className="w-4 h-4" disabled />
        <span className="text-gray-700">going</span>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50">
      {/* Words and Gaps Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Слова и пропуски</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityTypeCard
            title="Перенести слово к пропуску"
            preview={<DragWordToGapPreview />}
            onSelect={() => onSelectType('drag-word-to-gap')}
          />
          <ActivityTypeCard
            title="Ввести слово в пропуск"
            preview={<TypeWordToGapPreview />}
            onSelect={() => onSelectType('type-word-to-gap')}
          />
          <ActivityTypeCard
            title="Выбрать форму слова к пропуску"
            preview={<SelectWordFormToGapPreview />}
            onSelect={() => onSelectType('select-word-form-to-gap')}
          />
          <ActivityTypeCard
            title="Перенести слово к изображению"
            preview={<DragWordToImagePreview />}
            onSelect={() => onSelectType('drag-word-to-image')}
          />
          <ActivityTypeCard
            title="Выбрать форму слова к изображению"
            preview={<SelectWordFormToImagePreview />}
            onSelect={() => onSelectType('select-word-form-to-image')}
          />
        </div>
      </div>

      {/* Tests Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-4">Тесты</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityTypeCard
            title="Тест без таймера"
            preview={<TestWithoutTimerPreview />}
            onSelect={() => onSelectType('test-without-timer')}
          />
          <ActivityTypeCard
            title="Тест с таймером"
            preview={<TestWithTimerPreview />}
            onSelect={() => onSelectType('test-with-timer')}
          />
        </div>
      </div>
    </div>
  );
}
