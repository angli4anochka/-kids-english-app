import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cFindTheLessonQuestionCards(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_find_the_lesson_question_cards.html"
      title="Find the Lesson"
      doneMessageTypes={['lesson:find-the-lesson-complete']}
      sandbox={SANDBOX}
    />
  );
}
