'use client';
import { use } from 'react';
import dynamic from 'next/dynamic';

const BookScreen = dynamic(() => import('../../../../../screens/BookScreen'), { ssr: false });

export default function BookPage({ params }: { params: Promise<{ courseId: string; bookId: string }> }) {
  const { courseId, bookId } = use(params);
  return <BookScreen courseId={courseId} bookId={bookId} />;
}
