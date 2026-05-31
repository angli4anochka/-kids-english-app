import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface StudentProgress {
  studentId: string;
  displayName: string;
  activityIndex: number;
  score: number;
  completed: boolean;
  lastUpdate: Date;
}

interface StudentProgressPanelProps {
  socket: Socket | null;
  isConnected: boolean;
  totalActivities: number;
}

export default function StudentProgressPanel({ socket, isConnected, totalActivities }: StudentProgressPanelProps) {
  const [students, setStudents] = useState<Map<string, StudentProgress>>(new Map());

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStudentProgress = (data: {
      studentId: string;
      displayName: string;
      activityIndex: number;
      score: number;
      completed: boolean;
    }) => {
      setStudents(prev => {
        const newMap = new Map(prev);
        newMap.set(data.studentId, {
          ...data,
          lastUpdate: new Date()
        });
        return newMap;
      });
    };

    socket.on('student-progress', handleStudentProgress);

    return () => {
      socket.off('student-progress', handleStudentProgress);
    };
  }, [socket, isConnected]);

  if (!isConnected || students.size === 0) {
    return null;
  }

  const studentsArray = Array.from(students.values());

  return (
    <div className="fixed right-4 top-20 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-40 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3">
        <h3 className="font-bold text-lg">Прогресс учеников</h3>
        <p className="text-xs opacity-90">{students.size} активных</p>
      </div>

      {/* Students List */}
      <div className="overflow-y-auto flex-1">
        {studentsArray.map((student) => {
          const progress = totalActivities > 0
            ? Math.round((student.activityIndex / totalActivities) * 100)
            : 0;

          const isRecent = new Date().getTime() - student.lastUpdate.getTime() < 5000;

          return (
            <div
              key={student.studentId}
              className={`border-b border-gray-200 p-4 transition-all ${
                isRecent ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Student Name */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isRecent ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <span className="font-semibold text-gray-800 text-sm">
                    {student.displayName}
                  </span>
                </div>
                {student.completed && (
                  <span className="text-green-600 text-lg" title="Урок завершён">
                    ✓
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Активность {student.activityIndex + 1} из {totalActivities}</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      student.completed
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Score */}
              {student.score > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-600">⭐</span>
                  <span className="text-gray-600">
                    Баллы: <span className="font-semibold text-gray-800">{student.score}</span>
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="mt-1 text-xs text-gray-500">
                {student.completed ? (
                  <span className="text-green-600 font-semibold">Завершил урок</span>
                ) : (
                  <span>В процессе...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {studentsArray.filter(s => s.completed).length}
            </div>
            <div className="text-gray-600">Завершили</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {studentsArray.filter(s => !s.completed).length}
            </div>
            <div className="text-gray-600">В процессе</div>
          </div>
        </div>
      </div>
    </div>
  );
}
