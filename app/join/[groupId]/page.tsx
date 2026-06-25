'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const COLORS = [
  'from-pink-400 to-rose-500',
  'from-purple-400 to-violet-500',
  'from-blue-400 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-yellow-400 to-orange-500',
  'from-teal-400 to-cyan-600',
  'from-indigo-400 to-purple-600',
  'from-red-400 to-pink-500',
];

interface Student {
  id: number;
  student_name: string;
  login: string;
}

export default function JoinGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [groupName, setGroupName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    fetch(`/kids-api/groups/${groupId}/join-info`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setGroupName(d.data.group.name);
          setStudents(d.data.students);
        }
      })
      .finally(() => setIsLoading(false));
  }, [groupId]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setPin(['', '', '', '']);
    setError('');
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
    if (newPin.every(d => d !== '') && newPin[index] !== '') {
      handleLogin(newPin.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async (pinCode: string) => {
    if (!selectedStudent) return;
    setIsLoggingIn(true);
    setError('');
    try {
      const res = await fetch('/kids-api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: selectedStudent.login, password: pinCode }),
      });
      const data = await res.json();
      if (!data.success) {
        setError('Неверный код');
        setPin(['', '', '', '']);
        setTimeout(() => pinRefs[0].current?.focus(), 100);
        return;
      }
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('authUser', JSON.stringify(data.data.user));
      router.push('/map');
    } catch {
      setError('Ошибка входа');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏫</div>
          <h1 className="text-3xl font-bold text-gray-800">{groupName}</h1>
          <p className="text-gray-500 mt-1">Выбери своё имя</p>
        </div>

        {!selectedStudent ? (
          /* Student list */
          <div className="grid grid-cols-2 gap-4">
            {students.map((student, idx) => (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className={`bg-gradient-to-br ${COLORS[idx % COLORS.length]} text-white font-bold text-xl rounded-2xl py-6 px-4 shadow-lg hover:scale-105 active:scale-95 transition-transform`}
              >
                {student.student_name}
              </button>
            ))}
          </div>
        ) : (
          /* PIN input */
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <button
              onClick={() => { setSelectedStudent(null); setPin(['', '', '', '']); setError(''); }}
              className="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1 mx-auto"
            >
              ← Назад
            </button>
            <div className="text-5xl mb-3">👤</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedStudent.student_name}</h2>
            <p className="text-gray-500 mb-6">Введи свой код</p>

            <div className="flex justify-center gap-3 mb-4">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinInput(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  className="w-16 h-16 text-center text-3xl font-bold border-4 border-gray-200 rounded-2xl focus:border-purple-400 focus:outline-none transition"
                />
              ))}
            </div>

            {error && <p className="text-red-500 font-semibold mb-3">{error} ❌</p>}
            {isLoggingIn && <p className="text-purple-500">Входим...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
