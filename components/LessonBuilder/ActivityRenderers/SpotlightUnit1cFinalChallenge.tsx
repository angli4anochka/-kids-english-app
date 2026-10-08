import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cFinalChallenge(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_final_challenge.html"
      title="Final Challenge"
      doneMessageTypes={['lesson:final-challenge-complete']}
      sandbox={SANDBOX}
    />
  );
}
