'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const TASKS = [
  { n: 1, subject: 'He',  answer: 'is thirsty', accept: ['is thirsty', "'s thirsty", 'thirsty'],   img: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex7-task1-thirsty.png' },
  { n: 2, subject: 'She', answer: 'is cold',    accept: ['is cold',    "'s cold",    'cold'],        img: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex7-task2-cold-woman.png' },
  { n: 3, subject: 'He',  answer: 'is hot',     accept: ['is hot',     "'s hot"],                   img: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex7-task3-hot.png' },
  { n: 4, subject: 'It',  answer: 'is cold',    accept: ['is cold',    "'s cold",    'cold'],        img: 'https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex7-task4-cold-thermo.png' },
];

const normalize = (s: string) =>
  s.toLowerCase().replace(/[''`‛]/g, "'").replace(/\./g, '').replace(/\s+/g, ' ').trim();

const FONT_SENTENCE = 'Georgia,"Times New Roman",serif';
const FONT_INPUT    = '"Trebuchet MS","Arial Rounded MT Bold",Arial,sans-serif';

// ── module-level Card to avoid React unmount/remount on keystroke ────────────
interface CardProps {
  idx: number;
  value: string;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onChange: (val: string) => void;
}

function TaskCard({ idx, value, correct, wrong, disabled, onChange }: CardProps) {
  const t = TASKS[idx];
  const borderColor = correct ? '#16a34a' : wrong ? '#dc2626' : '#9a9a9a';
  const inputColor  = correct ? '#16a34a' : wrong ? '#dc2626' : '#ef1018';
  const inputBg     = correct ? '#f0fdf4'  : wrong ? '#fff1f2'  : '#fff7f7';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
      <div style={{ width: '100%', height: 'clamp(110px,18vh,220px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <img src={t.img} alt="" draggable={false}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'clamp(4px,1vh,10px)', fontFamily: FONT_SENTENCE, fontSize: 'clamp(16px,1.8vw,26px)', color: '#1f1f1f', whiteSpace: 'nowrap' }}>
        <span style={{ marginRight: 4, fontFamily: FONT_SENTENCE }}>{t.n}</span>
        <span>{t.subject}</span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="type here"
          style={{
            height: 38,
            border: 'none',
            borderBottom: `3px dotted ${borderColor}`,
            borderRadius: '6px 6px 0 0',
            background: inputBg,
            color: inputColor,
            fontFamily: FONT_INPUT,
            fontSize: 'clamp(15px,1.6vw,22px)',
            fontWeight: 800,
            textAlign: 'center',
            outline: 'none',
            padding: '0 8px 2px',
            width: 'clamp(110px,13vw,190px)',
            transition: 'background .15s, border-color .15s',
          }}
        />
      </label>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function SpotlightEx7({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [answers, setAnswers]   = useState(['', '', '', '']);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = (i: number) => TASKS[i].accept.some(a => normalize(answers[i]) === normalize(a));
  const isFilled  = (i: number) => answers[i].trim() !== '';
  const score = TASKS.filter((_, i) => isFilled(i) && isCorrect(i)).length;

  // auto-submit when all 4 correct
  useEffect(() => {
    if (submitted || isTeacher || !lessonId) return;
    if (!TASKS.every((_, i) => isCorrect(i))) return;
    fetch('/kids-api/spotlight/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId, activityId,
        sessionId: sessionId || null,
        studentId: user?.id,
        studentName: user?.displayName || 'Ученик',
        results: TASKS.map((t, i) => ({
          questionIndex: i,
          studentAnswer: answers[i],
          correctAnswer: t.answer,
          isCorrect: true,
          sentence: `${t.subject} ${t.answer}`,
        })),
        score: 4,
        total: 4,
      }),
    }).then(() => setSubmitted(true)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const set = (i: number, val: string) => {
    const next = [...answers];
    next[i] = val;
    setAnswers(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fff', userSelect: 'none' }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 18px 8px', background: '#ef1018', color: '#fff', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <span style={{ color: '#000', fontFamily: 'Arial,sans-serif', fontSize: 'clamp(16px,2vw,28px)', fontWeight: 500, letterSpacing: -0.5 }}>(Ex.6)</span>
        <span style={{ fontFamily: FONT_INPUT, fontSize: 'clamp(14px,1.8vw,26px)', fontWeight: 800 }}>
          Complete the sentences under the pictures.
        </span>
      </div>

      {/* work area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'clamp(8px,1.5vh,18px) clamp(10px,2vw,40px) 0', overflow: 'hidden' }}>
        <div style={{ width: 'min(960px,94vw)', display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2.5vh,32px)' }}>

          {/* row top: example + task 1 + task 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 'clamp(12px,2.5vw,36px)', justifyItems: 'center' }}>

            {/* example card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{ width: '100%', height: 'clamp(110px,18vh,220px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <img src="https://storage.yandexcloud.net/kids-app/public-assets/spotlight/ex7-example-hungry.png" alt="" draggable={false}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'clamp(4px,1vh,10px)', fontFamily: FONT_SENTENCE, fontSize: 'clamp(16px,1.8vw,26px)', color: '#1f1f1f', paddingLeft: 4 }}>
                <span style={{ width: 0, height: 0, borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: '18px solid #2aa7df', marginRight: 10, transform: 'translateY(3px)', flexShrink: 0 }} />
                <span>She is</span>
                <span style={{ color: '#2aa7df', fontFamily: '"Trebuchet MS",Arial,sans-serif', fontWeight: 700, borderBottom: '2px dotted #a9a9a9', padding: '0 4px 1px', minWidth: 80, textAlign: 'center' }}>hungry.</span>
              </div>
            </div>

            <TaskCard idx={0} value={answers[0]} correct={isFilled(0) && isCorrect(0)} wrong={isFilled(0) && !isCorrect(0)} disabled={submitted} onChange={v => set(0, v)} />
            <TaskCard idx={1} value={answers[1]} correct={isFilled(1) && isCorrect(1)} wrong={isFilled(1) && !isCorrect(1)} disabled={submitted} onChange={v => set(1, v)} />
          </div>

          {/* row bottom: task 3 + task 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 'clamp(40px,7vw,90px)', justifyItems: 'center', paddingInline: 'clamp(20px,8vw,120px)' }}>
            <TaskCard idx={2} value={answers[2]} correct={isFilled(2) && isCorrect(2)} wrong={isFilled(2) && !isCorrect(2)} disabled={submitted} onChange={v => set(2, v)} />
            <TaskCard idx={3} value={answers[3]} correct={isFilled(3) && isCorrect(3)} wrong={isFilled(3) && !isCorrect(3)} disabled={submitted} onChange={v => set(3, v)} />
          </div>

        </div>
      </div>

      {/* bottom bar */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '6px 18px 8px', fontFamily: 'Arial,sans-serif' }}>
        {submitted && <span style={{ fontSize: 12, color: '#16a34a' }}>✔ сохранено</span>}
        <div style={{ padding: '5px 12px', border: '1px solid #ddd', borderRadius: 999, background: '#fff', textAlign: 'center', fontWeight: 700, minWidth: 48, fontSize: 14,
          color: score === 4 ? '#16a34a' : score > 0 ? '#ef1018' : '#555' }}>
          {score}/4
        </div>
        <button onClick={() => setAnswers(['', '', '', ''])}
          style={{ border: '1px solid #ddd', borderRadius: 999, background: '#fff', padding: '5px 14px', cursor: 'pointer', color: '#333', fontWeight: 700, fontSize: 14 }}>
          Reset
        </button>
      </div>
    </div>
  );
}
