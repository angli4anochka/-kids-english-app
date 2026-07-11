'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/utils/routing-adapter';
import { normalizeAnswerDetails } from '../utils/resultDetails';

interface ActivityResult {
  id: string;
  student_id: string | null;
  student_name: string;
  activity_id: string;
  activity_title: string;
  order_index: number;
  results: AnswerDetail[];
  score: number;
  total: number;
}

interface StudentSummary {
  name: string;
  studentId: string | null;
  activities: ActivityResult[];
  totalWrong: number;
  totalCorrect: number;
  totalAnswered: number;
}

export default function TeacherLessonResultsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSessionId(params.get('sessionId'));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const res = await fetch(`/kids-api/spotlight/session-all-results?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.success) {
          const byStudent: Record<string, StudentSummary> = {};
          for (const row of data.data as ActivityResult[]) {
            const key = row.student_id || row.student_name;
            if (!byStudent[key]) {
              byStudent[key] = {
                name: row.student_name,
                studentId: row.student_id,
                activities: [],
                totalWrong: 0,
                totalCorrect: 0,
                totalAnswered: 0,
              };
            }
            const wrong = Math.max(0, row.total - row.score);
            byStudent[key].activities.push(row);
            byStudent[key].totalWrong += wrong;
            byStudent[key].totalCorrect += row.score;
            byStudent[key].totalAnswered += row.total;
          }
          setStudents(Object.values(byStudent).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-xl text-gray-600">Загрузка результатов...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Разбор ошибок</h1>
              <p className="text-gray-500 text-sm mt-1">
                {students.length === 0
                  ? 'Нет данных'
                  : `${students.length} ${students.length === 1 ? 'ученик' : students.length < 5 ? 'ученика' : 'учеников'}`}
              </p>
            </div>
            <button
              onClick={() => router.push('/teacher/lessons')}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition"
            >
              К урокам →
            </button>
          </div>
        </div>

        {students.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Нет результатов для этой сессии.
          </div>
        )}

        {students.map(student => {
          const isExp = expandedStudent === (student.studentId || student.name);
          const wrongActivities = student.activities.filter(a => (a.total - a.score) > 0);

          return (
            <div key={student.studentId || student.name} className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden">
              <button
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                onClick={() => setExpandedStudent(isExp ? null : (student.studentId || student.name))}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {student.name[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.totalCorrect}/{student.totalAnswered} верно
                      {student.totalWrong > 0 && (
                        <span className="text-red-500 ml-2">· {student.totalWrong} ошибок</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {student.totalWrong === 0 ? (
                    <span className="text-green-500 font-bold">🎉 Без ошибок</span>
                  ) : (
                    <span className="text-red-500 font-bold text-lg">{student.totalWrong}</span>
                  )}
                  <span className="text-gray-400 text-lg">{isExp ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExp && (
                <div className="border-t border-gray-100 px-6 pb-4 pt-3 space-y-4">
                  {wrongActivities.length === 0 ? (
                    <p className="text-green-600 font-medium">Все ответы верные!</p>
                  ) : (
                    wrongActivities.map(activity => {
                      const wrongCount = activity.total - activity.score;
                      const details = normalizeAnswerDetails(activity.results).filter(a => !a.isCorrect);
                      return (
                        <div key={activity.id}>
                          <h3 className="text-sm font-bold text-gray-700 mb-2">
                            {activity.activity_title || 'Упражнение'}
                            <span className="ml-2 text-gray-400 font-normal">{activity.score}/{activity.total}</span>
                          </h3>
                          {details.length > 0 ? (
                            <div className="space-y-1.5">
                              {details.map((answer, idx) => (
                                <div key={idx} className="bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 flex-wrap">
                                  <span className="text-gray-400">#{(answer.questionIndex ?? idx) + 1}</span>
                                  <span className="text-red-700 line-through">{answer.studentAnswer || '—'}</span>
                                  <span className="text-gray-300">→</span>
                                  <span className="text-green-700 font-semibold">{answer.sentence || answer.correctAnswer}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Ошибок: {wrongCount} из {activity.total} (детали не сохранены)</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => router.push('/teacher/lessons')}
          className="w-full mt-2 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg rounded-2xl transition"
        >
          ← К списку уроков
        </button>
      </div>
    </div>
  );
}
