'use client';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1WheresLesson({ isTeacher, lessonId, activityId, sessionId }: Props) {
  return (
    <div className="w-full h-full">
      <iframe
        src="/games/wheres_the_lesson_no_repeat.html"
        className="w-full h-full border-0"
        title="Where's the lesson?"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      />
    </div>
  );
}