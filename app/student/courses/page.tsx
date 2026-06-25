'use client';

import dynamic from 'next/dynamic';

const StudentCoursesScreen = dynamic(() => import('../../../screens/StudentCoursesScreen'), { ssr: false });

export default function StudentCoursesPage() {
  return <StudentCoursesScreen />;
}
