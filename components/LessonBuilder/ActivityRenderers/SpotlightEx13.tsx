'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const W = 1600;
const H = 1000;

export default function SpotlightEx13({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / W, height / H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
        <iframe src="/spotlight/ex13.html" width={W} height={H} style={{ border: 'none', display: 'block' }} scrolling="no" />
      </div>
    </div>
  );
}
