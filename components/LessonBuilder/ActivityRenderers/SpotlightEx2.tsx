'use client';
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const CHIPS = ["I'm","you're","he's","she's","it's","John's","the train's","we're","they're","my name's","the shop's","Ann's"];

const SENTENCES = [
  { prompt: 'I am a doctor.',      after: 'a doctor.',   answer: "I'm" },
  { prompt: 'They are here.',      after: 'here.',       answer: "they're" },
  { prompt: 'You are late.',       after: 'late.',       answer: "you're" },
  { prompt: 'I am sorry.',         after: 'sorry.',      answer: "I'm" },
  { prompt: 'John is in London.',  after: 'in London.',  answer: "John's" },
  { prompt: 'My name is Peter.',   after: 'Peter.',      answer: "my name's" },
  { prompt: 'The shop is open.',   after: 'open.',       answer: "the shop's" },
  { prompt: 'You are early.',      after: 'early.',      answer: "you're" },
  { prompt: 'We are ready.',       after: 'ready.',      answer: "we're" },
  { prompt: 'The shop is closed.', after: 'closed.',     answer: "the shop's" },
  { prompt: 'Ann is ill.',         after: 'ill.',        answer: "Ann's" },
  { prompt: 'We are all tired.',   after: 'all tired.',  answer: "we're" },
];

const normalize = (s: string) => s.trim().replace(/[`‘’‛]/g, "'").toLowerCase();

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx2({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [placed, setPlaced] = useState<(string | null)[]>(Array(SENTENCES.length).fill(null));
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const dragValue = useRef<string | null>(null);
  const dragSourceZone = useRef<number | null>(null);

  const allFilled = placed.every(p => p !== null);
  const correctCount = checked
    ? SENTENCES.filter((s, i) => normalize(placed[i] || '') === normalize(s.answer)).length
    : 0;

  // ── Bank chip handlers ──────────────────────────────────────────────
  const onChipDragStart = (value: string) => {
    dragValue.current = value;
    dragSourceZone.current = null;
    setSelected(null);
  };
  const onChipClick = (value: string) => {
    if (checked) return;
    setSelected(prev => (prev === value ? null : value));
  };

  // ── Zone handlers ───────────────────────────────────────────────────
  const onZoneClick = (i: number) => {
    if (checked) return;
    if (placed[i]) {
      // remove chip from zone
      setPlaced(prev => { const n = [...prev]; n[i] = null; return n; });
      return;
    }
    if (!selected) return;
    setPlaced(prev => { const n = [...prev]; n[i] = selected; return n; });
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
      if (dragSourceZone.current !== null && dragSourceZone.current !== i) {
        n[dragSourceZone.current] = null;
      }
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

  // ── Submit ──────────────────────────────────────────────────────────
  const handleCheck = useCallback(async () => {
    if (checked || !allFilled) return;
    setChecked(true);
    if (!isTeacher && lessonId) {
      const payload = {
        lessonId,
        activityId,
        studentId: user?.id,
        studentName: user?.displayName || 'Ученик',
        results: SENTENCES.map((s, i) => ({
          questionIndex: i,
          studentAnswer: placed[i] || '',
          correctAnswer: s.answer,
          isCorrect: normalize(placed[i] || '') === normalize(s.answer),
          sentence: `${s.answer} ${s.after}`,
        })),
        score: SENTENCES.filter((s, i) => normalize(placed[i] || '') === normalize(s.answer)).length,
        total: SENTENCES.length,
      };
      try {
        await fetch('/kids-api/spotlight/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, sessionId: sessionId || null }),
        });
        setSubmitted(true);
      } catch { /* silently fail */ }
    }
  }, [checked, allFilled, isTeacher, lessonId, activityId, user, placed]);

  const FONT = '"Comic Sans MS","Trebuchet MS",Arial,sans-serif';

  return (
    <div
      className="flex flex-col h-full select-none overflow-hidden"
      style={{ background: '#f7f2ea', fontFamily: FONT }}
    >
      {/* Rule */}
      <div
        className="shrink-0 text-center font-bold border-2 border-[#d79a53] bg-[#f7f2ea] mx-3 mt-1.5 mb-1 rounded-lg px-3 py-1"
        style={{ fontSize: 'clamp(10px,1.2vw,14px)', lineHeight: 1.25 }}
      >
        In <b>conversation</b> and informal writing, we use <b>contractions</b>:
      </div>

      {/* Chip bank */}
      <div className="flex flex-wrap justify-center gap-1 px-3 mb-1 shrink-0">
        {CHIPS.map(chip => (
          <div
            key={chip}
            draggable
            onDragStart={() => onChipDragStart(chip)}
            onDragEnd={onDragEnd}
            onClick={() => onChipClick(chip)}
            className="rounded-full border-2 font-extrabold cursor-grab transition-all"
            style={{
              padding: '2px 10px',
              fontSize: 'clamp(9px,1.05vw,13px)',
              fontFamily: FONT,
              borderColor: selected === chip ? '#d89d00' : '#d99b57',
              background: selected === chip ? '#ffe66d' : '#fff8e8',
              boxShadow: selected === chip ? '0 0 0 3px rgba(255,230,109,.45)' : '0 2px 0 rgba(0,0,0,.1)',
              userSelect: 'none',
            }}
          >
            {chip}
          </div>
        ))}
      </div>

      {/* Red task bar */}
      <div
        className="shrink-0 mx-3 mb-1 rounded-lg px-3 py-1 text-white font-extrabold"
        style={{ background: '#ef111c', fontSize: 'clamp(10px,1.1vw,13px)' }}
      >
        <span className="text-black font-extrabold mr-1">(Ex.2)</span>
        Drag the contractions into the sentences.
      </div>

      {/* 2×6 board */}
      <div
        className="flex-1 min-h-0 grid px-3 pb-1.5"
        style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(6,1fr)', gap: '5px 10px' }}
      >
        {SENTENCES.map((s, i) => {
          const val = placed[i];
          const isRight = checked && normalize(val || '') === normalize(s.answer);
          const isWrong = checked && val !== null && !isRight;
          const isOver = dragOver === i;

          return (
            <div
              key={i}
              className="rounded-lg border-2 border-[#2d5aa7] flex flex-col justify-center px-2"
              style={{ background: 'linear-gradient(90deg,#dff0cf,#cfe6bc)', padding: '3px 8px' }}
            >
              {/* Prompt */}
              <div
                className="text-center font-bold leading-tight"
                style={{ fontSize: 'clamp(9px,1vw,12px)', fontFamily: FONT, marginBottom: 2 }}
              >
                {s.prompt}
              </div>

              {/* Answer line */}
              <div
                className="flex items-center justify-center gap-1 font-extrabold"
                style={{ fontSize: 'clamp(9px,1vw,12px)', fontFamily: 'Arial,sans-serif' }}
              >
                {/* Dropzone */}
                <div
                  draggable={!!val && !checked}
                  onDragStart={() => val && onZoneDragStart(i)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => onZoneDragOver(e, i)}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => onZoneDrop(e, i)}
                  onClick={() => onZoneClick(i)}
                  className="rounded-full flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    minWidth: 72,
                    minHeight: 20,
                    padding: '2px 7px',
                    fontSize: 'clamp(9px,1vw,12px)',
                    fontFamily: FONT,
                    border: `2px ${val ? 'solid' : 'dashed'} ${isRight ? '#17975a' : isWrong ? '#d92b3a' : isOver ? '#d79a53' : 'rgba(45,90,167,.5)'}`,
                    background: isRight ? '#eafff4' : isWrong ? '#fff0f2' : isOver ? '#fff8d6' : 'rgba(255,255,255,.55)',
                    color: isWrong ? '#d92b3a' : '#111',
                  }}
                >
                  {val || ''}
                </div>
                <span>{s.after}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: check / score */}
      <div className="flex items-center justify-end gap-3 px-4 py-1 shrink-0">
        {!checked ? (
          <>
            {!allFilled && <span className="text-[10px] text-gray-400">Fill all boxes first</span>}
            <button
              onClick={handleCheck}
              disabled={!allFilled}
              className="rounded-full font-extrabold text-white transition disabled:opacity-40"
              style={{
                padding: '4px 18px',
                fontSize: 'clamp(10px,1.1vw,14px)',
                background: 'linear-gradient(180deg,#29ca7d,#17975a)',
                boxShadow: '0 3px 0 rgba(0,0,0,.15)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Check
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="font-extrabold"
              style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correctCount === SENTENCES.length ? '#17975a' : '#d92b3a' }}
            >
              {correctCount === SENTENCES.length ? 'Excellent! 🎉' : `${correctCount} / ${SENTENCES.length}`}
            </span>
            {submitted && <span className="text-[10px] text-green-600">✔ сохранено</span>}
          </div>
        )}
      </div>
    </div>
  );
}
