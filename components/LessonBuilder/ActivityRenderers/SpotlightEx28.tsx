'use client';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightEx28({ }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe src="/spotlight/ex28.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} scrolling="no" />
    </div>
  );
}
