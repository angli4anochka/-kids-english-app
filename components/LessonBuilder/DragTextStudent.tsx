import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface DragTextStudentProps {
  activityText: string;
  sessionId: string;
}

export default function DragTextStudent({ activityText, sessionId }: DragTextStudentProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  // Parse text to extract words
  const parseText = (text: string) => {
    const words: string[] = [];
    const regex = /\[([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      words.push(match[1]);
    }
    return words;
  };

  const correctWords = parseText(activityText);
  const shuffledWords = [...correctWords].sort(() => Math.random() - 0.5);

  // Join session on mount
  useEffect(() => {
    joinSession();
  }, []);

  const joinSession = async () => {
    if (!user?.id) return;

    try {
      await fetch(`/kids-api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id })
      });
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const handleDragStart = (word: string) => {
    setDraggedWord(word);
  };

  const handleDrop = (index: number) => {
    if (draggedWord && !isSubmitted) {
      setAnswers({ ...answers, [index]: draggedWord });
      setDraggedWord(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeAnswer = (index: number) => {
    const newAnswers = { ...answers };
    delete newAnswers[index];
    setAnswers(newAnswers);
  };

  const submitAnswers = async () => {
    // Calculate score
    let correctCount = 0;
    correctWords.forEach((word, index) => {
      if (answers[index] === word) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / correctWords.length) * 100);
    setScore(scorePercent);
    setIsSubmitted(true);

    // Send to server
    try {
      await fetch(`/kids-api/sessions/${sessionId}/participants/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answers,
          score: scorePercent,
          status: 'completed'
        })
      });
    } catch (error) {
      console.error('Error submitting answers:', error);
    }
  };

  // Get unused words (not yet placed in blanks)
  const usedWords = Object.values(answers);
  const availableWords = shuffledWords.filter(word => {
    const usedCount = usedWords.filter(w => w === word).length;
    const totalCount = correctWords.filter(w => w === word).length;
    return usedCount < totalCount;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-800 text-center">
                Перетащите слова на нужные места
              </h1>
              <p className="text-gray-600 text-center mt-2">
                {user?.displayName || 'Ученик'}
              </p>
            </div>

            {/* Available Words */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Доступные слова:
              </h2>
              <div className="flex flex-wrap gap-3">
                {availableWords.length > 0 ? (
                  availableWords.map((word, idx) => (
                    <div
                      key={`${word}-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(word)}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-lg font-semibold cursor-move hover:from-blue-600 hover:to-purple-600 transition transform hover:scale-105 shadow-lg"
                    >
                      {word}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">Все слова использованы</p>
                )}
              </div>
            </div>

            {/* Text with blanks */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="text-xl leading-relaxed">
                {activityText.split(/(\[[^\]]+\])/).map((part: string, idx: number) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    const blankIndex = Math.floor(
                      activityText.substring(0, activityText.indexOf(part)).split('[').length - 1
                    );

                    return (
                      <span key={idx} className="inline-block mx-1 align-middle">
                        <div
                          onDrop={() => handleDrop(blankIndex)}
                          onDragOver={handleDragOver}
                          className="inline-flex items-center justify-center min-w-[140px] h-12 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg px-3 relative"
                        >
                          {answers[blankIndex] ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-700">
                                {answers[blankIndex]}
                              </span>
                              <button
                                onClick={() => removeAnswer(blankIndex)}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Перетащите сюда</span>
                          )}
                        </div>
                      </span>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitAnswers}
              disabled={Object.keys(answers).length !== correctWords.length}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xl font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 shadow-xl"
            >
              {Object.keys(answers).length === correctWords.length
                ? 'Проверить ответы'
                : `Заполните все пропуски (${Object.keys(answers).length}/${correctWords.length})`}
            </button>
          </>
        ) : (
          // Results screen
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-6">
              {score! >= 80 ? '🎉' : score! >= 60 ? '😊' : '📚'}
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              {score! >= 80 ? 'Отлично!' : score! >= 60 ? 'Хорошо!' : 'Попробуй еще раз!'}
            </h1>
            <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-8">
              {score}%
            </p>

            {/* Show correct answers */}
            <div className="bg-gray-50 rounded-xl p-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">Правильные ответы:</h3>
              <div className="text-xl leading-relaxed">
                {activityText.split(/(\[[^\]]+\])/).map((part: string, idx: number) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    const word = part.slice(1, -1);
                    const blankIndex = Math.floor(
                      activityText.substring(0, activityText.indexOf(part)).split('[').length - 1
                    );
                    const isCorrect = answers[blankIndex] === word;

                    return (
                      <span
                        key={idx}
                        className={`inline-block mx-1 px-3 py-1 rounded font-semibold ${
                          isCorrect
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {word}
                        {isCorrect ? ' ✓' : ' ✗'}
                      </span>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                })}
              </div>
            </div>

            <p className="text-gray-600 mt-8 text-lg">
              Ждите следующей активности от учителя...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
