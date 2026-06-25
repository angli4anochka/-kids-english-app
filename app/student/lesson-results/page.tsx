'use client';

import dynamic from 'next/dynamic';

const LessonResultsScreen = dynamic(() => import('../../../screens/LessonResultsScreen'), { ssr: false });

export default function LessonResultsPage() {
  return <LessonResultsScreen />;
}
