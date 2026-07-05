'use client';
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const TASKS = [
  { prompt: 'Bill / Scottish',     answer: 'Is Bill Scottish?' },
  { prompt: 'Marie / from Paris',  answer: 'Is Marie from Paris?' },
  { prompt: 'We / very late',      answer: 'Are we very late?' },
  { prompt: 'John / in bed',       answer: 'Is John in bed?' },
  { prompt: 'The boss / in Japan', answer: 'Is the boss in Japan?' },
  { prompt: 'His car / fast',      answer: 'Is his car fast?' },
];

const FONT = '"Comic Sans MS","Trebuchet MS",Arial,sans-serif';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx3({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [slide, setSlide] = useState<'rule' | 'trainer'>('rule');
  const [placed, setPlaced] = useState<(string | null)[]>(Array(TASKS.length).fill(null));
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  // Shuffle once on mount
  const [bankOrder] = useState<string[]>(() =>
    [...TASKS.map(t => t.answer)].sort(() => Math.random() - 0.5)
  );

  const dragValue = useRef<string | null>(null);
  const dragSourceZone = useRef<number | null>(null);

  const bankChips = bankOrder.filter(a => !placed.includes(a));
  const allFilled = placed.every(p => p !== null);
  const correctCount = checked
    ? TASKS.filter((t, i) => placed[i] === t.answer).length
    : 0;

  const onChipClick = (answer: string) => {
    if (checked) return;
    setSelected(prev => (prev === answer ? null : answer));
  };

  const onZoneClick = (i: number) => {
    if (checked) return;
    if (placed[i]) {
      setPlaced(prev => { const n = [...prev]; n[i] = null; return n; });
      return;
    }
    if (!selected) return;
    setPlaced(prev => {
      const n = [...prev];
      const prev_i = n.indexOf(selected);
      if (prev_i !== -1) n[prev_i] = null;
      n[i] = selected;
      return n;
    });
    setSelected(null);
  };

  const onChipDragStart = (answer: string) => {
    dragValue.current = answer;
    dragSourceZone.current = null;
    setSelected(null);
  };
  const onZoneDragStart = (i: number) => {
    dragValue.current = placed[i];
    dragSourceZone.current = i;
  };
  const onZoneDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };
  const onZoneDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (!dragValue.current || checked) { setDragOver(null); return; }
    setPlaced(prev => {
      const n = [...prev];
      if (dragSourceZone.current !== null && dragSourceZone.current !== i) n[dragSourceZone.current] = null;
      n[i] = dragValue.current;
      return n;
    });
    dragValue.current = null;
    dragSourceZone.current = null;
    setDragOver(null);
  };
  const onDragEnd = () => {
    dragValue.current = null;
    dragSourceZone.current = null;
    setDragOver(null);
  };

  const handleCheck = useCallback(async () => {
    if (checked || !allFilled) return;
    setChecked(true);
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
            results: TASKS.map((t, i) => ({
              questionIndex: i,
              studentAnswer: placed[i] || '',
              correctAnswer: t.answer,
              isCorrect: placed[i] === t.answer,
              sentence: t.answer,
            })),
            score: TASKS.filter((t, i) => placed[i] === t.answer).length,
            total: TASKS.length,
          }),
        });
        setSubmitted(true);
      } catch { /* silently fail */ }
    }
  }, [checked, allFilled, isTeacher, lessonId, activityId, user, placed]);

  // ── SLIDE 1: RULE ──────────────────────────────────────────────────
  if (slide === 'rule') {
    return (
      <div className="flex flex-col h-full px-4 pt-2 pb-1 gap-2" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
        {/* Rule box */}
        <div
          className="shrink-0 text-center font-bold border-[3px] border-[#d99a52] bg-[#faf6ef] rounded-xl px-5 py-2"
          style={{ fontSize: 'clamp(12px,1.5vw,19px)', lineHeight: 1.3 }}
        >
          To make questions with{' '}
          <span style={{ color: '#00b96f', fontStyle: 'italic' }}>be</span>, we put the{' '}
          <span style={{ color: '#ef111c', fontStyle: 'italic' }}>verb</span>{' '}
          before the subject.
        </div>

        {/* Example rows */}
        <div className="flex-1 flex flex-col justify-center gap-4 px-2">
          {/* Positive + */}
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-xl"
              style={{ background: '#e21026', boxShadow: '3px 3px 0 #ffd900', transform: 'rotate(-2deg)' }}
            >+</div>
            <div className="grid flex-1 gap-x-3 gap-y-1" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                ['I am', 'late.'],
                ['The taxi is', 'here.'],
                ['We are', 'late.'],
                ['Your keys are', 'in the car.'],
              ].map(([s, r], i) => (
                <div key={i} style={{ fontSize: 'clamp(11px,1.3vw,16px)', fontFamily: FONT, fontWeight: 700 }}>
                  <span style={{ borderBottom: '3px solid #e40d16' }}>{s}</span> {r}
                </div>
              ))}
            </div>
          </div>

          {/* Question ? */}
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-xl"
              style={{ background: '#ffd600', color: '#111', boxShadow: '3px 3px 0 #e21026', transform: 'rotate(-2deg)' }}
            >?</div>
            <div className="grid flex-1 gap-x-3 gap-y-1" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                ['Am I', 'late?'],
                ['Is the taxi', 'here?'],
                ['Are we', 'late?'],
                ['Are my keys', 'in the car?'],
              ].map(([v, r], i) => (
                <div key={i} style={{ fontSize: 'clamp(11px,1.3vw,16px)', fontFamily: FONT, fontWeight: 700 }}>
                  <span style={{ borderBottom: '3px solid #e40d16' }}>{v}</span> {r}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="shrink-0 flex justify-between items-center pt-1">
          <span className="text-[10px] text-gray-400 font-bold">Rule  1 / 2</span>
          <button
            onClick={() => setSlide('trainer')}
            className="rounded-full font-extrabold text-white"
            style={{ padding: '5px 18px', fontSize: 'clamp(11px,1.2vw,14px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.15)', fontFamily: 'Arial,sans-serif' }}
          >
            Start trainer →
          </button>
        </div>
      </div>
    );
  }

  // ── SLIDE 2: TRAINER ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
      {/* Red bar */}
      <div
        className="shrink-0 px-4 py-1.5 text-white font-extrabold"
        style={{ background: '#ef111c', fontSize: 'clamp(11px,1.3vw,15px)' }}
      >
        <span style={{ color: '#000', fontFamily: 'Arial,sans-serif', marginRight: 6 }}>(Ex.3)</span>
        Make questions.
      </div>

      {/* Tasks + Bank */}
      <div className="flex flex-1 min-h-0 gap-2 px-2 py-1.5">
        {/* Tasks */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {TASKS.map((t, i) => {
            const val = placed[i];
            const isRight = checked && val === t.answer;
            const isWrong = checked && val !== null && !isRight;
            const isOver = dragOver === i;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-xl border-2 border-[#2359a7] px-2 flex-1"
                style={{ background: 'linear-gradient(90deg,#e5f4d6,#d3edc3)', minHeight: 0 }}
              >
                <span className="shrink-0 font-extrabold text-sm w-5 text-right" style={{ fontFamily: FONT }}>{i + 1}.</span>
                <span
                  className="shrink-0 font-bold"
                  style={{ fontSize: 'clamp(10px,1.15vw,14px)', minWidth: '32%' }}
                >
                  {t.prompt}
                </span>
                <div
                  draggable={!!val && !checked}
                  onDragStart={() => val && onZoneDragStart(i)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => onZoneDragOver(e, i)}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => onZoneDrop(e, i)}
                  onClick={() => onZoneClick(i)}
                  className="flex-1 rounded-full flex items-center justify-center cursor-pointer transition-all font-extrabold"
                  style={{
                    minHeight: 22,
                    padding: '2px 8px',
                    fontSize: 'clamp(10px,1.1vw,13px)',
                    border: `2px ${val ? 'solid' : 'dashed'} ${isRight ? '#18985a' : isWrong ? '#d92b3a' : isOver ? '#d99a52' : 'rgba(35,89,167,.5)'}`,
                    background: isRight ? '#eafff4' : isWrong ? '#fff0f2' : isOver ? '#fff8d6' : 'rgba(255,255,255,.8)',
                    color: isWrong ? '#d92b3a' : '#111',
                  }}
                >
                  {val || ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bank */}
        <div
          className="shrink-0 flex flex-col rounded-2xl border-[2px] border-[#d99a52] bg-[#fff8e8]"
          style={{ width: '37%', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
        >
          <div
            className="text-center font-extrabold px-2 py-1 shrink-0 border-b border-[#d99a52]"
            style={{ fontSize: 'clamp(9px,1vw,12px)', color: '#8b4f18' }}
          >
            Drag the questions
          </div>
          <div className="flex flex-col gap-1 p-1.5 overflow-y-auto flex-1">
            {bankChips.map(answer => (
              <div
                key={answer}
                draggable
                onDragStart={() => onChipDragStart(answer)}
                onDragEnd={onDragEnd}
                onClick={() => onChipClick(answer)}
                className="rounded-full text-center font-extrabold border-2 cursor-grab transition-all"
                style={{
                  padding: '3px 8px',
                  fontSize: 'clamp(9px,1vw,12px)',
                  borderColor: selected === answer ? '#d59c00' : '#d99a52',
                  background: selected === answer ? '#fff25c' : '#fff',
                  boxShadow: selected === answer ? '0 0 0 3px rgba(255,242,92,.4)' : '0 2px 0 rgba(0,0,0,.1)',
                  userSelect: 'none',
                }}
              >
                {answer}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1">
        <button
          onClick={() => { setSlide('rule'); setSelected(null); }}
          className="rounded-full font-extrabold text-white"
          style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}
        >
          ← Back
        </button>
        <span className="text-[10px] text-gray-400 font-bold">Trainer  2 / 2</span>
        <div className="flex items-center gap-2">
          {!checked ? (
            <>
              {!allFilled && <span className="text-[10px] text-gray-400">Fill all boxes</span>}
              <button
                onClick={handleCheck}
                disabled={!allFilled}
                className="rounded-full font-extrabold text-white disabled:opacity-40"
                style={{ padding: '3px 16px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}
              >
                Check
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="font-extrabold"
                style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correctCount === TASKS.length ? '#18985a' : '#d92b3a' }}
              >
                {correctCount === TASKS.length ? 'Excellent! 🎉' : `${correctCount} / ${TASKS.length}`}
              </span>
              {submitted && <span className="text-[10px] text-green-600">✔ сохранено</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
