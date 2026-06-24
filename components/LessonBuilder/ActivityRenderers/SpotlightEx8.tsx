'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const ALL_WORDS = ['cold','colour','hot','hungry','interested','old','right','size','thirsty','wrong'];

const TASKS = [
  { n:  1, before: "You think I'm wrong, but I know I'm",     after: '',                                answer: 'right',      size: 'md' },
  { n:  2, before: "'What",                                   after: "is that T-shirt?' 'Extra large.'", answer: 'size',       size: 'sm' },
  { n:  3, before: 'What',                                    after: 'is your car?',                    answer: 'colour',     size: 'sm' },
  { n:  4, before: "Sorry, I'm not",                          after: 'in her problems.',                 answer: 'interested', size: 'md' },
  { n:  5, before: "'It's the 18th today.' 'You're",          after: "- it's the 19th.'",               answer: 'wrong',      size: 'md' },
  { n:  6, before: "'Something to drink?' 'No, thanks. I'm not", after: ".'",                           answer: 'thirsty',    size: 'md' },
  { n:  7, before: "'It's",                                   after: "in here.' 'Open a window.'",      answer: 'hot',        size: 'sm' },
  { n:  8, before: 'Is it',                                   after: 'here in winter?',                 answer: 'cold',       size: 'sm' },
  { n:  9, before: "'How",                                    after: "is your girlfriend?' 'She's 19.'", answer: 'old',       size: 'sm' },
  { n: 10, before: "'I'm",                                    after: ".' 'Would you like a sandwich?'", answer: 'hungry',     size: 'sm' },
];

const BLANK_W = { sm: 'clamp(90px,9vw,160px)', md: 'clamp(120px,12vw,200px)' };

// ── BlankSlot — module-level to keep React stable ──────────────────
interface BlankProps {
  idx: number;
  word: string | null;
  checked: boolean;
  correct: boolean;
  selected: string | null;
  size: 'sm' | 'md';
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, idx: number) => void;
  onClick: (idx: number) => void;
}

function BlankSlot({ idx, word, checked, correct, selected, size, onDragOver, onDrop, onClick }: BlankProps) {
  const [dragOver, setDragOver] = useState(false);
  const borderColor = checked ? (correct ? '#0ea85c' : '#e13030') : '#858585';
  const bg          = checked ? (correct ? 'rgba(32,190,108,.08)' : 'rgba(225,48,48,.08)') : dragOver ? '#effdff' : 'transparent';

  return (
    <span
      onDragOver={e => { e.preventDefault(); setDragOver(true); onDragOver(e); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, idx); }}
      onClick={() => onClick(idx)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: BLANK_W[size], height: '1.5em', margin: '0 4px', verticalAlign: 'middle',
        borderBottom: `3px dotted ${borderColor}`,
        borderRadius: '6px 6px 2px 2px',
        background: bg,
        cursor: selected ? 'pointer' : 'default',
        boxShadow: dragOver ? 'inset 0 0 0 2px rgba(28,200,220,.3)' : 'none',
        transition: 'background .1s, box-shadow .1s',
        position: 'relative',
      }}
    >
      {word && (
        <span style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '6px 6px 0 0',
          background: 'rgba(231,249,244,.85)',
          color: '#19c7d8', fontWeight: 400, fontSize: 'inherit',
          cursor: 'pointer',
        }}>
          {word}
        </span>
      )}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────
export default function SpotlightEx8({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const dragRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced]     = useState<(string|null)[]>(Array(10).fill(null));
  const [checked, setChecked]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const bankWords = ALL_WORDS.filter(w => !placed.includes(w));

  const placeWord = useCallback((word: string, taskIdx: number) => {
    setPlaced(prev => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) if (next[i] === word) next[i] = null;
      next[taskIdx] = word;
      return next;
    });
    setSelected(null);
    setChecked(false);
  }, []);

  const returnToBank = useCallback((taskIdx: number) => {
    setPlaced(prev => { const n = [...prev]; n[taskIdx] = null; return n; });
    setChecked(false);
  }, []);

  const handleBlankClick = useCallback((idx: number) => {
    if (selected) {
      placeWord(selected, idx);
    } else if (placed[idx]) {
      returnToBank(idx);
    }
  }, [selected, placed, placeWord, returnToBank]);

  const handleBlankDrop = useCallback((e: React.DragEvent, idx: number) => {
    const word = dragRef.current;
    if (word) { placeWord(word, idx); dragRef.current = null; }
  }, [placeWord]);

  const handleBankDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const word = dragRef.current;
    if (!word) return;
    setPlaced(prev => prev.map(w => w === word ? null : w));
    dragRef.current = null;
    setChecked(false);
  }, []);

  const isCorrect = (i: number) => placed[i] === TASKS[i].answer;
  const score = checked ? TASKS.filter((_, i) => isCorrect(i)).length : 0;

  const handleCheck = useCallback(async () => {
    setChecked(true);
    const sc = TASKS.filter((_, i) => placed[i] === TASKS[i].answer).length;
    if (!submitted && !isTeacher && lessonId) {
      try {
        await fetch('/kids-api/spotlight/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId, activityId, sessionId: sessionId || null,
            studentId: user?.id,
            studentName: user?.displayName || 'Ученик',
            results: TASKS.map((t, i) => ({
              questionIndex: i,
              studentAnswer: placed[i] || '',
              correctAnswer: t.answer,
              isCorrect: placed[i] === t.answer,
            })),
            score: sc,
            total: TASKS.length,
          }),
        });
        setSubmitted(true);
      } catch { /* silent */ }
    }
  }, [placed, submitted, isTeacher, lessonId, activityId, sessionId, user]);

  const handleReset = useCallback(() => {
    setPlaced(Array(10).fill(null));
    setChecked(false);
    setSelected(null);
  }, []);

  const FONT = 'Arial,Helvetica,sans-serif';
  const FS   = 'clamp(15px,1.6vw,24px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fff', fontFamily: FONT, userSelect: 'none' }}>

      {/* header */}
      <div style={{ flexShrink: 0, height: 52, background: '#ef141b', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10 }}>
        <span style={{ color: '#050505', fontSize: 'clamp(18px,2vw,28px)', fontWeight: 500 }}>(Ex.8)</span>
        <span style={{ color: '#fff', fontSize: 'clamp(18px,2vw,28px)', fontWeight: 800 }}>Put in words from the box.</span>
      </div>

      {/* word box */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleBankDrop}
        style={{ flexShrink: 0, margin: '8px auto', width: 'min(1000px,calc(100% - 40px))', border: '2px solid #d6d6d6', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,.1)', padding: '8px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 20px', minHeight: 48 }}
      >
        {ALL_WORDS.map(w => {
          const inBank = bankWords.includes(w);
          const isSel  = selected === w;
          return (
            <span key={w}
              draggable={inBank}
              onDragStart={() => { dragRef.current = w; setSelected(null); }}
              onClick={() => {
                if (!inBank) return;
                setSelected(isSel ? null : w);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 60, height: 36, padding: '0 12px',
                border: `2px solid ${isSel ? '#20cfe0' : inBank ? 'transparent' : 'transparent'}`,
                borderRadius: 8,
                background: isSel ? '#f0fdff' : '#fff',
                color: inBank ? '#505050' : '#aaa',
                fontSize: FS,
                fontWeight: 400,
                cursor: inBank ? 'grab' : 'default',
                outline: isSel ? '3px solid rgba(28,200,220,.25)' : 'none',
                transition: 'all .12s',
                textDecoration: inBank ? 'none' : 'line-through',
                opacity: inBank ? 1 : 0.35,
              }}
            >
              {w}{!inBank && <span style={{ marginLeft: 6, color: '#20cfe0', fontSize: '.85em', fontWeight: 800, textDecoration: 'none' }}>✓</span>}
            </span>
          );
        })}
      </div>

      {/* work area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px clamp(16px,5vw,80px) 8px clamp(16px,5vw,60px)', position: 'relative' }}>

        {/* example line */}
        <div style={{ display: 'flex', alignItems: 'baseline', height: '2.2em', marginBottom: '0.2em', fontSize: FS, color: '#5e5e5e', whiteSpace: 'nowrap', gap: 4 }}>
          <span style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '15px solid #15cfe2', marginRight: 16, flexShrink: 0, alignSelf: 'center' }} />
          <span>He is a big man, but he is</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 80, height: '1.4em', margin: '0 4px', verticalAlign: 'middle', color: '#20cfe0', borderBottom: '3px dotted #858585', padding: '0 4px' }}>afraid</span>
          <span>of her.</span>
        </div>

        {/* task lines */}
        {TASKS.map((t, i) => {
          const ok   = checked && isCorrect(i);
          const fail = checked && !isCorrect(i);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', height: '2.2em', fontSize: FS, color: '#5e5e5e', whiteSpace: 'nowrap', gap: 4 }}>
              <span style={{ width: 'clamp(30px,4vw,55px)', textAlign: 'right', paddingRight: 14, color: '#999', flexShrink: 0 }}>{t.n}</span>
              <span>{t.before}</span>
              <BlankSlot
                idx={i}
                word={placed[i]}
                checked={checked}
                correct={ok}
                selected={selected}
                size={t.size as 'sm' | 'md'}
                onDragOver={e => e.preventDefault()}
                onDrop={handleBlankDrop}
                onClick={handleBlankClick}
              />
              {t.after && <span>{t.after}</span>}
              {ok   && <span style={{ marginLeft: 8, color: '#0ea85c', fontWeight: 900 }}>✓</span>}
              {fail && <span style={{ marginLeft: 8, color: '#e13030', fontWeight: 900 }}>✗</span>}
            </div>
          );
        })}

        {/* bird */}
        <img src="/spotlight/ex8-bird.png" alt="" draggable={false}
          style={{ position: 'absolute', right: 'clamp(8px,3vw,48px)', bottom: 4, width: 'clamp(120px,16vw,260px)', pointerEvents: 'none', opacity: 0.9 }} />
      </div>

      {/* bottom bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '6px 20px 8px', borderTop: '1px solid #eee' }}>
        {submitted && <span style={{ fontSize: 11, color: '#16a34a', marginRight: 4 }}>✔ сохранено</span>}
        <span style={{ fontWeight: 700, fontSize: 16, color: checked ? (score === 10 ? '#0ea85c' : '#e13030') : '#888', minWidth: 60, textAlign: 'center' }}>
          {checked ? `${score} / 10` : '0 / 10'}
        </span>
        <button onClick={handleReset}
          style={{ border: 0, borderRadius: 10, padding: '7px 14px', background: '#777', color: '#fff', fontFamily: FONT, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Сбросить
        </button>
        <button onClick={handleCheck}
          style={{ border: 0, borderRadius: 10, padding: '7px 16px', background: '#ef141b', color: '#fff', fontFamily: FONT, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Проверить
        </button>
      </div>
    </div>
  );
}
