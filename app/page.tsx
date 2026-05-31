'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/map');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🚀</div>
        <p className="text-xl font-semibold text-gray-600 animate-pulse">Загрузка...</p>
      </div>
    </div>
  );
}
