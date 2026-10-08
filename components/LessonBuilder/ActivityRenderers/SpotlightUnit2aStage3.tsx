import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit2aStage3(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit2a-stage-3.html"
      title="Unit 2a — Countries and nationalities"
      doneMessageTypes={['lesson-step-complete']}
      sandbox={SANDBOX}
    />
  );
}
