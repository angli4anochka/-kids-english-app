'use client';

import dynamic from 'next/dynamic';

const TeacherGroups = dynamic(() => import('../../../screens/TeacherGroups'), { ssr: false });

export default function TeacherGroupsPage() {
  return <TeacherGroups />;
}
