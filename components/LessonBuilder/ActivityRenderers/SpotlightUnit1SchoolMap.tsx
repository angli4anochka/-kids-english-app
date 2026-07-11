'use client';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1SchoolMap({ isTeacher, lessonId, activityId, sessionId }: Props) {
  return (
    <div className="w-full h-full">
      <iframe
        src="/games/school_map_drag_drop.html"
        className="w-full h-full border-0"
        title="School Map Drag and Drop"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      />
    </div>
  );
}
    }
  ).length;

  useEffect(() => {
    if (allPlaced && !completed) {
      setCompleted(true);
      setTimeout(() => submitResults(), 1500);
    }
  }, [allPlaced, completed]);

  const submitResults = useCallback(async () => {
    if (submitted || isTeacher || !lessonId) return;

    const results = SUBJECTS.map((subject, index) => {
      const roomId = placedSubjects[subject.id];
      const room = ROOMS.find(r => r.id === roomId);
      const isCorrect = room?.subjectId === subject.id;

      return {
        questionIndex: index,
        correctAnswer: `${subject.icon} ${subject.name}`,
        studentAnswer: room ? room.name : 'not placed',
        isCorrect,
        sentence: `${subject.icon} ${subject.name} → ${isCorrect ? '✓' : '✗'} ${room?.name || 'not placed'}`,
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
          total: SUBJECTS.length,
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  }, [submitted, isTeacher, lessonId, activityId, sessionId, user, placedSubjects]);

  const handleDragStart = useCallback((subjectId: string) => {
    setDraggingId(subjectId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleDrop = useCallback((roomId: string, subjectId: string) => {
    if (completed) return;

    // Remove subject from previous room if placed
    const newPlaced = { ...placedSubjects };
    delete Object.keys(newPlaced).find(key => newPlaced[key] === roomId);

    // Place subject in room
    newPlaced[subjectId] = roomId;
    setPlacedSubjects(newPlaced);
  }, [placedSubjects, completed]);

  const resetGame = useCallback(() => {
    setPlacedSubjects({});
    setCompleted(false);
    setSubmitted(false);
  }, []);

  const unplacedSubjects = SUBJECTS.filter(s => !placedSubjects[s.id]);

  return (
    <div className="flex h-full select-none overflow-hidden" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '"Comic Sans MS", "Trebuchet MS", Arial, sans-serif'
    }}>
      {/* Game Area */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 inline-block shadow-xl">
            <h2 className="text-2xl font-bold text-white m-0">🗺️ School Map</h2>
            <p className="text-sm text-purple-100 mt-1">Drag subjects to their rooms!</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
            <span className="font-bold text-white">Placed: {placedCount} / {SUBJECTS.length}</span>
          </div>
          {allPlaced && (
            <div className="bg-green-500/30 backdrop-blur rounded-xl px-4 py-2">
              <span className="font-bold text-green-200">Correct: {correctCount} / {SUBJECTS.length}</span>
            </div>
          )}
        </div>

        {/* School Map */}
        <div className="relative flex-1 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-4 border-purple-300 shadow-2xl overflow-hidden">
          {/* School Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-10 h-full">
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="border-r border-b border-purple-400/30" />
              ))}
            </div>
          </div>

          {/* Rooms */}
          {ROOMS.map(room => {
            const placedSubjectId = Object.keys(placedSubjects).find(
              id => placedSubjects[id] === room.id
            );
            const placedSubject = SUBJECTS.find(s => s.id === placedSubjectId);
            const isCorrect = placedSubject?.id === room.subjectId;
            const isEmpty = !placedSubject;

            return (
              <div
                key={room.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const subjectId = e.dataTransfer.getData('subjectId');
                  handleDrop(room.id, subjectId);
                }}
                className={`absolute border-4 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isEmpty
                    ? 'bg-white/60 border-purple-300 border-dashed'
                    : isCorrect
                      ? 'bg-green-100 border-green-400'
                      : 'bg-red-100 border-red-400'
                }`}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: room.id === 'english' || room.id === 'maths' ? '24%' : '20%',
                  height: '18%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="text-center p-2">
                  {isEmpty ? (
                    <>
                      <div className="text-2xl mb-1">🏫</div>
                      <div className="text-xs font-bold text-purple-700">{room.name}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-1">{placedSubject.icon}</div>
                      <div className="text-sm font-bold text-purple-900">{placedSubject.name}</div>
                      <div className={`text-xs mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✓ Correct!' : '✗ Try again'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Completion Message */}
          {allPlaced && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl animate-fadeIn">
              <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl text-center">
                <div className="text-6xl mb-4">🏫</div>
                <h3 className="text-2xl font-bold text-purple-700 m-0 mb-2">School Map Complete!</h3>
                <p className="text-gray-600">You placed all the subjects!</p>
                <div className="mt-3 text-lg font-bold text-green-600">
                  Score: {correctCount} / {SUBJECTS.length} correct
                </div>
                {submitted && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">✔ Results saved</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subject Cards */}
        <div className="mt-4 bg-white/20 backdrop-blur rounded-xl p-3 border border-white/30">
          <div className="text-center text-sm font-bold text-purple-100 mb-2">
            Unplaced Subjects:
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {unplacedSubjects.map(subject => (
              <div
                key={subject.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('subjectId', subject.id);
                  handleDragStart(subject.id);
                }}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-lg px-3 py-2 cursor-grab shadow-md hover:shadow-lg hover:scale-105 transition-all ${
                  draggingId === subject.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{subject.icon}</span>
                  <span className="font-bold text-purple-900">{subject.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center mt-4">
          <button
            onClick={resetGame}
            className="px-6 py-2 rounded-xl font-bold bg-purple-500 text-white hover:bg-purple-600 transition shadow-md"
          >
            🔄 Reset Map
          </button>
        </div>
      </div>
    </div>
  );
}