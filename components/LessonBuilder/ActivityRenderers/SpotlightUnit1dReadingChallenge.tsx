import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dReadingChallenge(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage5_reading_challenge.html"
      title="Verify the Intercepted Intel"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
