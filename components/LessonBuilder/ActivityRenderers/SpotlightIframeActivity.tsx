'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export interface SpotlightActivityProps {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
  groupId?: number;
  socket?: any;
  isConnected?: boolean;
}

interface SpotlightIframeActivityProps extends SpotlightActivityProps {
  src: string;
  title: string;
  doneMessageTypes?: string[];
  width?: number;
  height?: number;
  sandbox?: string;
  realtime?: {
    outgoingType: string;
    socketEvent: string;
    incomingEvent: string;
    incomingType: string;
  };
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
  groupId,
  socket,
  isConnected,
  realtime,
}: SpotlightIframeActivityProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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

    const payload = {
      lessonId,
      activityId,
      sessionId: sessionId || null,
      studentId: user?.id ?? null,
      studentName: user?.displayName || user?.username || '??????',
      results: data.results || data.result || data.allResults || [],
      score: Number(data.score ?? 0),
      total: Number(data.total ?? data.totalItems ?? 0),
      status: 'completed',
      timeSeconds: data.timeSeconds == null ? null : Number(data.timeSeconds),
      details: data.details || { completed: true },
      groupId,
    };

    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Keep the activity playable if result submission fails.
    }

    if (socket && isConnected && groupId != null) {
      socket.emit('activity-result', payload);
    }
    setSubmitted(true);
  }, [activityId, groupId, isConnected, isTeacher, lessonId, messageTypes, sessionId, socket, submitted, user]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (!realtime || !socket || !isConnected || groupId == null || !sessionId || !activityId) return;

    const forwardOutgoing = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.type !== realtime.outgoingType) return;
      socket.emit(realtime.socketEvent, { ...data, sessionId, groupId, activityId });
    };
    const applyIncoming = (data: any) => {
      if (data?.sessionId !== sessionId || data?.activityId !== activityId) return;
      iframeRef.current?.contentWindow?.postMessage({ ...data, type: realtime.incomingType }, '*');
    };
    const requestState = () => socket.emit(`${realtime.socketEvent}:request`, { sessionId, groupId, activityId });

    window.addEventListener('message', forwardOutgoing);
    socket.on(realtime.incomingEvent, applyIncoming);
    requestState();
    const iframe = iframeRef.current;
    iframe?.addEventListener('load', requestState);
    return () => {
      window.removeEventListener('message', forwardOutgoing);
      socket.off(realtime.incomingEvent, applyIncoming);
      iframe?.removeEventListener('load', requestState);
    };
  }, [activityId, groupId, isConnected, realtime, sessionId, socket]);

  const iframe = (
    <iframe
      ref={iframeRef}
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
