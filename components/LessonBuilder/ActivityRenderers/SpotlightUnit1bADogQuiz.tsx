import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bADogQuiz(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/a_an_dog_quiz_stage1.html"
      title="A or An? Dog Quiz"
      doneMessageTypes={['unit1b-a-an-dog-quiz-done']}
      sandbox={SANDBOX}
    />
  );
}
