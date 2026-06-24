'use client';
import { useState, useEffect } from 'react';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const CORRECT = [false, false, true, true];

interface StudentResult {
  id: string;
  student_name: string;
  results: { answers: boolean[] };
  score: number;
  total: number;
}

export default function SpotlightEx27({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    if (!isTeacher || !lessonId) return;
    const load = async () => {
      try {
        let url = `/kids-api/spotlight/results/${lessonId}?activityId=${activityId ?? ''}`;
        if (sessionId) url += `&sessionId=${sessionId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setResults(data.data);
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [isTeacher, lessonId, activityId, sessionId]);

  const submit = async () => {
    if (!studentName.trim() || answers.some(a => a === null) || !lessonId) return;
    const score = answers.filter((a, i) => a === CORRECT[i]).length;
    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, activityId, sessionId, studentName: studentName.trim(), results: { answers }, score, total: 4 }),
      });
      setSubmitted(true);
    } catch {}
  };

  const canSubmit = studentName.trim().length > 0 && answers.every(a => a !== null);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <iframe src="/spotlight/ex27.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} scrolling="no" allow="autoplay" />
      </div>

      {!isTeacher && sessionId && !submitted && (
        <div style={{ flexShrink: 0, background: '#f8f9fa', borderTop: '2px solid #e0e0e0', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Твоё имя"
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13, width: 120 }}
            />
            {[1, 2, 3, 4].map(n => {
              const i = n - 1;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{n}.</span>
                  {[true, false].map(val => {
                    const sel = answers[i] === val;
                    return (
                      <button
                        key={String(val)}
                        onClick={() => { const a = [...answers]; a[i] = val; setAnswers(a); }}
                        style={{
                          padding: '3px 9px', borderRadius: 5, fontSize: 13, cursor: 'pointer',
                          border: sel ? 'none' : '1px solid #bbb',
                          background: sel ? (val ? '#4caf50' : '#e53935') : '#fff',
                          color: sel ? '#fff' : '#333',
                          fontWeight: sel ? 700 : 400,
                        }}
                      >
                        {val ? 'T' : 'F'}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                padding: '4px 16px', background: '#4a90e2', color: '#fff', border: 'none',
                borderRadius: 6, fontSize: 13, cursor: canSubmit ? 'pointer' : 'default',
                opacity: canSubmit ? 1 : 0.4,
              }}
            >
              Отправить
            </button>
          </div>
        </div>
      )}

      {!isTeacher && sessionId && submitted && (
        <div style={{ flexShrink: 0, padding: '8px 16px', background: '#e8f5e9', borderTop: '2px solid #c8e6c9' }}>
          <span style={{ color: '#2e7d32', fontSize: 13, fontWeight: 600 }}>
            ✓ Отправлено! Правильных: {answers.filter((a, i) => a === CORRECT[i]).length} / 4
          </span>
        </div>
      )}

      {isTeacher && sessionId && (
        <div style={{ flexShrink: 0, maxHeight: 180, overflow: 'auto', borderTop: '2px solid #e0e0e0', background: '#fff' }}>
          {results.length === 0 ? (
            <div style={{ padding: '8px 16px', color: '#aaa', fontSize: 13 }}>Ожидание ответов учеников…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Ученик</th>
                  {[1,2,3,4].map(n => <th key={n} style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>{n}</th>)}
                  <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Счёт</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '5px 12px', fontWeight: 500 }}>{r.student_name}</td>
                    {(r.results?.answers ?? []).map((ans: boolean, i: number) => {
                      const ok = ans === CORRECT[i];
                      return <td key={i} style={{ padding: '5px 10px', textAlign: 'center', color: ok ? '#4caf50' : '#e53935', fontWeight: 700 }}>{ans ? 'T' : 'F'}</td>;
                    })}
                    <td style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 700 }}>{r.score}/{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
