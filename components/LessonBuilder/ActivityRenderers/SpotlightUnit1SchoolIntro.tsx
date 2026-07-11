'use client';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1SchoolIntro({ isTeacher, lessonId, activityId, sessionId }: Props) {
  return (
    <div className="w-full h-full">
      <iframe
        src="/games/school_intro_scratch.html"
        className="w-full h-full border-0"
        title="School Intro Scratch Game"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      />
    </div>
  );
}