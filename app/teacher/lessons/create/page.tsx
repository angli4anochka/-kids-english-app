'use client';

import dynamic from 'next/dynamic';

const LessonBuilderScreen = dynamic(() => import('../../../../screens/LessonBuilderScreen'), { ssr: false });

export default function LessonCreatePage() {
  return <LessonBuilderScreen />;
}
