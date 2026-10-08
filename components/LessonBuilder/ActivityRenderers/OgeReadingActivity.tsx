'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import type { SpotlightActivityProps } from './SpotlightIframeActivity';

// OGE keeps one updatable result per student/session, including unfinished work.
export default function OgeReadingActivity({ isTeacher, lessonId, activityId, sessionId, groupId, socket, isConnected }: SpotlightActivityProps) {
  const { user } = useAuth();
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let pending: any = null;
    let saving = false;
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const storageKey = `${user?.id || 'preview'}:${sessionId || 'self-study'}:${lessonId}:${activityId}`;
    const sendContext = () => frame.current?.contentWindow?.postMessage({ type: 'oge-reading-context', storageKey, isTeacher: !!isTeacher }, window.location.origin);
    const flush = async () => {
      if (saving || !pending || !user?.id || !lessonId || !activityId || isTeacher) return;
      saving = true;
      const data = pending;
      pending = null;
      let succeeded = false;
      const payload = {
        lessonId, activityId, studentId: user.id,
        studentName: user.displayName || user.username || 'Ученик',
        groupId, score: data.score, status: data.status, timeSeconds: data.timeSeconds,
        details: { source: 'oge-reading', activityTitle: 'Reading', results: data.results, total: 13, completed: data.completed },
      };
      try {
        const response = await fetch(`/kids-api/live-sessions/${sessionId || 'none'}/results`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true,
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Result was not saved');
        succeeded = true;
        frame.current?.contentWindow?.postMessage({ type: 'oge-reading-save-status', revision: data.revision, ok: true }, window.location.origin);
        if (socket && isConnected && groupId != null) socket.emit('activity-result', { ...payload, sessionId, total: 13, results: data.results });
      } catch {
        if (!pending) pending = data;
        frame.current?.contentWindow?.postMessage({ type: 'oge-reading-save-status', revision: data.revision, ok: false }, window.location.origin);
        if (!disposed) retry = setTimeout(() => { retry = undefined; void flush(); }, 2000);
      } finally {
        saving = false;
        if (pending && !retry && (!disposed || succeeded)) void flush();
      }
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === 'oge-reading-ready') { sendContext(); return; }
      if (data?.type !== 'oge-reading-progress' || isTeacher || !Array.isArray(data.results) || data.results.length !== 13) return;
      pending = data;
      if (retry) { clearTimeout(retry); retry = undefined; }
      void flush();
    };
    window.addEventListener('message', receive);
    const iframe = frame.current;
    iframe?.addEventListener('load', sendContext);
    sendContext();
    return () => {
      disposed = true;
      window.removeEventListener('message', receive);
      iframe?.removeEventListener('load', sendContext);
      if (retry) clearTimeout(retry);
      // A change queued during the preceding request must survive a stage switch.
      retry = undefined;
      if (pending && !saving) void flush();
    };
  }, [activityId, groupId, isConnected, isTeacher, lessonId, sessionId, socket, user?.id, user?.displayName, user?.username]);

  return <iframe ref={frame} src="/oge/test-1-reading.html" title="ОГЭ · test 1 · Reading" className="h-full w-full border-0" />;
}
