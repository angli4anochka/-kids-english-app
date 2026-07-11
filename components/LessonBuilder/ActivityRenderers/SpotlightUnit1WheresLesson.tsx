import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1WheresLesson(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/wheres_the_lesson_no_repeat.html"
      title="Where's the lesson?"
      doneMessageTypes={['wheres-the-lesson-done']}
      sandbox={SANDBOX}
    />
  );
}
