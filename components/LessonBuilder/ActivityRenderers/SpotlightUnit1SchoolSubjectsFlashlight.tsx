'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const SCHOOL_SUBJECTS = [
  { word: 'English', icon: '📖', x: 42, y: 16, r: -6 },
  { word: 'Maths', icon: '➗', x: 78, y: 18, r: 2 },
  { word: 'Science', icon: '🔬', x: 36, y: 39, r: 3 },
  { word: 'History', icon: '🏛️', x: 84, y: 40, r: -3 },
  { word: 'Art', icon: '🎨', x: 43, y: 62, r: -2 },
  { word: 'Geography', icon: '🌍', x: 86, y: 65, r: 3 },
  { word: 'Music', icon: '🎵', x: 35, y: 82, r: 5 },
  { word: 'IT', icon: '💻', x: 52, y: 76, r: -2 },
  { word: 'PE', icon: '⚽', x: 72, y: 78, r: 4 },
];

const DECOY_WORDS = [
  { word: 'cat', icon: '🐱', x: 57, y: 22, r: 5 },
  { word: 'train', icon: '🚂', x: 18, y: 43, r: -4 },
  { word: 'sun', icon: '☀️', x: 59, y: 42, r: -4 },
  { word: 'car', icon: '🚗', x: 22, y: 64, r: 6 },
  { word: 'pizza', icon: '🍕', x: 66, y: 64, r: 4 },
  { word: 'grumpy dwarf', icon: '🧙', x: 16, y: 84, r: -5 },
  { word: 'apple', icon: '🍎', x: 56, y: 84, r: -5 },
];

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1SchoolSubjectsFlashlight({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [foundSubjects, setFoundSubjects] = useState<Set<string>>(new Set());
  const [wrongClicks, setWrongClicks] = useState<number>(0);
  const [completed, setCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allFound = foundSubjects.size === SCHOOL_SUBJECTS.length;

  useEffect(() => {
    if (allFound && !completed) {
      setCompleted(true);
      setTimeout(() => submitResults(), 1500);
    }
  }, [allFound, completed]);

  const submitResults = useCallback(async () => {
    if (submitted || isTeacher || !lessonId) return;

    const results = SCHOOL_SUBJECTS.map((subject, index) => ({
      questionIndex: index,
      correctAnswer: subject.word,
      studentAnswer: foundSubjects.has(subject.word) ? subject.word : 'not found',
      isCorrect: foundSubjects.has(subject.word),
      sentence: `${subject.icon} ${subject.word}`,
    }));

    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          activityId,
          sessionId: sessionId || null,
          studentId: user?.id,
          studentName: user?.displayName || 'Ученик',
          results,
          score: foundSubjects.size,
          total: SCHOOL_SUBJECTS.length,
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  }, [submitted, isTeacher, lessonId, activityId, sessionId, user, foundSubjects]);

  const handleWordClick = useCallback((word: string, isSubject: boolean) => {
    if (completed) return;

    if (isSubject) {
      setFoundSubjects(prev => {
        const newSet = new Set(prev);
        newSet.add(word);
        return newSet;
      });
    } else {
      setWrongClicks(prev => prev + 1);
    }
  }, [completed]);

  const resetGame = useCallback(() => {
    setFoundSubjects(new Set());
    setWrongClicks(0);
    setCompleted(false);
    setSubmitted(false);
  }, []);

  return (
    <div className="flex h-full select-none overflow-hidden" style={{
      background: 'radial-gradient(circle at 30% 20%, rgba(30, 58, 138, 0.15), transparent 45%), radial-gradient(circle at 70% 80%, rgba(30, 58, 138, 0.12), transparent 40%), #1e1b4b',
      fontFamily: '"Comic Sans MS", "Trebuchet MS", Arial, sans-serif'
    }}>
      {/* Game Area */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-6 py-3 inline-block shadow-lg">
            <h2 className="text-2xl font-bold text-white m-0">🔦 Find School Subjects!</h2>
            <p className="text-sm text-indigo-100 mt-1">Click on school subjects only</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
            <span className="font-bold text-white">Found: {foundSubjects.size} / {SCHOOL_SUBJECTS.length}</span>
          </div>
          {wrongClicks > 0 && (
            <div className="bg-red-500/20 backdrop-blur rounded-xl px-4 py-2 border border-red-400/30">
              <span className="font-bold text-red-300">Mistakes: {wrongClicks}</span>
            </div>
          )}
        </div>

        {/* Found Subjects Bar */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-12 bg-white/5 rounded-xl p-3 border border-white/10">
          {SCHOOL_SUBJECTS.map(subject => {
            const isFound = foundSubjects.has(subject.word);
            return (
              <div
                key={subject.word}
                className={`px-3 py-1 rounded-lg font-bold text-sm transition-all ${
                  isFound
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {isFound ? `${subject.icon} ${subject.word}` : '???'}
              </div>
            );
          })}
        </div>

        {/* Game Board */}
        <div className="relative flex-1 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl border-4 border-indigo-700 shadow-2xl overflow-hidden">
          {/* Dark classroom background */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 h-full">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="border-r border-b border-indigo-600/30" />
              ))}
            </div>
          </div>

          {/* Words */}
          {[...SCHOOL_SUBJECTS, ...DECOY_WORDS].map((item, index) => {
            const isSubject = SCHOOL_SUBJECTS.some(s => s.word === item.word);
            const isFound = foundSubjects.has(item.word);
            const isDecoy = !isSubject;

            return (
              <button
                key={item.word}
                disabled={completed}
                onClick={() => handleWordClick(item.word, isSubject)}
                className={`absolute font-bold text-lg transition-all duration-300 ${
                  isFound
                    ? 'bg-green-500 text-white scale-110 shadow-lg'
                    : isDecoy && wrongClicks > 0
                      ? 'bg-red-500/50 text-white opacity-60'
                      : 'bg-white text-indigo-900 hover:scale-105 hover:bg-yellow-300'
                } rounded-xl shadow-md px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.r}deg)`,
                }}
              >
                <span className="text-2xl mr-1">{item.icon}</span>
                {item.word}
              </button>
            );
          })}

          {/* Completion Overlay */}
          {allFound && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl animate-fadeIn">
              <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl text-center">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold text-indigo-700 m-0 mb-2">Excellent!</h3>
                <p className="text-gray-600">You found all the school subjects!</p>
                {wrongClicks === 0 && (
                  <p className="text-green-600 font-bold mt-2">Perfect! No mistakes! 🎯</p>
                )}
                {submitted && (
                  <div className="mt-3 text-sm text-green-600 font-semibold">✔ Results saved</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center mt-4">
          <button
            onClick={resetGame}
            className="px-6 py-2 rounded-xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-md"
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}