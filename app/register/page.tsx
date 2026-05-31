'use client';

import dynamic from 'next/dynamic';

const RegisterScreen = dynamic(() => import('../../screens/RegisterScreen'), { ssr: false });

export default function RegisterPage() {
  return <RegisterScreen />;
}
