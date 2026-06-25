'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SpotlightStudentHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (!user?.id || user.role !== 'student') {
        router.push('/login');
        return;
      }
      setUserName(user.displayName || '');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-green-100 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">📚</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          {userName ? `Привет, ${userName}!` : 'Привет!'}
        </h1>
        <p className="text-xl text-gray-600 mb-2">Добро пожаловать в</p>
        <h2 className="text-3xl font-bold text-orange-500 mb-8">Spotlight</h2>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-gray-500">
          <div className="text-5xl mb-4">🚧</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">Скоро здесь будут твои уроки!</p>
          <p className="text-sm">Учитель скоро откроет для тебя задания</p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            router.push('/login');
          }}
          className="mt-8 text-gray-400 hover:text-gray-600 text-sm transition"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
