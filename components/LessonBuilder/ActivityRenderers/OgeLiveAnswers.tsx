'use client';
import { useEffect, useState } from 'react';

type Props = { source?: string; sessionId?: string; activityId?: string; socket?: any };
type StudentRow = { studentId: string; name: string; score: number; total: number; completed: boolean; answers: any[]; stamp: number };
function normalize(raw: any, source: string): StudentRow | null {
  let details = raw.details;
  try { if (typeof details === 'string') details = JSON.parse(details); } catch { return null; }
  if (details?.source !== source || !Array.isArray(details.results)) return null;
  const id = raw.student_id ?? raw.studentId;
  if (id == null) return null;
  return { studentId: String(id), name: raw.student_name || raw.studentName || 'Ученик', score: Number(raw.score || 0), total: Number(details.total || 0), completed: raw.status === 'completed', answers: details.results, stamp: Date.parse(raw.updated_at || raw.created_at || '') || Date.now() };
}
export default function OgeLiveAnswers({ source = 'oge-2027', sessionId, activityId, socket }: Props) {
  const [students, setStudents] = useState<Record<string, StudentRow>>({});
  const [error, setError] = useState(false);
  useEffect(() => {
    setStudents({}); setError(false);
    if (!sessionId || !activityId) return;
    let stopped = false, busy = false, version = 0;
    const controller = new AbortController();
    const merge = (raw: any, live = false) => {
      if ((raw.activity_id ?? raw.activityId) !== activityId) return;
      const row = normalize(raw, source); if (!row) return;
      setStudents(prev => {
        const old = prev[row.studentId];
        if (!live && old && old.stamp > row.stamp) return prev;
        return { ...prev, [row.studentId]: row };
      });
    };
    const poll = async () => {
      if (busy) return; busy = true; const startVersion = version;
      try {
        const response = await fetch(`/kids-api/live-sessions/${encodeURIComponent(sessionId)}/results`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.data)) throw new Error('Cannot load answers');
        if (stopped) return;
        // A response begun before a socket update must not overwrite that update.
        if (startVersion === version) data.data.forEach((raw: any) => merge(raw));
        setError(false);
      } catch { if (!stopped) setError(true); }
      finally { busy = false; }
    };
    const receive = (data: any) => {
      if ((data.sessionId ?? data.session_id) !== sessionId || (data.activityId ?? data.activity_id) !== activityId) return;
      version++; merge(data, true);
    };
    socket?.on('activity-result', receive);
    void poll(); const timer = setInterval(() => void poll(), 2000);
    return () => { stopped = true; controller.abort(); clearInterval(timer); socket?.off('activity-result', receive); };
  }, [source, sessionId, activityId, socket]);
  return <aside aria-label="Ответы учеников" className="h-full min-h-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-3 text-slate-900">
    <h3 className="font-bold">Ответы учеников</h3>
    <p className="mb-3 text-xs text-slate-500">Выбор и ввод обновляются во время работы</p>
    {error && <p role="status" className="mb-2 text-xs text-amber-700">Обновление задерживается. Повторяем подключение…</p>}
    {!sessionId ? <p className="text-sm">Ответы появятся после запуска урока с учениками.</p> : Object.keys(students).length === 0 && <p className="text-sm text-slate-500">Ждём первые ответы учеников…</p>}
    {Object.values(students).sort((a,b) => a.name.localeCompare(b.name)).map(student => <section key={student.studentId} className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2"><strong className="break-words text-sm">{student.name}</strong>{student.total > 0 && <span className="whitespace-nowrap text-sm font-bold">{student.score}/{student.total}</span>}</div>
      <p className="mb-2 text-xs text-slate-500">{student.completed ? 'Завершено' : 'Работает'} · {student.answers.filter(a=>a.answered || String(a.studentAnswer || '').trim()).length}/{student.answers.length} ответов</p>
      <div className="space-y-1">{student.answers.map((answer, i) => {
        const filled = !!String(answer.studentAnswer ?? '').trim();
        const color = !filled || answer.pendingReview ? 'bg-slate-50 text-slate-700' : answer.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
        const label = answer.questionLabel || String(i+1);
        const value = /^(13|14|15|16|17|18|19)$/.test(label) ? ({'1':'True','2':'False','3':'Not stated'} as Record<string,string>)[answer.studentAnswer] || answer.studentAnswer : answer.studentAnswer;
        return <div key={label} className={`rounded px-2 py-1 text-xs ${color}`}><b>{label}:</b> <span className="whitespace-pre-wrap break-words">{filled ? value : '—'}</span>{filled && !answer.pendingReview && <span className="ml-1">{answer.isCorrect ? '✓' : '✗'}</span>}</div>;
      })}</div>
    </section>)}
  </aside>;
}
