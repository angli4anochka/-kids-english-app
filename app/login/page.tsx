'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginStudent } = useAuth();
  const [userType, setUserType] = useState<'teacher' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [studentLogin, setStudentLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing auth on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Clear old auth before new login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }

      if (userType === 'teacher') {
        const user = await login(email, password);
        
        if (user.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          throw new Error('Invalid user role');
        }
      } else {
        const user = await loginStudent(studentLogin, password);
        
        if (user.role === 'student') {
          router.push('/map');
        } else {
          throw new Error('Invalid user role');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Вход</h1>
          <p className="text-gray-600">
            {userType === 'teacher' ? 'Войдите как учитель' : 'Войдите как ученик'}
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              userType === 'student'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Ученик
          </button>
          <button
            type="button"
            onClick={() => setUserType('teacher')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              userType === 'teacher'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Учитель
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {userType === 'teacher' ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="teacher@example.com"
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="studentLogin" className="block text-sm font-medium text-gray-700 mb-1">
                Логин ученика
              </label>
              <input
                id="studentLogin"
                type="text"
                value={studentLogin}
                onChange={(e) => setStudentLogin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Sasha"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {userType === 'teacher' && (
          <div className="mt-6 text-center">
            <Link
              href="/register"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Нет аккаунта? Зарегистрироваться
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
