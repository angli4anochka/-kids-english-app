'use client';

import dynamic from 'next/dynamic';

const StudentProfileScreen = dynamic(() => import('../../../screens/StudentProfileScreen'), { ssr: false });

export default function StudentProfilePage() {
  return <StudentProfileScreen />;
}
