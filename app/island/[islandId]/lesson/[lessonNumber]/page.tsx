'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const LessonScreen = dynamic(() => import('../../../../../screens/LessonScreen'), { ssr: false });

export default function LessonPage({ params }: { params: Promise<{ islandId: string; lessonNumber: string }> }) {
  const { islandId, lessonNumber } = use(params);
  return <LessonScreen islandId={islandId} lessonNumber={lessonNumber} />;
}
