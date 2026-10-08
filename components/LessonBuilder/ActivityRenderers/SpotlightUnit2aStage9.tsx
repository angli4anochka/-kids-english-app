import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit2aStage9(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit2a-stage-9.html"
      title="Unit 2a — Amazing Spidey!"
      doneMessageTypes={['lesson-step-complete']}
      sandbox={SANDBOX}
    />
  );
}
