'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const WORDS = [
  'timetable', 'lesson', 'classroom', 'class', 'room', 'school'
];

const CARD_POSITIONS = [
  { x: 18, y: 36 },
  { x: 45, y: 28 },
  { x: 72, y: 38 },
  { x: 25, y: 68 },
  { x: 55, y: 62 },
  { x: 82, y: 65 },
];

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1SchoolIntro({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [revealedCards, setRevealedCards] = useState<boolean[]>(Array(WORDS.length).fill(false));
  const [completed, setCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const revealedCount = revealedCards.filter(Boolean).length;
  const allRevealed = revealedCount === WORDS.length;

  useEffect(() => {
    if (allRevealed && !completed) {
      setCompleted(true);
      // Auto-submit after showing success
      setTimeout(() => submitResults(), 1500);
    }
  }, [allRevealed, completed]);

  const submitResults = useCallback(async () => {
    if (submitted || isTeacher || !lessonId) return;

    const results = WORDS.map((word, index) => ({
      questionIndex: index,
      correctAnswer: word,
      studentAnswer: revealedCards[index] ? word : 'not revealed',
      isCorrect: revealedCards[index],
      sentence: word,
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
          score: revealedCount,
          total: WORDS.length,
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  }, [submitted, isTeacher, lessonId, activityId, sessionId, user, revealedCount, revealedCards]);

  const handleCardClick = useCallback((index: number) => {
    if (revealedCards[index]) return;

    const newRevealed = [...revealedCards];
    newRevealed[index] = true;
    setRevealedCards(newRevealed);
  }, [revealedCards]);

  const resetGame = useCallback(() => {
    setRevealedCards(Array(WORDS.length).fill(false));
    setCompleted(false);
    setSubmitted(false);
  }, []);

  return (
    <div className="flex h-full select-none overflow-hidden" style={{
      background: 'radial-gradient(circle at 20% 30%, rgba(79, 209, 197, 0.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.12), transparent 35%), #f0f9ff',
      fontFamily: '"Comic Sans MS", "Trebuchet MS", Arial, sans-serif'
    }}>
      {/* Main Game Area */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-orange-100 to-amber-50 border-2 border-orange-300 rounded-2xl px-6 py-3 inline-block shadow-md">
            <h2 className="text-2xl font-bold text-orange-700 m-0">🏫 School Words</h2>
            <p className="text-sm text-gray-600 mt-1">Scratch the cards and read the words!</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-orange-200">
            <span className="font-bold text-orange-700">Progress: {revealedCount} / {WORDS.length}</span>
          </div>
          <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
              style={{ width: `${(revealedCount / WORDS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Game Board */}
        <div className="relative flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-4 border-blue-300 shadow-xl overflow-hidden">
          {/* Classroom Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-6 h-full">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-r border-b border-blue-400" />
              ))}
            </div>
          </div>

          {/* Cards */}
          {WORDS.map((word, index) => {
            const { x, y } = CARD_POSITIONS[index];
            const isRevealed = revealedCards[index];

            return (
              <div
                key={index}
                className="absolute cursor-pointer transition-all duration-300"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleCardClick(index)}
              >
                <div className={`relative w-24 h-14 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                  isRevealed
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-green-400 shadow-lg'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400 border-4 border-gray-500 shadow-md hover:shadow-lg hover:scale-105'
                }`}>
                  {isRevealed ? (
                    <span className="text-green-700">{word}</span>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-silver-200 to-silver-400 rounded-lg">
                      <div className="absolute inset-2 border-2 border-dashed border-silver-500 rounded opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Success Message */}
          {allRevealed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl animate-fadeIn">
              <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-600 m-0 mb-2">Amazing!</h3>
                <p className="text-gray-600">You found all the school words!</p>
                {submitted && (
                  <div className="mt-3 text-sm text-green-600 font-semibold">✔ Results saved</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={resetGame}
            className="px-6 py-2 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition shadow-md"
          >
            🔄 Reset Game
          </button>
        </div>
      </div>
    </div>
  );
}