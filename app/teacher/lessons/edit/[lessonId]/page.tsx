'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LessonBuilderScreen = dynamic(() => import('../../../../../screens/LessonBuilderScreen'), { ssr: false });

export default function LessonEditPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();

  useEffect(() => {
    // LessonBuilder reads lessonId only from searchParams, redirect to correct URL
    if (lessonId && typeof window !== 'undefined') {
      const currentSearch = window.location.search;
      if (!currentSearch.includes('lessonId=')) {
        router.replace(`/teacher/lessons/edit/${lessonId}?lessonId=${lessonId}`);
      }
    }
  }, [lessonId, router]);

  return <LessonBuilderScreen lessonId={lessonId} />;
}
