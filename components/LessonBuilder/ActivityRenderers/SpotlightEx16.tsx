'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx16({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const handleMessage = useCallback(async (e: MessageEvent) => {
    if (e.data?.type !== 'ex16-done' || submitted || isTeacher || !lessonId) return;
    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId, activityId, sessionId: sessionId || null,
          studentId: user?.id,
          studentName: user?.displayName || 'Ученик',
          results: [],
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
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <iframe src="/spotlight/ex16.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} scrolling="no" />
      {submitted && (
        <span style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 11, color: '#16a34a', fontFamily: 'Arial,sans-serif' }}>✔ результат сохранён</span>
      )}
    </div>
  );
}
