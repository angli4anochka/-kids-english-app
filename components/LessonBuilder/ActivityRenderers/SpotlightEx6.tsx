'use client';
import { useState, useRef, useEffect } from 'react';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
}

const STAGE_W = 1717;
const STAGE_H = 1064;

// Layer positions from original HTML
const LAYERS = [
  { src: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex6-base.png',     left: 0,   top: 0,   w: 1678, h: 1064, step: 1 },
  { src: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex6-step2.png',    left: 0,   top: 0,   w: 1717, h: 1063, step: 2 },
  { src: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex6-age-box.png',  left: 672, top: 357, w: 992,  h: 134,  step: 3 },
  { src: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex6-examples.png', left: 0,   top: 500, w: 1675, h: 564,  step: 4 },
];

export default function SpotlightEx6({ isTeacher, lessonId, activityId }: Props) {
  const [step, setStep] = useState(1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setScale(Math.min(clientWidth / STAGE_W, clientHeight / STAGE_H));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const advance = () => { if (step < 4) setStep(s => s + 1); };

  return (
    <div
      ref={containerRef}
      onClick={advance}
      className="w-full h-full flex items-center justify-center bg-white overflow-hidden"
      style={{ cursor: step < 4 ? 'pointer' : 'default', userSelect: 'none' }}
    >
      <div style={{ position: 'relative', width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
        {LAYERS.map(({ src, left, top, w, h, step: showAt }) => (
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left,
              top,
              width: w,
              height: h,
              opacity: step >= showAt ? 1 : 0,
              transition: 'opacity 0.35s ease-in-out',
              pointerEvents: 'none',
            }}
          />
        ))}

        {step < 4 && (
          <div style={{
            position: 'absolute',
            bottom: 18,
            right: 24,
            background: 'rgba(36,90,168,0.75)',
            color: '#fff',
            borderRadius: 999,
            padding: '6px 20px',
            fontSize: 22,
            fontWeight: 900,
            fontFamily: 'Arial,sans-serif',
            letterSpacing: 0.5,
            pointerEvents: 'none',
          }}>
            tap to continue →
          </div>
        )}
      </div>
    </div>
  );
}
