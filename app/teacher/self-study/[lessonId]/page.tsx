'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const HskSelfStudyScreen = dynamic(() => import('../../../../screens/HskSelfStudyScreen'), { ssr: false });

export default function HskSelfStudyPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  return <HskSelfStudyScreen lessonId={lessonId} />;
}
