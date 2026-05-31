import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface StudentProgress {
  studentName: string;
  completedAt: string;
  score?: number;
}

interface Props {
  socket: Socket | null;
  isConnected: boolean;
  activityId: string;
  activityTitle: string;
}

/**
 * Panel that shows which students have completed the current activity
 * Displays on teacher's screen for interactive games
 */
const StudentActivityProgress: React.FC<Props> = ({ socket, isConnected, activityId, activityTitle }) => {
  const [completedStudents, setCompletedStudents] = useState<StudentProgress[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Clear when activity changes
    setCompletedStudents([]);

    const handleActivityComplete = (data: {
      activityId: string;
      studentName: string;
      score?: number;
      completedAt: string;
    }) => {
      console.log('[StudentActivityProgress] Received activity-completed:', data);

      if (data.activityId !== activityId) return;

      setCompletedStudents(prev => {
        // Check if student already completed
        if (prev.some(s => s.studentName === data.studentName)) {
          return prev;
        }

        return [...prev, {
          studentName: data.studentName,
          completedAt: data.completedAt,
          score: data.score,
        }];
      });
    };

    socket.on('activity-completed', handleActivityComplete);
    console.log('[StudentActivityProgress] Listening for activity-completed events on:', activityId);

    return () => {
      socket.off('activity-completed', handleActivityComplete);
    };
  }, [socket, isConnected, activityId]);

  if (completedStudents.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-600/95 text-white rounded-2xl shadow-2xl p-6 max-w-sm z-50 border-4 border-white">
      <div className="text-xl font-bold mb-3 flex items-center gap-2">
        ✅ Завершили задание
      </div>
      <div className="text-sm text-green-100 mb-4">
        {activityTitle}
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {completedStudents.map((student, index) => (
          <div
            key={index}
            className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur flex items-center justify-between animate-fadeIn"
          >
            <div>
              <div className="font-bold">{student.studentName}</div>
              <div className="text-xs text-green-100">
                {new Date(student.completedAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            {student.score !== undefined && (
              <div className="text-2xl font-bold">{student.score}</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-center text-green-100">
        Всего: {completedStudents.length}
      </div>
    </div>
  );
};

export default StudentActivityProgress;
