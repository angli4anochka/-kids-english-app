'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const LessonBuilderScreen = dynamic(() => import('../../../../../screens/LessonBuilderScreen'), { ssr: false });

export default function LessonEditPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  return <LessonBuilderScreen lessonId={lessonId} />;
}
