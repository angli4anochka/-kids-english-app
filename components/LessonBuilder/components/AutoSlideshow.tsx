import { useState, useEffect } from 'react';
import TVFrame from '../../Shared/TVFrame';

interface Slide {
  imageUrl: string;
  duration?: number;
}

interface AutoSlideshowProps {
  slides: Slide[];
  isViewMode: boolean;
}

export const AutoSlideshow = ({ slides, isViewMode }: AutoSlideshowProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlide = slides[currentSlideIndex];

  // Auto-advance slides
  useEffect(() => {
    if (!isViewMode) return;

    // Auto-advance if there's a duration and we're not on the last slide
    if (currentSlide.duration && currentSlideIndex < slides.length - 1) {
      const timer = setTimeout(() => {
        setCurrentSlideIndex(prev => prev + 1);
      }, currentSlide.duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, slides, isViewMode, currentSlide]);

  return (
    <TVFrame>
      <img
        src={currentSlide.imageUrl}
        alt={`Slide ${currentSlideIndex + 1}`}
        className="w-full h-full object-contain"
      />
    </TVFrame>
  );
};
