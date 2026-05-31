import React, { useState, useEffect } from 'react';
import type { PresentationActivity as PresentationActivityType } from '../../../types/activity.types';
import TVFrame from '../../Shared/TVFrame';

interface PresentationActivityProps {
  activity: PresentationActivityType;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  onEdit?: (activity: PresentationActivityType) => void;
}

const PresentationActivity: React.FC<PresentationActivityProps> = ({
  activity,
  isViewMode,
  isTeacher,
  onEdit,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const slides = activity.slides || [];
  const isAutoSlideshow = activity.presentationType === 'auto-slideshow';

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying || !isAutoSlideshow || slides.length === 0) return;

    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        const next = (prev + 1) % slides.length;
        if (next === 0) {
          setIsAutoPlaying(false); // Stop at the end
        }
        return next;
      });
    }, 5000); // 5 seconds per slide

    return () => clearInterval(slideTimer);
  }, [isAutoPlaying, isAutoSlideshow, slides.length]);

  // Audio auto-play for current slide
  useEffect(() => {
    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide?.audioUrl || !isViewMode) return;

    const audio = new Audio(currentSlide.audioUrl);
    audio.play().catch(console.error);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [currentSlideIndex, slides, isViewMode]);

  // View mode - show presentation
  if (isViewMode && slides.length > 0) {
    const currentSlide = slides[currentSlideIndex];

    return (
      <TVFrame>
        <div className="w-full h-full flex flex-col">
          {/* Slide image */}
          <div className="flex-1 flex items-center justify-center bg-black">
            {currentSlide.imageUrl && (
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title || `Slide ${currentSlideIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-900 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  ← Назад
                </button>

                <span className="text-sm">
                  Слайд {currentSlideIndex + 1} из {slides.length}
                </span>

                <button
                  onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Вперед →
                </button>
              </div>

              {isAutoSlideshow && (
                <button
                  onClick={() => {
                    setCurrentSlideIndex(0);
                    setIsAutoPlaying(!isAutoPlaying);
                  }}
                  className={`px-4 py-1 rounded ${
                    isAutoPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isAutoPlaying ? '⏸ Пауза' : '▶ Авто-показ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </TVFrame>
    );
  }

  // Edit mode
  if (!isViewMode) {
    return (
      <div className="w-full h-full p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Презентация</h3>

          {/* Presentation type selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип презентации
            </label>
            <select
              value={activity.presentationType || 'manual'}
              onChange={(e) => {
                onEdit?.({
                  ...activity,
                  presentationType: e.target.value as any,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="manual">Ручное переключение</option>
              <option value="auto-slideshow">Автоматический показ</option>
            </select>
          </div>

          {/* Slides editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Слайды ({slides.length})</h4>
              <button
                onClick={() => {
                  onEdit?.({
                    ...activity,
                    slides: [...slides, { imageUrl: '', audioUrl: '', title: '' }],
                  });
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                + Добавить слайд
              </button>
            </div>

            {slides.map((slide, index) => (
              <div key={index} className="p-4 border border-gray-300 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">Слайд {index + 1}</h5>
                  <button
                    onClick={() => {
                      onEdit?.({
                        ...activity,
                        slides: slides.filter((_, i) => i !== index),
                      });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Заголовок слайда"
                    value={slide.title || ''}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index] = { ...slide, title: e.target.value };
                      onEdit?.({ ...activity, slides: newSlides });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />

                  <input
                    type="text"
                    placeholder="URL изображения"
                    value={slide.imageUrl}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index] = { ...slide, imageUrl: e.target.value };
                      onEdit?.({ ...activity, slides: newSlides });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />

                  <input
                    type="text"
                    placeholder="URL аудио (необязательно)"
                    value={slide.audioUrl || ''}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index] = { ...slide, audioUrl: e.target.value };
                      onEdit?.({ ...activity, slides: newSlides });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}

            {slides.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-gray-500">Нажмите "Добавить слайд" чтобы начать</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">🎞️</div>
        <p className="text-xl text-gray-600">Презентация пуста</p>
      </div>
    </div>
  );
};

export default PresentationActivity;