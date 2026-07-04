'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const QUESTIONS = [
  { before: 'We', after: 'very well.', answer: 'are' },
  { before: 'My sister', after: 'a doctor.', answer: 'is' },
  { before: 'John and Ann', after: 'in America.', answer: 'are' },
  { before: 'I', after: 'happy today.', answer: 'am' },
  { before: 'I think you', after: 'tired.', answer: 'are' },
  { before: 'Our house', after: 'very small.', answer: 'is' },
];

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx1({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(''));
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const correctCount = checked
    ? QUESTIONS.filter((q, i) => answers[i] === q.answer).length
    : 0;

  const handleCheck = useCallback(async () => {
    if (checked) return;
    setChecked(true);
    if (!isTeacher && lessonId) {
      const payload = {
        lessonId,
        activityId,
        studentId: user?.id,
        studentName: user?.displayName || 'Ученик',
        results: QUESTIONS.map((q, i) => ({
          questionIndex: i,
          studentAnswer: answers[i],
          correctAnswer: q.answer,
          isCorrect: answers[i] === q.answer,
          sentence: `${q.before} ${q.answer} ${q.after}`,
        })),
        score: QUESTIONS.filter((q, i) => answers[i] === q.answer).length,
        total: QUESTIONS.length,
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
  }, [checked, isTeacher, lessonId, activityId, user, answers]);

  const FONT = '"Comic Sans MS", "Trebuchet MS", Arial, sans-serif';

  return (
    <div
      className="flex h-full select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top left,rgba(255,219,165,0.5),transparent 32%),radial-gradient(circle at bottom right,rgba(0,191,166,0.1),transparent 34%),#fff8ef',
        fontFamily: FONT,
      }}
    >
      {/* Left: exercise */}
      <div className="flex flex-col flex-1 min-w-0 px-4 py-2 gap-1.5">

        {/* Header row: title badge + task */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="bg-[#fffdf8] border-2 border-[#dc9a54] rounded-xl px-3 py-1 shadow-sm shrink-0"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <span className="text-[#00bfa6] font-extrabold" style={{ fontSize: 'clamp(14px,2vw,20px)' }}>
              the verb "be"
            </span>
          </div>
          <div
            className="flex-1 rounded-lg px-3 py-1.5 text-white font-bold shadow-sm"
            style={{ background: '#c0392b', fontSize: 'clamp(12px,1.4vw,15px)' }}
          >
            (Ex.1) Complete with <em>am</em>, <em>is</em> or <em>are</em>.
          </div>
        </div>

        {/* Example */}
        <div className="flex items-center gap-2 px-2 py-1 bg-white/70 rounded-lg border border-orange-100 shrink-0">
          <span style={{ fontSize: 13 }}>▶</span>
          <span className="font-bold" style={{ fontSize: 'clamp(11px,1.3vw,14px)' }}>You</span>
          <span
            className="px-2 py-0.5 rounded font-extrabold border-2 border-[#3b82f6] bg-blue-50 text-[#3b82f6] text-center"
            style={{ fontSize: 'clamp(11px,1.3vw,14px)', minWidth: 40 }}
          >
            are
          </span>
          <span className="font-bold" style={{ fontSize: 'clamp(11px,1.3vw,14px)' }}>late.</span>
          <span className="text-[10px] text-gray-400 italic ml-1">(example)</span>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-1 flex-1 justify-center">
          {QUESTIONS.map((q, i) => {
            const chosen = answers[i];
            const isRight = chosen === q.answer;
            const rowBg = checked ? (isRight ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white/80 border-orange-100';

            return (
              <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${rowBg}`}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                  style={{ background: '#dc9a54' }}
                >
                  {i + 1}
                </span>
                <span className="font-bold" style={{ fontSize: 'clamp(11px,1.3vw,15px)' }}>{q.before}</span>

                {checked ? (
                  <span className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded font-extrabold border-2 text-center ${isRight ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-400 text-red-600 bg-red-50 line-through'}`}
                      style={{ fontSize: 'clamp(11px,1.3vw,15px)', minWidth: 38 }}
                    >
                      {chosen || '—'}
                    </span>
                    {!isRight && (
                      <span
                        className="px-2 py-0.5 rounded font-extrabold border-2 border-green-500 text-green-700 bg-green-50 text-center"
                        style={{ fontSize: 'clamp(11px,1.3vw,15px)', minWidth: 38 }}
                      >
                        {q.answer}
                      </span>
                    )}
                  </span>
                ) : (
                  <select
                    value={chosen}
                    onChange={e => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setAnswers(next);
                    }}
                    className="px-1.5 py-0.5 rounded border-2 border-[#dc9a54] bg-white font-bold cursor-pointer focus:outline-none focus:border-[#00bfa6]"
                    style={{ fontSize: 'clamp(11px,1.3vw,15px)', minWidth: 64 }}
                  >
                    <option value="">___</option>
                    <option value="am">am</option>
                    <option value="is">is</option>
                    <option value="are">are</option>
                  </select>
                )}

                <span className="font-bold" style={{ fontSize: 'clamp(11px,1.3vw,15px)' }}>{q.after}</span>
              </div>
            );
          })}
        </div>

        {/* Check / Result */}
        <div className="flex items-center gap-3 shrink-0 pt-0.5">
          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={answers.some(a => !a)}
              className="px-5 py-1.5 rounded-xl font-extrabold text-white shadow transition disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg,#27ae60,#2ecc71)',
                fontSize: 'clamp(12px,1.4vw,16px)',
              }}
            >
              ✓ Check
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="px-4 py-1.5 rounded-xl font-extrabold text-white shadow text-base"
                style={{ background: correctCount === QUESTIONS.length ? '#27ae60' : correctCount >= 4 ? '#f39c12' : '#e74c3c' }}
              >
                {correctCount}/{QUESTIONS.length}
              </div>
              <span
                className="font-bold text-sm"
                style={{ color: correctCount === QUESTIONS.length ? '#27ae60' : correctCount >= 4 ? '#f39c12' : '#e74c3c' }}
              >
                {correctCount === QUESTIONS.length ? 'Perfect! 🎉' : correctCount >= 4 ? 'Good job! 👍' : 'Keep practising! 💪'}
              </span>
              {submitted && <span className="text-[10px] text-green-600">✔ сохранено</span>}
            </div>
          )}
        </div>
      </div>

      {/* Right: house image */}
      <div className="flex items-center justify-center shrink-0 py-3 pr-3" style={{ width: '35%' }}>
        <img
          src="/spotlight/u1/house.png"
          alt="house"
          className="max-h-full max-w-full object-contain"
          style={{ borderRadius: 12, maxHeight: '100%' }}
        />
      </div>
    </div>
  );
}
