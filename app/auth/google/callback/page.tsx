'use client';

import dynamic from 'next/dynamic';

const GoogleCallbackScreen = dynamic(() => import('../../../../screens/GoogleCallbackScreen'), { ssr: false });

export default function GoogleCallbackPage() {
  return <GoogleCallbackScreen />;
}
