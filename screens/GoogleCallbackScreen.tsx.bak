import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';

export default function GoogleCallbackScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Вход отменен или произошла ошибка');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setError('Код авторизации не получен');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Send code to backend for verification
        await loginWithGoogle(code);
        navigate('/teacher/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка входа через Google');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Вход через Google...
            </h2>
            <p className="text-gray-600">Пожалуйста, подождите</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Ошибка входа
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Перенаправление на страницу входа...</p>
          </>
        )}
      </div>
    </div>
  );
}
