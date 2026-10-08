import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dWelcome(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_lesson_welcome.html"
      title="Lesson 1d Welcome"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
