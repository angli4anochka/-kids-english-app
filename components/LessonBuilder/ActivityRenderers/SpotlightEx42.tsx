'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

interface AnswerInfo {
  value: string;
  correct: boolean;
}

interface StudentResult {
  id: string;
  student_name: string;
  results: { answers: Record<string, AnswerInfo> };
  score: number;
  total: number;
}

const TOTAL = 8;

export default function SpotlightEx42({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [results, setResults] = useState<StudentResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const params = new URLSearchParams();
  if (lessonId) params.set('lessonId', lessonId);
  if (activityId) params.set('activityId', activityId);
  if (sessionId) params.set('sessionId', sessionId);
  params.set('role', isTeacher ? 'teacher' : 'student');
  if (!isTeacher && user?.id) params.set('userId', user.id);
  if (!isTeacher && user?.displayName) params.set('studentName', user.displayName);
  const src = `/spotlight/ex42.html${params.toString() ? '?' + params.toString() : ''}`;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <iframe src={src} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} scrolling="no" />
      </div>

      {isTeacher && sessionId && (
        <div style={{ flexShrink: 0, maxHeight: 240, overflow: 'auto', borderTop: '2px solid #e0e0e0', background: '#fff' }}>
          {results.length === 0 ? (
            <div style={{ padding: '8px 16px', color: '#aaa', fontSize: 13 }}>Ожидание ответов учеников…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Ученик</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Счёт</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Ответы (1–{TOTAL})</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const answers = r.results?.answers || {};
                  const isExp = expanded === r.id;
                  return (
                    <>
                      <tr
                        key={r.id}
                        style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                        onClick={() => setExpanded(isExp ? null : r.id)}
                      >
                        <td style={{ padding: '5px 12px', fontWeight: 500 }}>{r.student_name}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 700 }}>
                          {r.score}/{r.total}
                        </td>
                        <td style={{ padding: '5px 10px' }}>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {Array.from({ length: TOTAL }, (_, i) => {
                              const key = 'q' + (i + 1);
                              const a = answers[key];
                              const color = !a || !a.value ? '#ddd' : a.correct ? '#4caf50' : '#e53935';
                              return (
                                <div key={key} title={`${i + 1}: ${a?.value || '—'}`}
                                  style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0 }} />
                              );
                            })}
                            <span style={{ fontSize: 11, color: '#888', alignSelf: 'center', marginLeft: 4 }}>
                              {isExp ? '▲' : '▼'}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {isExp && (
                        <tr key={r.id + '-exp'} style={{ borderBottom: '2px solid #e0e0e0', background: '#fafafa' }}>
                          <td colSpan={3} style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12 }}>
                              {Array.from({ length: TOTAL }, (_, i) => {
                                const key = 'q' + (i + 1);
                                const a = answers[key];
                                const ok = a?.correct;
                                return (
                                  <span key={key} style={{ color: !a?.value ? '#bbb' : ok ? '#2e7d32' : '#c62828', fontWeight: 600 }}>
                                    {i + 1}. {a?.value || '—'}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
