'use client';

import { useEffect, useRef } from 'react';
import OgeLiveAnswers from './OgeLiveAnswers';
import { useAuth } from '../../../contexts/AuthContext';
import type { SpotlightActivityProps } from './SpotlightIframeActivity';

// OGE keeps one updatable result per student/session, including unfinished work.
export default function Oge2027Activity({ part, isTeacher, lessonId, activityId, sessionId, groupId, socket, isConnected }: SpotlightActivityProps & { part: 'listening' | 'reading' | 'grammar' | 'writing' }) {
  const titles = { listening: 'Аудирование', reading: 'Чтение', grammar: 'Грамматика и лексика', writing: 'Письмо' };
  const total = { listening: 15, reading: 13, grammar: 15, writing: 0 }[part];
  const count = part === 'writing' ? 1 : total;
  const { user } = useAuth();
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let pending: any = null;
    let saving = false;
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const storageKey = `${user?.id || 'preview'}:${sessionId || 'self-study'}:${lessonId}:${activityId}`;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    let restoring: Promise<any> | undefined;
    const restoreController = new AbortController();
    const loadSaved = async () => {
      if (isTeacher || !user?.id || !lessonId || !activityId) return null;
      const url = sessionId ? `/kids-api/live-sessions/${encodeURIComponent(sessionId)}/results` : `/kids-api/lessons/${encodeURIComponent(lessonId)}/results`;
      const response = await fetch(url, { signal: restoreController.signal, cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Cannot restore saved answers');
      const row = result.data.filter((r: any) => String(r.student_id) === String(user.id) && r.activity_id === activityId && (sessionId ? r.session_id === sessionId : !r.session_id))
        .sort((a: any,b: any) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at))[0];
      if (!row) return null;
      const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      if (details?.source !== 'oge-2027' || !Array.isArray(details.results)) return null;
      return { results: details.results, answers: details.answers, completed: row.status === 'completed', timeSeconds: row.time_seconds || 0 };
    };
    const sendContext = () => {
      if (!isTeacher && !user?.id) return;
      if (!restoring) restoring = loadSaved();
      void restoring.then(saved => {
        if (!disposed) frame.current?.contentWindow?.postMessage({ type: 'oge-reading-context', storageKey, isTeacher: !!isTeacher, saved }, window.location.origin);
      }).catch(() => {
        restoring = undefined;
        if (!disposed && !restoreTimer) restoreTimer = setTimeout(() => { restoreTimer = undefined; sendContext(); }, 2000);
      });
    };
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
        details: { source: 'oge-2027', activityTitle: titles[part], pendingReview: part === 'writing', results: data.results, answers: data.answers, total, completed: data.completed },
      };
      try {
        const response = await fetch(`/kids-api/live-sessions/${sessionId || 'none'}/results`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true,
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Result was not saved');
        succeeded = true;
        frame.current?.contentWindow?.postMessage({ type: 'oge-reading-save-status', revision: data.revision, ok: true }, window.location.origin);
        if (socket && isConnected && groupId != null) socket.emit('activity-result', { ...payload, sessionId, total, results: data.results });
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
      if (data?.type !== 'oge-reading-progress' || isTeacher || !Array.isArray(data.results) || data.results.length !== count) return;
      const score = data.results.filter((r: any) => r.isCorrect === true).length;
      pending = { ...data, score: part === 'writing' ? 0 : score };
      if (retry) { clearTimeout(retry); retry = undefined; }
      void flush();
    };
    window.addEventListener('message', receive);
    const iframe = frame.current;
    iframe?.addEventListener('load', sendContext);
    sendContext();
    return () => {
      disposed = true;
      restoreController.abort();
      if (restoreTimer) clearTimeout(restoreTimer);
      window.removeEventListener('message', receive);
      iframe?.removeEventListener('load', sendContext);
      if (retry) clearTimeout(retry);
      // A change queued during the preceding request must survive a stage switch.
      retry = undefined;
      if (pending && !saving) void flush();
    };
  }, [part, total, count, activityId, groupId, isConnected, isTeacher, lessonId, sessionId, socket, user?.id, user?.displayName, user?.username]);

  return <div className="flex h-full min-h-0 w-full flex-col lg:flex-row">
    <div className="min-h-0 min-w-0 flex-1"><iframe ref={frame} src={`/oge/2027-${part}.html?v=20260915-restore`} title={`ОГЭ 2027 · ${titles[part]}`} className="h-full w-full border-0" /></div>
    {isTeacher && <div className="h-56 shrink-0 lg:h-full lg:w-72"><OgeLiveAnswers sessionId={sessionId} activityId={activityId} socket={socket} /></div>}
  </div>;
}
