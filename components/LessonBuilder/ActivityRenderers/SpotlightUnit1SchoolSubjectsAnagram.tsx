'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const WORDS = [
  { word: 'music', scrambled: 'muis', hint: '🎵' },
  { word: 'english', scrambled: 'glienhs', hint: '📖' },
  { word: 'maths', scrambled: 'mths', hint: '➗' },
  { word: 'science', scrambled: 'cinecse', hint: '🔬' },
  { word: 'history', scrambled: 'toryhis', hint: '🏛️' },
  { word: 'art', scrambled: 'tar', hint: '🎨' },
  { word: 'geography', scrambled: 'ggpyaroh', hint: '🌍' },
  { word: 'it', scrambled: 'ti', hint: '💻' },
  { word: 'pe', scrambled: 'ep', hint: '⚽' },
];

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1SchoolSubjectsAnagram({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [currentWord, setCurrentWord] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === WORDS.length;

  const currentWordData = WORDS[currentWord];
  const currentAttempts = attempts[currentWord] || 0;
  const isCurrentAnswered = answers[currentWord];

  const correctCount = Object.entries(answers).filter(
    ([wordIndex, answer]) => WORDS[parseInt(wordIndex)].word.toLowerCase() === answer.toLowerCase()
  ).length;

  useEffect(() => {
    if (allAnswered && !completed) {
      setCompleted(true);
      setTimeout(() => submitResults(), 1500);
    }
  }, [allAnswered, completed]);

  const submitResults = useCallback(async () => {
    if (submitted || isTeacher || !lessonId) return;

    const results = WORDS.map((wordData, index) => {
      const answer = answers[index];
      const isCorrect = wordData.word.toLowerCase() === answer?.toLowerCase();

      return {
        questionIndex: index,
        correctAnswer: wordData.word,
        studentAnswer: answer || 'not answered',
        isCorrect,
        sentence: `${wordData.hint} ${wordData.word}`,
      };
    });

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
          score: correctCount,
          total: WORDS.length,
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  }, [submitted, isTeacher, lessonId, activityId, sessionId, user, answers]);

  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim() || isCurrentAnswered || completed) return;

    const isCorrect = userAnswer.toLowerCase() === currentWordData.word.toLowerCase();

    setAnswers(prev => ({
      ...prev,
      [currentWord]: userAnswer
    }));

    setAttempts(prev => ({
      ...prev,
      [currentWord]: currentAttempts + 1
    }));

    // Move to next unanswered word
    const nextUnanswered = WORDS.findIndex((_, index) => !answers[index] && index > currentWord);
    if (nextUnanswered !== -1) {
      setTimeout(() => {
        setCurrentWord(nextUnanswered);
        setUserAnswer('');
      }, 1000);
    } else {
      setUserAnswer('');
    }
  }, [userAnswer, currentWord, currentWordData, currentAttempts, isCurrentAnswered, completed, answers]);

  const skipWord = useCallback(() => {
    if (completed) return;

    const nextUnanswered = WORDS.findIndex((_, index) => !answers[index] && index > currentWord);
    if (nextUnanswered !== -1) {
      setCurrentWord(nextUnanswered);
      setUserAnswer('');
    }
  }, [completed, answers, currentWord]);

  const resetGame = useCallback(() => {
    setAnswers({});
    setCurrentWord(0);
    setUserAnswer('');
    setAttempts({});
    setCompleted(false);
    setSubmitted(false);
  }, []);

  return (
    <div className="flex h-full select-none overflow-hidden" style={{
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      fontFamily: '"Comic Sans MS", "Trebuchet MS", Arial, sans-serif'
    }}>
      {/* Game Area */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 inline-block shadow-xl">
            <h2 className="text-2xl font-bold text-white m-0">🔤 School Anagrams</h2>
            <p className="text-sm text-teal-100 mt-1">Unscramble the school subjects!</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
            <span className="font-bold text-white">Progress: {answeredCount} / {WORDS.length}</span>
          </div>
        </div>

        {/* Word Progress */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {WORDS.map((_, index) => {
            const isAnswered = answers[index];
            const isCurrent = index === currentWord;

            return (
              <div
                key={index}
                onClick={() => !completed && !answers[index] && setCurrentWord(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-white text-teal-600 scale-110 shadow-lg'
                    : isAnswered
                      ? 'bg-green-500 text-white'
                      : 'bg-white/30 text-white'
                }`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>

        {/* Anagram Card */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full">
            {/* Scrambled Word */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{currentWordData?.hint}</div>
              <h3 className="text-4xl font-bold text-teal-600 m-0 mb-2 tracking-wider">
                {currentWordData?.scrambled.toUpperCase()}
              </h3>
              <p className="text-gray-500 text-lg">Unscramble this school subject!</p>
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={!!isCurrentAnswered || completed}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="Type your answer..."
                className={`w-full text-center text-2xl font-bold p-4 rounded-xl border-4 ${
                  isCurrentAnswered
                    ? userAnswer.toLowerCase() === currentWordData?.word.toLowerCase()
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-red-100 border-red-400 text-red-700'
                    : 'bg-white border-teal-300 text-teal-700 focus:border-teal-500'
                }`}
                style={{ fontFamily: '"Comic Sans MS", cursive' }}
              />
            </div>

            {/* Feedback */}
            {isCurrentAnswered && (
              <div className={`text-center p-4 rounded-xl mb-4 ${
                userAnswer.toLowerCase() === currentWordData?.word.toLowerCase()
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}>
                <div className="font-bold text-lg mb-1">
                  {userAnswer.toLowerCase() === currentWordData?.word.toLowerCase()
                    ? '✓ Correct!'
                    : '✗ Try again!'}
                </div>
                {userAnswer.toLowerCase() !== currentWordData?.word.toLowerCase() && (
                  <div className="text-sm text-gray-600">
                    Correct answer: {currentWordData?.word}
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={checkAnswer}
                disabled={!userAnswer.trim() || !!isCurrentAnswered || completed}
                className="px-6 py-3 rounded-xl font-bold bg-teal-500 text-white hover:bg-teal-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Check
              </button>
              <button
                onClick={skipWord}
                disabled={completed}
                className="px-6 py-3 rounded-xl font-bold bg-gray-400 text-white hover:bg-gray-500 transition shadow-md disabled:opacity-50"
              >
                → Skip
              </button>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {allAnswered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl animate-fadeIn">
            <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-teal-700 m-0 mb-2">Anagrams Complete!</h3>
              <p className="text-gray-600">You solved all the puzzles!</p>
              <div className="mt-3 text-lg font-bold text-green-600">
                Score: {correctCount} / {WORDS.length} correct
              </div>
              {submitted && (
                <div className="mt-2 text-sm text-green-600 font-semibold">✔ Results saved</div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center mt-4">
          <button
            onClick={resetGame}
            className="px-6 py-2 rounded-xl font-bold bg-teal-500 text-white hover:bg-teal-600 transition shadow-md"
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}