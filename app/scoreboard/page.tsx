'use client';

import dynamic from 'next/dynamic';

const ScoreboardScreen = dynamic(() => import('../../screens/ScoreboardScreen'), { ssr: false });

export default function ScoreboardPage() {
  return <ScoreboardScreen />;
}
