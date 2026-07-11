'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export interface SpotlightActivityProps {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

interface SpotlightIframeActivityProps extends SpotlightActivityProps {
  src: string;
  title: string;
  doneMessageTypes?: string[];
  width?: number;
  height?: number;
  sandbox?: string;
}

export default function SpotlightIframeActivity({
  src,
  title,
  doneMessageTypes = ['spotlight-result'],
  width,
  height,
  sandbox,
  isTeacher,
  lessonId,
  activityId,
  sessionId,
}: SpotlightIframeActivityProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const messageTypes = useMemo(() => new Set(doneMessageTypes), [doneMessageTypes]);

  useEffect(() => {
    if (!width || !height) return;
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width: currentWidth, height: currentHeight } = entry.contentRect;
      setScale(Math.min(currentWidth / width, currentHeight / height) * 0.98);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const handleMessage = useCallback(async (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (!messageTypes.has(data.type)) return;
    if (submitted || isTeacher || !lessonId) return;

    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          activityId,
          sessionId: sessionId || null,
          studentId: user?.id,
          studentName: user?.displayName || 'Ученик',
          results: data.results || data.result || [],
          score: Number(data.score ?? 0),
          total: Number(data.total ?? data.totalItems ?? 0),
        }),
      });
      setSubmitted(true);
    } catch {
      // Keep the activity playable if result submission fails.
    }
  }, [activityId, isTeacher, lessonId, messageTypes, sessionId, submitted, user]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const iframe = (
    <iframe
      src={src}
      title={title}
      width={width}
      height={height}
      className={!width || !height ? 'w-full h-full border-0' : undefined}
      style={width && height ? { border: 'none', display: 'block' } : undefined}
      scrolling="no"
      sandbox={sandbox}
    />
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f1f1',
        position: 'relative',
      }}
    >
      {width && height ? (
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
          {iframe}
        </div>
      ) : iframe}
      {submitted && (
        <span style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 11, color: '#16a34a', fontFamily: 'Arial,sans-serif' }}>
          ✔ результат сохранён
        </span>
      )}
    </div>
  );
}
