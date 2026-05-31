'use client';

import dynamic from 'next/dynamic';

const LessonsListScreen = dynamic(() => import('../../../screens/LessonsListScreen'), { ssr: false });

export default function TeacherLessonsPage() {
  return <LessonsListScreen />;
}
