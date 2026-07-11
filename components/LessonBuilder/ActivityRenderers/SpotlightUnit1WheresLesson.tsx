'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const LESSONS = [
  { question: "Maths lesson?", answer: "Room D", room: "D" },
  { question: "English lesson?", answer: "Room C", room: "C" },
  { question: "Science lesson?", answer: "Room A", room: "A" },
  { question: "Art lesson?", answer: "Room B", room: "B" },
  { question: "Music lesson?", answer: "Room E", room: "E" },
];

const ROOMS = ["Room A", "Room B", "Room C", "Room D", "Room E"];

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1WheresLesson({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [currentLesson, setCurrentLesson] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === LESSONS.length;

  const correctCount = Object.entries(answers).filter(
    ([lessonIndex, room]) => LESSONS[parseInt(lessonIndex)].room === room.replace("Room ", "")
  ).length;

  useEffect(() => {
    if (allAnswered && !completed) {
      setCompleted(true);
      setTimeout(() => submitResults(), 1500);
    }
  }, [allAnswered, completed]);

  const submitResults = useCallback(async () => {
    if (submitted || isTeacher || !lessonId) return;

    const results = LESSONS.map((lesson, index) => {
      const answer = answers[index];
      const isCorrect = lesson.room === answer?.replace("Room ", "");

      return {
        questionIndex: index,
        correctAnswer: lesson.answer,
        studentAnswer: answer || 'not answered',
        isCorrect,
        sentence: `${lesson.question} → ${lesson.answer}`,
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
          total: LESSONS.length,
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  }, [submitted, isTeacher, lessonId, activityId, sessionId, user, answers]);

  const handleAnswer = useCallback((room: string) => {
    if (completed || answers[currentLesson]) return;

    setAnswers(prev => ({
      ...prev,
      [currentLesson]: room
    }));

    // Move to next unanswered lesson
    const nextUnanswered = LESSONS.findIndex((_, index) => !answers[index] && index > currentLesson);
    if (nextUnanswered !== -1) {
      setCurrentLesson(nextUnanswered);
    }
  }, [currentLesson, answers, completed]);

  const resetGame = useCallback(() => {
    setAnswers({});
    setCurrentLesson(0);
    setCompleted(false);
    setSubmitted(false);
  }, []);

  const currentLessonData = LESSONS[currentLesson];
  const currentAnswer = answers[currentLesson];
  const isCurrentCorrect = currentAnswer === currentLessonData?.answer;

  return (
    <div className="flex h-full select-none overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      fontFamily: '"Comic Sans MS", "Trebuchet MS", Arial, sans-serif'
    }}>
      {/* Game Area */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 inline-block shadow-xl">
            <h2 className="text-2xl font-bold text-white m-0">🏫 Where's the Lesson?</h2>
            <p className="text-sm text-pink-100 mt-1">Match lessons to rooms!</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
            <span className="font-bold text-white">Progress: {answeredCount} / {LESSONS.length}</span>
          </div>
        </div>

        {/* Lesson Progress */}
        <div className="flex gap-2 mb-4 justify-center">
          {LESSONS.map((_, index) => {
            const isAnswered = answers[index];
            const isCurrent = index === currentLesson;

            return (
              <div
                key={index}
                onClick={() => !completed && setCurrentLesson(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-white text-pink-600 scale-110 shadow-lg'
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

        {/* Question Card */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full">
            {/* Question */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-3xl font-bold text-pink-600 m-0 mb-2">
                {currentLessonData?.question}
              </h3>
              <p className="text-gray-500 text-lg">Where is this lesson?</p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {ROOMS.map(room => {
                const isSelected = currentAnswer === room;
                const isThisCorrect = room === currentLessonData?.answer;

                return (
                  <button
                    key={room}
                    disabled={!!currentAnswer || completed}
                    onClick={() => handleAnswer(room)}
                    className={`p-4 rounded-xl font-bold text-lg transition-all ${
                      currentAnswer === room
                        ? isThisCorrect
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-red-500 text-white shadow-lg scale-105'
                        : !currentAnswer && !completed
                          ? 'bg-pink-100 text-pink-700 hover:bg-pink-200 hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    🚪 {room}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {currentAnswer && (
              <div className={`text-center p-4 rounded-xl ${
                isCurrentCorrect ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className="font-bold text-lg mb-1">
                  {isCurrentCorrect ? '✓ Correct!' : '✗ Try again!'}
                </div>
                {!isCurrentCorrect && (
                  <div className="text-sm text-gray-600">
                    Correct answer: {currentLessonData?.answer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Completion Message */}
        {allAnswered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl animate-fadeIn">
            <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-pink-700 m-0 mb-2">Complete!</h3>
              <p className="text-gray-600">You answered all questions!</p>
              <div className="mt-3 text-lg font-bold text-green-600">
                Score: {correctCount} / {LESSONS.length} correct
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
            className="px-6 py-2 rounded-xl font-bold bg-pink-500 text-white hover:bg-pink-600 transition shadow-md"
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}