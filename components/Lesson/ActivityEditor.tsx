import { useState, useEffect, useRef } from 'react';
import { lessonService } from '../../services/lessonService';
import ActivityLibrary from './ActivityLibrary';
import type { Activity } from '../../types';

interface ActivityEditorProps {
  activity?: Activity | null;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}

const ACTIVITY_TYPES = [
  { value: 'image', label: 'Картинка', emoji: '🖼️' },
  { value: 'youtube', label: 'YouTube видео', emoji: '📺' },
  { value: 'wordwall', label: 'Wordwall игра', emoji: '🎮' },
  { value: 'text', label: 'Текст', emoji: '📝' },
  { value: 'meet-family', label: 'Знакомство с семьей', emoji: '👨‍👩‍👧‍👦' },
  { value: 'speaking', label: 'Говорение', emoji: '🗣️' },
  { value: 'sounds-trainer', label: 'Тренажер звуков', emoji: '🔊' },
  { value: 'numbers-practice', label: 'Практика чисел', emoji: '🔢' },
  { value: 'video-song', label: 'Видео песня', emoji: '🎵' },
  { value: 'song', label: 'Песня', emoji: '🎤' },
  { value: 'games', label: 'Игры', emoji: '🎯' },
];

export default function ActivityEditor({ activity, onSave, onCancel }: ActivityEditorProps) {
  const [type, setType] = useState(activity?.type || '');
  const [title, setTitle] = useState(activity?.title || '');
  const [subtitle, setSubtitle] = useState(activity?.subtitle || '');
  const [contentUrl, setContentUrl] = useState(activity?.contentUrl || '');
  const [points, setPoints] = useState(activity?.points || 10);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLibrary, setShowLibrary] = useState(!activity);

  useEffect(() => {
    if (activity) {
      setType(activity.type);
      setTitle(activity.title);
      setSubtitle(activity.subtitle || '');
      setContentUrl(activity.contentUrl || '');
      setPoints(activity.points || 10);
      setShowLibrary(false);
    } else {
      setShowLibrary(true);
    }
  }, [activity]);

  const handleTypeSelect = (selectedType: string) => {
    setType(selectedType);
    setShowLibrary(false);
    // Set default title based on type
    const typeLabel = ACTIVITY_TYPES.find(t => t.value === selectedType)?.label || '';
    setTitle(typeLabel);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Размер файла не должен превышать 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const url = await lessonService.uploadImage(file);
      setContentUrl(url);
      console.log('Image uploaded successfully:', url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Введите название активности');
      return;
    }

    onSave({
      id: activity?.id || '',
      type,
      title,
      subtitle,
      contentUrl,
      points,
    });
  };

  const selectedType = ACTIVITY_TYPES.find(t => t.value === type);

  // Show activity library for type selection
  if (showLibrary) {
    return (
      <div className="h-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-600">Выберите тип активности</h2>
              <p className="text-gray-600 mt-1">Нажмите на карточку чтобы создать активность</p>
            </div>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
            >
              ✕ Закрыть
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <ActivityLibrary onSelectType={handleTypeSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl shadow-xl p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              {activity?.id ? 'Редактировать активность' : 'Создать активность'}
            </h2>
            <p className="text-gray-600">Заполните поля ниже</p>
          </div>
          {!activity && (
            <button
              onClick={() => setShowLibrary(true)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm font-medium"
            >
              ← Выбрать другой тип
            </button>
          )}
        </div>
      </div>

      {/* Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тип активности
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITY_TYPES.map((activityType) => (
            <button
              key={activityType.value}
              onClick={() => setType(activityType.value)}
              className={`p-3 rounded-lg border-2 transition text-left ${
                type === activityType.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activityType.emoji}</span>
                <span className="text-sm font-medium">{activityType.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Meet Star Family"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Subtitle */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Подзаголовок
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="(Знакомство с семьей Star)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Content URL */}
      {(type === 'image' || type === 'youtube' || type === 'wordwall') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {type === 'image' && 'URL картинки'}
            {type === 'youtube' && 'Ссылка на YouTube'}
            {type === 'wordwall' && 'Ссылка на Wordwall'}
          </label>

          {/* File upload for images */}
          {type === 'image' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                className="mb-2 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition font-semibold"
              >
                {uploading ? '⏳ Загрузка...' : '📤 Загрузить картинку'}
              </button>
              {uploadError && (
                <div className="mb-2 text-sm text-red-600">{uploadError}</div>
              )}
            </>
          )}

          <input
            type="url"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder={
              type === 'image' ? 'https://example.com/image.jpg' :
              type === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
              'https://wordwall.net/resource/...'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
          {type === 'image' && contentUrl && (
            <div className="mt-2">
              <img src={contentUrl} alt="Preview" className="max-w-full h-auto max-h-40 rounded-lg" />
            </div>
          )}
        </div>
      )}

      {/* Points */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Баллы за выполнение
        </label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          min="0"
          max="100"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</div>
        <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
          <div className="text-2xl">{selectedType?.emoji}</div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 text-sm">{title || 'Название активности'}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
            {contentUrl && (
              <div className="text-xs text-blue-500 mt-1 truncate">{contentUrl}</div>
            )}
          </div>
          <div className="text-sm font-semibold text-green-600">{points} баллов</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          ✓ Сохранить
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
        >
          ✕ Отменить
        </button>
      </div>
    </div>
  );
}
