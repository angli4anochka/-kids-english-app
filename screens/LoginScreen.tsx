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
          <>
            {/* Google Sign In Divider */}
            <div className="mt-6 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">или</span>
                </div>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={() => {
                // Redirect to Google OAuth
                const redirectUri = encodeURIComponent(`https://tutorsdesk.ru/kids-app/auth/google/callback`);
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
                const scope = encodeURIComponent('email profile');
                const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
                window.location.href = googleAuthUrl;
              }}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition border-2 border-gray-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Войти через Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Нет аккаунта?{' '}
                <Link href="/register" className="text-purple-500 hover:text-purple-600 font-semibold">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </>
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
