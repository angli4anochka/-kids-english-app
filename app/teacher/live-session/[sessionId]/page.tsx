'use client';

import { use } from 'react';
import TeacherLiveSession from '../../../../screens/TeacherLiveSession';

export default function LiveSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  return <TeacherLiveSession sessionId={sessionId} />;
}
