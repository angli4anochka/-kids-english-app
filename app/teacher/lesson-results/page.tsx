'use client';

import dynamic from 'next/dynamic';

const TeacherLessonResultsScreen = dynamic(() => import('../../../screens/TeacherLessonResultsScreen'), { ssr: false });

export default function TeacherLessonResultsPage() {
  return <TeacherLessonResultsScreen />;
}
