import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cListeningExercise4(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_listening_exercise_4.html"
      title="Listening Exercise 4"
      doneMessageTypes={['lesson:listening-complete']}
      sandbox={SANDBOX}
    />
  );
}
