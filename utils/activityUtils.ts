/**
 * Utility functions for activity management
 */

/**
 * Get icon emoji for activity type
 */
export const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'meet-family': '👨‍👩‍👧‍👦',
    speaking: '💬',
    sounds: '🔊',
    numbers: '🔢',
    video: '📹',
    song: '🎵',
    game: '🎮',
    quiz: '❓',
    image: '🖼️',
    wordwall: '🎯',
    genially: '🎨',
    presentation: '📊',
    'drag-words': '✍️',
    'drag-text': '📝',
    'snake-word': '🐍',
    'letter-trace': '✏️',
    'letter-race': '🏎️',
    'letter-maze': '🌀',
    interactive: '🎯',
    complete: '🎉',
  };
  return icons[type] || '📄';
};

/**
 * Get background color class for activity type
 */
export const getActivityColor = (type: string): string => {
  const colors: Record<string, string> = {
    video: 'bg-red-100',
    image: 'bg-blue-100',
    wordwall: 'bg-yellow-100',
    genially: 'bg-purple-100',
    presentation: 'bg-green-100',
    'drag-words': 'bg-orange-100',
    'snake-word': 'bg-teal-100',
    'letter-trace': 'bg-pink-100',
    'letter-race': 'bg-indigo-100',
    'letter-maze': 'bg-cyan-100',
  };
  return colors[type] || 'bg-gray-100';
};

/**
 * Get display name for template ID
 */
export const getTemplateName = (templateId: string): string => {
  const names: Record<string, string> = {
    'insert-image': 'Картинка',
    'youtube-video': 'Видео YouTube',
    'wordwall-game': 'Игра Wordwall',
    genially: 'Genially',
    presentation: 'Презентация',
    'drag-text': 'Перетащи слова',
    'fill-text': 'Заполни пропуски',
    'choose-word': 'Выбери слово',
    'drag-image': 'Перетащи картинку',
    'type-image': 'Напечатай слово',
    'select-image': 'Выбери картинку',
    'test-no-timer': 'Тест без таймера',
    'test-timer': 'Тест с таймером',
    'interactive-iframe': 'Интерактивный контент',
    'snake-word': 'Змейка слов',
    'letter-trace': 'Обводим буквы',
    'letter-race': 'Гонки букв',
    'letter-maze': 'Лабиринт букв',
    'secret-key-quest': 'Квест: Секретный ключ',
    'abc-quest': 'ABC Quest Quiz',
    'letter-jump': 'Прыжки на букву',
    'bubble-grammar': 'Грамматические пузыри',
  };
  return names[templateId] || 'Новая активность';
};

/**
 * Map template ID to activity type
 */
export const getActivityTypeFromTemplate = (templateId: string): string => {
  const mapping: Record<string, string> = {
    'insert-image': 'image',
    'youtube-video': 'video',
    'wordwall-game': 'wordwall',
    genially: 'genially',
    presentation: 'presentation',
    'drag-text': 'drag-text',
    'fill-text': 'quiz',
    'choose-word': 'quiz',
    'drag-image': 'game',
    'type-image': 'game',
    'select-image': 'game',
    'test-no-timer': 'quiz',
    'test-timer': 'quiz',
    'interactive-iframe': 'game',
    'snake-word': 'snake-word',
    'letter-trace': 'letter-trace',
    'letter-race': 'letter-race',
    'letter-maze': 'letter-maze',
    'secret-key-quest': 'secret-key-quest',
    'abc-quest': 'abc-quest',
    'letter-jump': 'letter-jump',
    'bubble-grammar': 'bubble-grammar',
  };
  return mapping[templateId] || 'quiz';
};

/**
 * Get tags for template ID
 */
export const getTemplateTags = (templateId: string): string[] | undefined => {
  const tagsMap: Record<string, string[]> = {
    'wordwall-game': ['Wordwall'],
    genially: ['Genially'],
    'snake-word': ['Snake'],
    'letter-trace': ['Letter Trace'],
    'letter-race': ['Letter Race'],
    'letter-maze': ['Letter Maze'],
    'secret-key-quest': ['Quest'],
    'abc-quest': ['ABC Quest'],
    'letter-jump': ['Letter Jump'],
    'bubble-grammar': ['Bubble', 'Grammar'],
  };
  return tagsMap[templateId];
};

/**
 * Play transition sound effect (whoosh)
 */
export const playTransitionSound = (): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create "whoosh" sound - quick frequency drop
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);

    // Volume envelope for smoothness
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};
