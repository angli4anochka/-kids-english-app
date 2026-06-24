'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

type Slide = 'rule' | 'trainer1' | 'trainer2' | 'trainer3' | 'trainer4';
const SLIDES: Slide[] = ['rule', 'trainer1', 'trainer2', 'trainer3', 'trainer4'];
const SLIDE_LABELS = ['Rule', 'Part 1', 'Part 2', 'Part 3', 'Part 4'];

function StepNav({ current, onGo }: { current: Slide; onGo: (s: Slide) => void }) {
  return (
    <div className="flex items-center gap-1">
      {SLIDES.map((s, i) => (
        <button key={s} onClick={() => onGo(s)} title={SLIDE_LABELS[i]}
          className="rounded-full font-extrabold transition-all"
          style={{ width: 22, height: 22, fontSize: 10, border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif',
            background: current === s ? '#245aa8' : '#dde5f0',
            color: current === s ? '#fff' : '#555',
            boxShadow: current === s ? '0 2px 0 rgba(0,0,0,.2)' : 'none',
          }}>
          {i + 1}
        </button>
      ))}
    </div>
  );
}

const TASKS1 = [
  { before: "It's winter, but it",     after: "cold.",        answer: "isn't",  accept: ["isn't","is not"] },
  { before: "I'm Greek, but I",        after: "from Athens.", answer: "'m not", accept: ["'m not","am not"] },
];

const TASKS2 = [
  { before: "She's tired, but she",    after: "ill.",       answer: "isn't",  accept: ["isn't","'s not","is not"] },
  { before: "They are in England, but they", after: "in London.", answer: "aren't", accept: ["aren't","'re not","are not"] },
];

const TASKS3 = [
  { before: "You're tall, but you",  after: "too tall.",  answer: "aren't", accept: ["aren't","'re not","are not"] },
  { before: "We are late, but we",   after: "very late.", answer: "aren't", accept: ["aren't","'re not","are not"] },
];

const TASKS4 = [
  { before: "It's summer, but it",   after: "hot.",          answer: "isn't",  accept: ["isn't","'s not","is not"] },
  { before: "I'm a student, but I",  after: "at university.", answer: "'m not", accept: ["'m not","am not"] },
];

const EXAMPLES = [
  "I am not Scottish.",
  "We are not ready.",
  "I'm not tired.",
  "She's not here.",
  "They're not my friends.",
];

const FONT = '"Comic Sans MS","Trebuchet MS",Arial,sans-serif';

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[''`‛]/g, "'");

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx5({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [slide, setSlide] = useState<Slide>('rule');

  const [answers1, setAnswers1] = useState<string[]>(['', '']);
  const [checked1, setChecked1] = useState(false);

  const [answers2, setAnswers2] = useState<string[]>(['', '']);
  const [checked2, setChecked2] = useState(false);

  const [answers3, setAnswers3] = useState<string[]>(['', '']);
  const [checked3, setChecked3] = useState(false);

  const [answers4, setAnswers4] = useState<string[]>(['', '']);
  const [checked4, setChecked4] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect1 = (i: number) => TASKS1[i].accept.some(a => normalize(answers1[i]) === normalize(a));
  const isCorrect2 = (i: number) => TASKS2[i].accept.some(a => normalize(answers2[i]) === normalize(a));
  const isCorrect3 = (i: number) => TASKS3[i].accept.some(a => normalize(answers3[i]) === normalize(a));
  const isCorrect4 = (i: number) => TASKS4[i].accept.some(a => normalize(answers4[i]) === normalize(a));

  const correct1 = checked1 ? TASKS1.filter((_, i) => isCorrect1(i)).length : 0;
  const correct2 = checked2 ? TASKS2.filter((_, i) => isCorrect2(i)).length : 0;
  const correct3 = checked3 ? TASKS3.filter((_, i) => isCorrect3(i)).length : 0;
  const correct4 = checked4 ? TASKS4.filter((_, i) => isCorrect4(i)).length : 0;

  const handleCheck1 = useCallback(() => {
    if (checked1 || answers1.some(a => !a.trim())) return;
    setChecked1(true);
  }, [checked1, answers1]);

  const handleCheck2 = useCallback(() => {
    if (checked2 || answers2.some(a => !a.trim())) return;
    setChecked2(true);
  }, [checked2, answers2]);

  const handleCheck3 = useCallback(() => {
    if (checked3 || answers3.some(a => !a.trim())) return;
    setChecked3(true);
  }, [checked3, answers3]);

  const handleCheck4 = useCallback(async () => {
    if (checked4 || answers4.some(a => !a.trim())) return;
    setChecked4(true);
    if (!isTeacher && lessonId) {
      try {
        await fetch('/kids-api/spotlight/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId, activityId,
            sessionId: sessionId || null,
            studentId: user?.id,
            studentName: user?.displayName || 'Ученик',
            results: [
              ...TASKS1.map((t, i) => ({ questionIndex: i,                                          studentAnswer: answers1[i], correctAnswer: t.answer, isCorrect: isCorrect1(i) })),
              ...TASKS2.map((t, i) => ({ questionIndex: TASKS1.length + i,                         studentAnswer: answers2[i], correctAnswer: t.answer, isCorrect: isCorrect2(i) })),
              ...TASKS3.map((t, i) => ({ questionIndex: TASKS1.length + TASKS2.length + i,         studentAnswer: answers3[i], correctAnswer: t.answer, isCorrect: isCorrect3(i) })),
              ...TASKS4.map((t, i) => ({ questionIndex: TASKS1.length + TASKS2.length + TASKS3.length + i, studentAnswer: answers4[i], correctAnswer: t.answer, isCorrect: isCorrect4(i) })),
            ],
            score: TASKS1.filter((_,i) => isCorrect1(i)).length + TASKS2.filter((_,i) => isCorrect2(i)).length + TASKS3.filter((_,i) => isCorrect3(i)).length + TASKS4.filter((_,i) => isCorrect4(i)).length,
            total: TASKS1.length + TASKS2.length + TASKS3.length + TASKS4.length,
          }),
        });
        setSubmitted(true);
      } catch { /* silently fail */ }
    }
  }, [checked4, answers4, answers1, answers2, answers3, isTeacher, lessonId, activityId, user]);

  // ── SLIDE 1: RULE ─────────────────────────────────────────────────
  if (slide === 'rule') {
    return (
      <div className="flex flex-col h-full px-3 pt-2 pb-1 gap-2 overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
        <style>{`@keyframes negAppear{to{opacity:1;transform:translateY(0)}}`}</style>

        <div className="shrink-0 border-[3px] border-[#d99a52] bg-[#fff8ef] rounded-xl px-3 py-2 flex items-center gap-3">
          <div className="flex-1 font-extrabold text-center" style={{ fontSize: 'clamp(11px,1.3vw,17px)' }}>
            To make <em>negative</em> sentences with <em>be</em>, we put
          </div>
          <div className="shrink-0 border-[3px] border-[#245aa8] rounded-2xl font-black text-center px-4 py-1"
            style={{ background: 'linear-gradient(90deg,#fff9d7,#fff05a)', fontSize: 'clamp(18px,2.2vw,32px)' }}>
            not
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="font-extrabold text-xs text-gray-500">after</div>
            <div className="flex flex-wrap justify-center gap-1" style={{ maxWidth: 200 }}>
              {['am','are','is',"'m","'re","'s"].map(w => (
                <span key={w} className="border-[2px] border-[#245aa8] rounded-full font-black px-2 py-0.5"
                  style={{ background: 'linear-gradient(90deg,#e7f8d8,#cdefb6)', fontSize: 'clamp(10px,1.2vw,16px)' }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid flex-1 min-h-0 gap-2" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="border-2 border-[#245aa8] rounded-2xl flex items-center justify-center text-center font-bold px-3 py-3"
              style={{ background: 'linear-gradient(90deg,#e7f8d8,#cdefb6)', fontSize: 'clamp(12px,1.5vw,20px)', lineHeight: 1.45, opacity: 0, animation: 'negAppear 0.45s ease forwards', animationDelay: `${0.12 + i * 0.12}s` }}>
              {ex}
            </div>
          ))}
        </div>

        <div className="shrink-0 border-[3px] border-[#d99a52] bg-[#fff8ef] rounded-xl px-3 py-2 flex items-center gap-3">
          <div className="flex-1 font-bold text-center" style={{ fontSize: 'clamp(10px,1.2vw,15px)' }}>
            We can also make contractions with{' '}
            <span style={{ color: '#00a765', fontWeight: 900 }}>n't</span>: you{' '}
            <span style={{ color: '#00a765', fontWeight: 900 }}>aren't</span>, she{' '}
            <span style={{ color: '#00a765', fontWeight: 900 }}>isn't</span>, etc.
          </div>
          <div className="shrink-0 border-[3px] border-[#111] rounded-2xl px-3 py-1 bg-white font-black whitespace-nowrap"
            style={{ fontSize: 'clamp(10px,1.1vw,14px)' }}>
            BUT NOT{' '}
            <span style={{ position: 'relative', display: 'inline-block', padding: '0 3px' }}>
              I amn't
              <span style={{ position: 'absolute', left: 0, right: 0, top: '54%', height: 3, background: '#111', transform: 'rotate(-4deg)', display: 'block' }} />
            </span>
          </div>
        </div>

        <div className="shrink-0 flex gap-2 justify-center items-center flex-wrap">
          {['am / are / is + not', "'m / 're / 's + not", "aren't / isn't"].map(f => (
            <div key={f} className="border-2 border-[#245aa8] rounded-2xl px-3 py-1 bg-white font-extrabold text-center"
              style={{ fontSize: 'clamp(10px,1.2vw,15px)' }}>
              {f}
            </div>
          ))}
        </div>

        <div className="shrink-0 flex justify-between items-center pt-0.5">
          <StepNav current={slide} onGo={setSlide} />
          <button onClick={() => setSlide('trainer1')} className="rounded-full font-extrabold text-white"
            style={{ padding: '5px 18px', fontSize: 'clamp(11px,1.2vw,14px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.15)', fontFamily: 'Arial,sans-serif' }}>
            Start trainer →
          </button>
        </div>
      </div>
    );
  }

  // ── SLIDE 2: TRAINER PART 1 ───────────────────────────────────────
  if (slide === 'trainer1') {
    const allFilled1 = answers1.every(a => a.trim() !== '');
    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
        <div className="shrink-0 px-4 py-1.5 text-white font-extrabold flex items-center gap-2" style={{ background: '#ef101c', fontSize: 'clamp(11px,1.3vw,15px)' }}>
          <span style={{ color: '#000', fontFamily: 'Arial,sans-serif' }}>(Ex.5)</span>
          Write negative ends for the sentences.
        </div>

        <div className="flex flex-col flex-1 min-h-0 gap-4 px-4 py-3 justify-center">
          {TASKS1.map((t, i) => {
            const right = checked1 && isCorrect1(i);
            const wrong = checked1 && !isCorrect1(i);
            return (
              <div key={i} className="flex-1 border-2 border-[#245aa8] rounded-2xl flex flex-col items-center justify-center px-6 py-3 gap-2"
                style={{ background: 'linear-gradient(90deg,#e7f8d8,#bfea99)', minHeight: 0 }}>
                <div className="flex items-center gap-2 flex-wrap justify-center font-bold"
                  style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT }}>
                  <span>{t.before}</span>
                  <input
                    type="text"
                    value={answers1[i]}
                    disabled={checked1}
                    onChange={e => {
                      const next = [...answers1];
                      next[i] = e.target.value;
                      setAnswers1(next);
                    }}
                    placeholder="___"
                    className="text-center outline-none font-extrabold border-b-[3px] border-dashed bg-transparent disabled:cursor-default transition-all"
                    style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT, width: '7em', borderColor: right ? '#15945a' : wrong ? '#d92739' : '#245aa8', color: right ? '#15945a' : wrong ? '#d92739' : '#111' }}
                  />
                  <span>{t.after}</span>
                </div>
                {wrong && (
                  <div className="font-extrabold" style={{ fontSize: 'clamp(11px,1.3vw,16px)', color: '#15945a' }}>
                    ✓ {t.before} <span style={{ textDecoration: 'underline' }}>{t.answer}</span> {t.after}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="shrink-0 flex items-center justify-between px-3 py-1">
          <button onClick={() => setSlide('rule')} className="rounded-full font-extrabold text-white"
            style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
            ← Back
          </button>
          <StepNav current={slide} onGo={setSlide} />
          <div className="flex items-center gap-2">
            {!checked1 ? (
              <>
                {!allFilled1 && <span className="text-[10px] text-gray-400">Fill all boxes</span>}
                <button onClick={handleCheck1} disabled={!allFilled1} className="rounded-full font-extrabold text-white disabled:opacity-40"
                  style={{ padding: '3px 16px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                  Check
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-extrabold" style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correct1 === TASKS1.length ? '#15945a' : '#d92739' }}>
                  {correct1 === TASKS1.length ? 'Part 1 ✓' : `${correct1} / ${TASKS1.length}`}
                </span>
                <button onClick={() => setSlide('trainer2')} className="rounded-full font-extrabold text-white"
                  style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                  Part 2 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── SLIDE 3: TRAINER PART 2 ───────────────────────────────────────
  if (slide === 'trainer2') {
  const allFilled2 = answers2.every(a => a.trim() !== '');
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
      <div className="shrink-0 px-4 py-1.5 text-white font-extrabold flex items-center gap-2" style={{ background: '#ef101c', fontSize: 'clamp(11px,1.3vw,15px)' }}>
        <span style={{ color: '#000', fontFamily: 'Arial,sans-serif' }}>(Ex.5)</span>
        Write negative ends for the sentences.
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-4 px-4 py-3 justify-center">
        {TASKS2.map((t, i) => {
          const right = checked2 && isCorrect2(i);
          const wrong = checked2 && !isCorrect2(i);
          return (
            <div key={i} className="flex-1 border-2 border-[#245aa8] rounded-2xl flex flex-col items-center justify-center px-6 py-3 gap-2"
              style={{ background: 'linear-gradient(90deg,#e7f8d8,#bfea99)', minHeight: 0 }}>
              <div className="flex items-center gap-2 flex-wrap justify-center font-bold"
                style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT }}>
                <span>{t.before}</span>
                <input
                  type="text"
                  value={answers2[i]}
                  disabled={checked2}
                  onChange={e => {
                    const next = [...answers2];
                    next[i] = e.target.value;
                    setAnswers2(next);
                  }}
                  placeholder="___"
                  className="text-center outline-none font-extrabold border-b-[3px] border-dashed bg-transparent disabled:cursor-default transition-all"
                  style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT, width: '7em', borderColor: right ? '#15945a' : wrong ? '#d92739' : '#245aa8', color: right ? '#15945a' : wrong ? '#d92739' : '#111' }}
                />
                <span>{t.after}</span>
              </div>
              {wrong && (
                <div className="font-extrabold" style={{ fontSize: 'clamp(11px,1.3vw,16px)', color: '#15945a' }}>
                  ✓ {t.before} <span style={{ textDecoration: 'underline' }}>{t.answer}</span> {t.after}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="shrink-0 flex items-center justify-between px-3 py-1">
        <button onClick={() => setSlide('trainer1')} className="rounded-full font-extrabold text-white"
          style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
          ← Back
        </button>
        <StepNav current={slide} onGo={setSlide} />
        <div className="flex items-center gap-2">
          {!checked2 ? (
            <>
              {!allFilled2 && <span className="text-[10px] text-gray-400">Fill all boxes</span>}
              <button onClick={handleCheck2} disabled={!allFilled2} className="rounded-full font-extrabold text-white disabled:opacity-40"
                style={{ padding: '3px 16px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                Check
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-extrabold" style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correct2 === TASKS2.length ? '#15945a' : '#d92739' }}>
                {correct2 === TASKS2.length ? 'Part 2 ✓' : `${correct2} / ${TASKS2.length}`}
              </span>
              <button onClick={() => setSlide('trainer3')} className="rounded-full font-extrabold text-white"
                style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                Part 3 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  } // end trainer2

  // ── SLIDE 4: TRAINER PART 3 ───────────────────────────────────────
  if (slide === 'trainer3') {
  const allFilled3 = answers3.every(a => a.trim() !== '');
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
      <div className="shrink-0 px-4 py-1.5 text-white font-extrabold flex items-center gap-2" style={{ background: '#ef101c', fontSize: 'clamp(11px,1.3vw,15px)' }}>
        <span style={{ color: '#000', fontFamily: 'Arial,sans-serif' }}>(Ex.5)</span>
        Write negative ends for the sentences.
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-4 px-4 py-3 justify-center">
        {TASKS3.map((t, i) => {
          const right = checked3 && isCorrect3(i);
          const wrong = checked3 && !isCorrect3(i);
          return (
            <div key={i} className="flex-1 border-2 border-[#245aa8] rounded-2xl flex flex-col items-center justify-center px-6 py-3 gap-2"
              style={{ background: 'linear-gradient(90deg,#e7f8d8,#bfea99)', minHeight: 0 }}>
              <div className="flex items-center gap-2 flex-wrap justify-center font-bold"
                style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT }}>
                <span>{t.before}</span>
                <input
                  type="text"
                  value={answers3[i]}
                  disabled={checked3}
                  onChange={e => {
                    const next = [...answers3];
                    next[i] = e.target.value;
                    setAnswers3(next);
                  }}
                  placeholder="___"
                  className="text-center outline-none font-extrabold border-b-[3px] border-dashed bg-transparent disabled:cursor-default transition-all"
                  style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT, width: '7em', borderColor: right ? '#15945a' : wrong ? '#d92739' : '#245aa8', color: right ? '#15945a' : wrong ? '#d92739' : '#111' }}
                />
                <span>{t.after}</span>
              </div>
              {wrong && (
                <div className="font-extrabold" style={{ fontSize: 'clamp(11px,1.3vw,16px)', color: '#15945a' }}>
                  ✓ {t.before} <span style={{ textDecoration: 'underline' }}>{t.answer}</span> {t.after}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="shrink-0 flex items-center justify-between px-3 py-1">
        <button onClick={() => setSlide('trainer2')} className="rounded-full font-extrabold text-white"
          style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
          ← Back
        </button>
        <StepNav current={slide} onGo={setSlide} />
        <div className="flex items-center gap-2">
          {!checked3 ? (
            <>
              {!allFilled3 && <span className="text-[10px] text-gray-400">Fill all boxes</span>}
              <button onClick={handleCheck3} disabled={!allFilled3} className="rounded-full font-extrabold text-white disabled:opacity-40"
                style={{ padding: '3px 16px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                Check
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-extrabold" style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correct3 === TASKS3.length ? '#15945a' : '#d92739' }}>
                {correct3 === TASKS3.length ? 'Part 3 ✓' : `${correct3} / ${TASKS3.length}`}
              </span>
              <button onClick={() => setSlide('trainer4')} className="rounded-full font-extrabold text-white"
                style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                Part 4 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  } // end trainer3

  // ── SLIDE 5: TRAINER PART 4 ───────────────────────────────────────
  const allFilled4 = answers4.every(a => a.trim() !== '');
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
      <div className="shrink-0 px-4 py-1.5 text-white font-extrabold flex items-center gap-2" style={{ background: '#ef101c', fontSize: 'clamp(11px,1.3vw,15px)' }}>
        <span style={{ color: '#000', fontFamily: 'Arial,sans-serif' }}>(Ex.5)</span>
        Write negative ends for the sentences.
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-4 px-4 py-3 justify-center">
        {TASKS4.map((t, i) => {
          const right = checked4 && isCorrect4(i);
          const wrong = checked4 && !isCorrect4(i);
          return (
            <div key={i} className="flex-1 border-2 border-[#245aa8] rounded-2xl flex flex-col items-center justify-center px-6 py-3 gap-2"
              style={{ background: 'linear-gradient(90deg,#e7f8d8,#bfea99)', minHeight: 0 }}>
              <div className="flex items-center gap-2 flex-wrap justify-center font-bold"
                style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT }}>
                <span>{t.before}</span>
                <input
                  type="text"
                  value={answers4[i]}
                  disabled={checked4}
                  onChange={e => {
                    const next = [...answers4];
                    next[i] = e.target.value;
                    setAnswers4(next);
                  }}
                  placeholder="___"
                  className="text-center outline-none font-extrabold border-b-[3px] border-dashed bg-transparent disabled:cursor-default transition-all"
                  style={{ fontSize: 'clamp(14px,1.8vw,24px)', fontFamily: FONT, width: '7em', borderColor: right ? '#15945a' : wrong ? '#d92739' : '#245aa8', color: right ? '#15945a' : wrong ? '#d92739' : '#111' }}
                />
                <span>{t.after}</span>
              </div>
              {wrong && (
                <div className="font-extrabold" style={{ fontSize: 'clamp(11px,1.3vw,16px)', color: '#15945a' }}>
                  ✓ {t.before} <span style={{ textDecoration: 'underline' }}>{t.answer}</span> {t.after}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="shrink-0 flex items-center justify-between px-3 py-1">
        <button onClick={() => setSlide('trainer3')} className="rounded-full font-extrabold text-white"
          style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
          ← Back
        </button>
        <StepNav current={slide} onGo={setSlide} />
        <div className="flex items-center gap-2">
          {!checked4 ? (
            <>
              {!allFilled4 && <span className="text-[10px] text-gray-400">Fill all boxes</span>}
              <button onClick={handleCheck4} disabled={!allFilled4} className="rounded-full font-extrabold text-white disabled:opacity-40"
                style={{ padding: '3px 16px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
                Check
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-extrabold" style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correct4 === TASKS4.length ? '#15945a' : '#d92739' }}>
                {correct4 === TASKS4.length ? 'Excellent! 🎉' : `${correct4} / ${TASKS4.length}`}
              </span>
              {submitted && <span className="text-[10px] text-green-600">✔ сохранено</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
