'use client';
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

// Trainer slide 1 — tasks 1-6
const TASKS1 = [
  { text: "your name? 'Maria.'",                answer: "What's"    },
  { text: "my glasses? 'Here.'",                answer: "Where are" },
  { text: "your English teacher? 'Mrs Allen.'", answer: "Who's"     },
  { text: "you late? 'My watch is broken.'",    answer: "Why are"   },
  { text: "the exam? 'On Tuesday.'",            answer: "When's"    },
  { text: "your mother? 'Very well, thanks.'",  answer: "How's"     },
];

// Trainer slide 2 — tasks 7-10
const TASKS2 = [
  { text: "Daniel? 'In hospital.'",       answer: "Where's" },
  { text: "those men? 'I don't know.'",   answer: "Who are" },
  { text: "your parents? 'Very well.'",   answer: "How are" },
  { text: "your birthday? 'March 17th.'", answer: "When's"  },
];

const CONTRACTIONS = ['who is', 'what is', 'when is', 'where is', 'how is', 'why is'];
const EXAMPLES_R1 = ["Who's that?", "What's this?", "When's the party?", "Where's the station?"];
const EXAMPLES_R2 = ["Why are we here?", "How are you?"];

const FONT = '"Comic Sans MS","Trebuchet MS",Arial,sans-serif';

type Slide = 'rule' | 'trainer1' | 'trainer2';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx4({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [slide, setSlide] = useState<Slide>('rule');

  // Trainer 1 state
  const [placed1, setPlaced1] = useState<(string | null)[]>(Array(TASKS1.length).fill(null));
  const [checked1, setChecked1] = useState(false);
  const [bank1Order] = useState<string[]>(() => [...TASKS1.map(t => t.answer)].sort(() => Math.random() - 0.5));

  // Trainer 2 state
  const [placed2, setPlaced2] = useState<(string | null)[]>(Array(TASKS2.length).fill(null));
  const [checked2, setChecked2] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bank2Order] = useState<string[]>(() => [...TASKS2.map(t => t.answer)].sort(() => Math.random() - 0.5));

  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const dragValue = useRef<string | null>(null);
  const dragSourceZone = useRef<number | null>(null);

  const goTo = (s: Slide) => { setSlide(s); setSelected(null); setDragOver(null); };

  // ── Generic drag/click handlers ──────────────────────────────────
  const onChipClick = (answer: string) => {
    if ((slide === 'trainer1' && checked1) || (slide === 'trainer2' && checked2)) return;
    setSelected(prev => prev === answer ? null : answer);
  };

  const makeZoneClick = (
    placed: (string | null)[],
    setPlaced: React.Dispatch<React.SetStateAction<(string | null)[]>>,
    checked: boolean,
  ) => (i: number) => {
    if (checked) return;
    if (placed[i]) { setPlaced(prev => { const n=[...prev]; n[i]=null; return n; }); return; }
    if (!selected) return;
    setPlaced(prev => {
      const n = [...prev];
      const pi = n.indexOf(selected);
      if (pi !== -1) n[pi] = null;
      n[i] = selected;
      return n;
    });
    setSelected(null);
  };

  const onChipDragStart = (answer: string) => { dragValue.current=answer; dragSourceZone.current=null; setSelected(null); };

  const makeZoneDragStart = (placed: (string|null)[]) => (i: number) => {
    dragValue.current = placed[i]; dragSourceZone.current = i;
  };

  const onZoneDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };

  const makeZoneDrop = (
    setPlaced: React.Dispatch<React.SetStateAction<(string | null)[]>>,
    checked: boolean,
  ) => (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (!dragValue.current || checked) { setDragOver(null); return; }
    setPlaced(prev => {
      const n = [...prev];
      if (dragSourceZone.current !== null && dragSourceZone.current !== i) n[dragSourceZone.current]=null;
      n[i] = dragValue.current;
      return n;
    });
    dragValue.current=null; dragSourceZone.current=null; setDragOver(null);
  };

  const onDragEnd = () => { dragValue.current=null; dragSourceZone.current=null; setDragOver(null); };

  // ── Submit ───────────────────────────────────────────────────────
  const handleCheck1 = useCallback(() => {
    if (checked1 || placed1.some(p => !p)) return;
    setChecked1(true);
  }, [checked1, placed1]);

  const handleCheck2 = useCallback(async () => {
    if (checked2 || placed2.some(p => !p)) return;
    setChecked2(true);
    if (!isTeacher && lessonId) {
      const allTasks = [...TASKS1.map((t, i) => ({ t, placed: placed1[i], offset: 0 })), ...TASKS2.map((t, i) => ({ t, placed: placed2[i], offset: TASKS1.length }))];
      try {
        await fetch('/kids-api/spotlight/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId, activityId,
            sessionId: sessionId || null,
            studentId: user?.id,
            studentName: user?.displayName || 'Ученик',
            results: allTasks.map(({ t, placed, offset }, i) => ({
              questionIndex: offset + i % (i < TASKS1.length ? TASKS1.length : TASKS2.length),
              studentAnswer: placed || '',
              correctAnswer: t.answer,
              isCorrect: placed === t.answer,
              sentence: `${t.answer} ${t.text}`,
            })),
            score: allTasks.filter(({ t, placed }) => placed === t.answer).length,
            total: allTasks.length,
          }),
        });
        setSubmitted(true);
      } catch { /* silently fail */ }
    }
  }, [checked2, placed2, placed1, isTeacher, lessonId, activityId, user]);

  // ── SLIDE 1: RULE ─────────────────────────────────────────────────
  if (slide === 'rule') {
    return (
      <div className="flex flex-col h-full px-4 pt-2 pb-1 gap-2 overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
        <style>{`@keyframes spotEx4Appear { to { opacity:1; transform:translateY(0); } }`}</style>

        <div className="shrink-0 font-bold border-[3px] border-[#d99a52] bg-[#faf6ef] rounded-xl px-4 py-2" style={{ fontSize: 'clamp(12px,1.4vw,18px)', lineHeight: 1.25 }}>
          The question words: <b>who, what, when, where, why, how.</b>
        </div>

        <div className="flex gap-3 shrink-0 items-start">
          <div className="shrink-0 font-bold border-[3px] border-[#d99a52] bg-[#faf6ef] rounded-xl px-3 py-2 flex items-center gap-2" style={{ fontSize: 'clamp(11px,1.3vw,17px)', minWidth: '26%' }}>
            Contractions with <span style={{ color: '#ff1e1e', fontStyle: 'italic', fontWeight: 800 }}>is</span>:
          </div>
          <div className="grid flex-1 gap-x-3 gap-y-2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {CONTRACTIONS.map((c, i) => (
              <div key={c} className="rounded-2xl border-2 border-[#2359a7] flex items-center justify-center text-center font-bold"
                style={{ background: 'linear-gradient(90deg,#dff0cf,#cfe6bc)', fontSize: 'clamp(11px,1.3vw,17px)', padding: '6px 10px', opacity: 0, animation: 'spotEx4Appear 0.45s ease forwards', animationDelay: `${0.15 + i * 0.15}s` }}>
                {c}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-1 px-2">
          <div className="grid gap-x-4 gap-y-1" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {EXAMPLES_R1.map((ex, i) => (
              <div key={i} className="font-bold" style={{ fontSize: 'clamp(11px,1.3vw,17px)', opacity: 0, animation: 'spotEx4Appear 0.45s ease forwards', animationDelay: `${1.1 + i * 0.15}s` }}>{ex}</div>
            ))}
          </div>
          <div className="grid gap-x-4 gap-y-1 mt-1" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {EXAMPLES_R2.map((ex, i) => (
              <div key={i} className="font-bold" style={{ fontSize: 'clamp(11px,1.3vw,17px)', opacity: 0, animation: 'spotEx4Appear 0.45s ease forwards', animationDelay: `${1.7 + i * 0.15}s` }}>{ex}</div>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex justify-between items-center pt-1">
          <span className="text-[10px] text-gray-400 font-bold">Rule  1 / 3</span>
          <button onClick={() => goTo('trainer1')} className="rounded-full font-extrabold text-white"
            style={{ padding: '5px 18px', fontSize: 'clamp(11px,1.2vw,14px)', background: 'linear-gradient(180deg,#29ca7d,#17975a)', border: 'none', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.15)', fontFamily: 'Arial,sans-serif' }}>
            Start trainer →
          </button>
        </div>
      </div>
    );
  }

  // ── SLIDE 2: TRAINER PART 1 (tasks 1–6) ──────────────────────────
  if (slide === 'trainer1') {
    const bank1 = bank1Order.filter(a => !placed1.includes(a));
    const allFilled1 = placed1.every(p => p !== null);
    const correct1 = checked1 ? TASKS1.filter((t, i) => placed1[i] === t.answer).length : 0;
    const onZoneClick1 = makeZoneClick(placed1, setPlaced1, checked1);
    const onZoneDrop1 = makeZoneDrop(setPlaced1, checked1);
    const onZoneDragStart1 = makeZoneDragStart(placed1);

    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
        <div className="shrink-0 px-4 py-1.5 text-white font-extrabold flex items-center gap-2" style={{ background: '#ef111c', fontSize: 'clamp(11px,1.3vw,15px)' }}>
          <span style={{ color: '#000', fontFamily: 'Arial,sans-serif' }}>(Ex.4)</span>
          <span>Put in question words with <span style={{ color: '#fff25c', fontStyle: 'italic' }}>are</span> or <span style={{ color: '#fff25c', fontStyle: 'italic' }}>'s</span>.</span>
        </div>

        <div className="flex flex-1 min-h-0 gap-2 px-2 py-1.5">
          {/* Tasks */}
          <div className="flex flex-col flex-1 min-w-0 gap-1">
            {/* Examples */}
            <div className="flex flex-col gap-0.5 mb-1 shrink-0">
              {[{ answer: "Who's", rest: "that? 'It's my brother.'" }, { answer: "Where are", rest: "Joe and Ann? 'In London.'" }].map((ex, i) => (
                <div key={i} className="flex items-center gap-2" style={{ fontSize: 'clamp(10px,1.1vw,13px)', fontFamily: 'Georgia,"Times New Roman",serif' }}>
                  <div style={{ width:0, height:0, borderTop:'7px solid transparent', borderBottom:'7px solid transparent', borderLeft:'11px solid #2ab5f5', flexShrink:0 }} />
                  <span><span style={{ color:'#4fb5ee', fontFamily:FONT, fontStyle:'italic', fontWeight:800, borderBottom:'3px dotted #111' }}>{ex.answer}</span> {ex.rest}</span>
                </div>
              ))}
            </div>

            {TASKS1.map((t, i) => {
              const val = placed1[i];
              const isRight = checked1 && val === t.answer;
              const isWrong = checked1 && val !== null && !isRight;
              const isOver = dragOver === i;
              return (
                <div key={i} className="flex items-center gap-1.5 rounded-xl border-2 border-[#2359a7] px-2 flex-1" style={{ background: 'linear-gradient(90deg,#e5f4d6,#d3edc3)', minHeight: 0 }}>
                  <span className="shrink-0 font-extrabold text-sm w-5 text-right" style={{ fontFamily: FONT }}>{i + 1}.</span>
                  <div
                    draggable={!!val && !checked1} onDragStart={() => val && onZoneDragStart1(i)} onDragEnd={onDragEnd}
                    onDragOver={e => onZoneDragOver(e, i)} onDragLeave={() => setDragOver(null)} onDrop={e => onZoneDrop1(e, i)}
                    onClick={() => onZoneClick1(i)}
                    className="shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all font-extrabold"
                    style={{ minWidth: 80, minHeight: 22, padding: '2px 8px', fontSize: 'clamp(10px,1.1vw,13px)', border: `2px ${val?'solid':'dashed'} ${isRight?'#18985a':isWrong?'#d92b3a':isOver?'#d99a52':'rgba(35,89,167,.5)'}`, background: isRight?'#eafff4':isWrong?'#fff0f2':isOver?'#fff8d6':'rgba(255,255,255,.8)', color: isWrong?'#d92b3a':'#111' }}
                  >{val||''}</div>
                  <span className="font-bold" style={{ fontSize: 'clamp(10px,1.1vw,13px)', fontFamily: 'Georgia,"Times New Roman",serif' }}>{t.text}</span>
                </div>
              );
            })}
          </div>

          {/* Bank */}
          <div className="shrink-0 flex flex-col rounded-2xl border-[2px] border-[#d99a52] bg-[#fff8e8]" style={{ width: '30%', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
            <div className="text-center font-extrabold px-2 py-1 shrink-0 border-b border-[#d99a52]" style={{ fontSize: 'clamp(9px,1vw,12px)', color: '#8b4f18' }}>Drag the answers</div>
            <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto flex-1">
              {bank1.map(answer => (
                <div key={answer} draggable onDragStart={() => onChipDragStart(answer)} onDragEnd={onDragEnd} onClick={() => onChipClick(answer)}
                  className="rounded-full text-center font-extrabold border-2 cursor-grab transition-all"
                  style={{ padding: '4px 8px', fontSize: 'clamp(9px,1.05vw,13px)', borderColor: selected===answer?'#d59c00':'#d99a52', background: selected===answer?'#fff25c':'#fff', boxShadow: selected===answer?'0 0 0 3px rgba(255,242,92,.4)':'0 2px 0 rgba(0,0,0,.1)', userSelect: 'none' }}>
                  {answer}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-3 py-1">
          <button onClick={() => goTo('rule')} className="rounded-full font-extrabold text-white"
            style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
            ← Back
          </button>
          <span className="text-[10px] text-gray-400 font-bold">Part 1  2 / 3</span>
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
                <span className="font-extrabold" style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correct1===TASKS1.length?'#18985a':'#d92b3a' }}>
                  {correct1===TASKS1.length ? 'Part 1 ✓' : `${correct1} / ${TASKS1.length}`}
                </span>
                <button onClick={() => goTo('trainer2')} className="rounded-full font-extrabold text-white"
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

  // ── SLIDE 3: TRAINER PART 2 (tasks 7–10) ─────────────────────────
  const bank2 = bank2Order.filter(a => !placed2.includes(a));
  const allFilled2 = placed2.every(p => p !== null);
  const correct2 = checked2 ? TASKS2.filter((t, i) => placed2[i] === t.answer).length : 0;
  const onZoneClick2 = makeZoneClick(placed2, setPlaced2, checked2);
  const onZoneDrop2 = makeZoneDrop(setPlaced2, checked2);
  const onZoneDragStart2 = makeZoneDragStart(placed2);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff', fontFamily: FONT, userSelect: 'none' }}>
      <div className="shrink-0 px-4 py-1.5 text-white font-extrabold flex items-center gap-2" style={{ background: '#ef111c', fontSize: 'clamp(11px,1.3vw,15px)' }}>
        <span style={{ color: '#000', fontFamily: 'Arial,sans-serif' }}>(Ex.4)</span>
        <span>Put in question words with <span style={{ color: '#fff25c', fontStyle: 'italic' }}>are</span> or <span style={{ color: '#fff25c', fontStyle: 'italic' }}>'s</span>.</span>
      </div>

      <div className="flex flex-1 min-h-0 gap-2 px-2 py-2">
        {/* Tasks 7-10 */}
        <div className="flex flex-col flex-1 min-w-0 gap-3 justify-center">
          {TASKS2.map((t, i) => {
            const val = placed2[i];
            const isRight = checked2 && val === t.answer;
            const isWrong = checked2 && val !== null && !isRight;
            const isOver = dragOver === i;
            return (
              <div key={i} className="flex items-center gap-3 py-2 px-3" style={{ borderBottom: '1px solid #f0e8d8' }}>
                <span className="shrink-0 font-extrabold" style={{ fontSize: 'clamp(13px,1.5vw,20px)', fontFamily: 'Georgia,"Times New Roman",serif', minWidth: 28, textAlign: 'right' }}>{i + 7}.</span>
                {/* Dropzone with dotted underline style */}
                <div
                  draggable={!!val && !checked2} onDragStart={() => val && onZoneDragStart2(i)} onDragEnd={onDragEnd}
                  onDragOver={e => onZoneDragOver(e, i)} onDragLeave={() => setDragOver(null)} onDrop={e => onZoneDrop2(e, i)}
                  onClick={() => onZoneClick2(i)}
                  className="shrink-0 flex items-center justify-center cursor-pointer transition-all font-extrabold"
                  style={{
                    minWidth: 100, minHeight: 30, padding: '3px 12px',
                    fontSize: 'clamp(11px,1.3vw,16px)',
                    fontFamily: FONT,
                    borderBottom: `4px dotted ${isRight?'#17975a':isWrong?'#d92b3a':'#222'}`,
                    background: isRight?'#eafff4':isWrong?'#fff0f2':isOver?'#fff8d6':'rgba(255,255,255,.9)',
                    borderRadius: isRight||isWrong||isOver ? 999 : 0,
                    border: isOver ? `2px dashed #d99a52` : undefined,
                    color: isWrong?'#d92b3a':'#111',
                  }}
                >{val || ''}</div>
                <span className="font-bold" style={{ fontSize: 'clamp(12px,1.4vw,18px)', fontFamily: 'Georgia,"Times New Roman",serif' }}>
                  {t.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bank */}
        <div className="shrink-0 flex flex-col rounded-2xl border-[2px] border-[#d99a52] bg-[#fff8e8]" style={{ width: '30%', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
          <div className="text-center font-extrabold px-2 py-1 shrink-0 border-b border-[#d99a52]" style={{ fontSize: 'clamp(9px,1vw,12px)', color: '#8b4f18' }}>Drag the answers</div>
          <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 justify-center">
            {bank2.map(answer => (
              <div key={answer} draggable onDragStart={() => onChipDragStart(answer)} onDragEnd={onDragEnd} onClick={() => onChipClick(answer)}
                className="rounded-full text-center font-extrabold border-2 cursor-grab transition-all"
                style={{ padding: '5px 10px', fontSize: 'clamp(10px,1.1vw,14px)', borderColor: selected===answer?'#d59c00':'#d99a52', background: selected===answer?'#fff25c':'#fff', boxShadow: selected===answer?'0 0 0 3px rgba(255,242,92,.4)':'0 2px 0 rgba(0,0,0,.1)', userSelect: 'none' }}>
                {answer}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1">
        <button onClick={() => goTo('trainer1')} className="rounded-full font-extrabold text-white"
          style={{ padding: '3px 14px', fontSize: 'clamp(10px,1.1vw,13px)', background: 'linear-gradient(180deg,#4b8ff0,#2359a7)', border: 'none', cursor: 'pointer', fontFamily: 'Arial,sans-serif' }}>
          ← Back
        </button>
        <span className="text-[10px] text-gray-400 font-bold">Part 2  3 / 3</span>
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
              <span className="font-extrabold" style={{ fontSize: 'clamp(11px,1.2vw,15px)', color: correct2===TASKS2.length?'#18985a':'#d92b3a' }}>
                {correct2===TASKS2.length ? 'Excellent! 🎉' : `${correct2} / ${TASKS2.length}`}
              </span>
              {submitted && <span className="text-[10px] text-green-600">✔ сохранено</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
