'use client';

import dynamic from 'next/dynamic';

const TeacherDashboard = dynamic(() => import('../../../screens/TeacherDashboard'), { ssr: false });

export default function TeacherDashboardPage() {
  return <TeacherDashboard />;
}
