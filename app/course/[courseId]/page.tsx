'use client';
import { use } from 'react';
import dynamic from 'next/dynamic';

const CourseScreen = dynamic(() => import('../../../screens/CourseScreen'), { ssr: false });

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  return <CourseScreen courseId={courseId} />;
}
