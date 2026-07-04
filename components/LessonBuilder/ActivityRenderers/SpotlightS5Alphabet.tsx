'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const W = 1180;
const H = 820;

export default function SpotlightS5Alphabet({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [submitted, setSubmitted] = useState(false);

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

  const handleMessage = useCallback(async (e: MessageEvent) => {
    if (e.data?.type !== 'spotlight5-alphabet-done' || submitted || isTeacher || !lessonId) return;
    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId, activityId, sessionId: sessionId || null,
          studentId: user?.id,
          studentName: user?.displayName || 'Ученик',
          results: e.data.results || [],
          score: e.data.score,
          total: e.data.total,
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  }, [submitted, isTeacher, lessonId, activityId, sessionId, user]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f1f1', position: 'relative' }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
        <iframe
          src="/spotlight/spotlight5-alphabet-dragdrop.html"
          width={W}
          height={H}
          style={{ border: 'none', display: 'block' }}
          scrolling="no"
        />
      </div>
      {submitted && (
        <span style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 11, color: '#16a34a', fontFamily: 'Arial,sans-serif' }}>✔ результат сохранён</span>
      )}
    </div>
  );
}
