'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useNavigate } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, loginStudent } = useAuth();
  const [userType, setUserType] = useState<'teacher' | 'student'>('student'); // Default to student
  const [email, setEmail] = useState('');
  const [studentLogin, setStudentLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (userType === 'teacher') {
        const user = await login(email, password);
        if (user && user.role === 'teacher') {
          navigate('/teacher/dashboard');
        }
      } else {
        const user = await loginStudent(studentLogin, password);
        if (user && user.role === 'student') {
          navigate('/map');
        }
      }
    } catch (err) {
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
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              userType === 'student'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            👨‍🎓 Ученик
          </button>
          <button
            type="button"
            onClick={() => setUserType('teacher')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              userType === 'teacher'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            👨‍🏫 Учитель
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {userType === 'teacher' ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder=""
              />
            </div>
          ) : (
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <input
                id="login"
                type="text"
                value={studentLogin}
                onChange={(e) => setStudentLogin(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder=""
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
              userType === 'teacher'
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {userType === 'teacher' && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-purple-500 hover:text-purple-600 font-semibold">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link href="/map" className="text-sm text-gray-500 hover:text-gray-700">
            ← Вернуться к карте
          </Link>
        </div>
      </div>
    </div>
  );
}
