'use client';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

export default function SpotlightUnit1SchoolSubjectsFlashlight({ isTeacher, lessonId, activityId, sessionId }: Props) {
  return (
    <div className="w-full h-full">
      <iframe
        src="/games/school_subjects_flashlight.html"
        className="w-full h-full border-0"
        title="School Subjects Flashlight Game"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      />
    </div>
  );
}