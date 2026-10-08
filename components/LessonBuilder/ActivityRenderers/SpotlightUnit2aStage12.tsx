import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit2aStage12(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit2a-stage-12.html"
      title="Unit 2a — Who has got what?"
      doneMessageTypes={['lesson-step-complete']}
      sandbox={SANDBOX}
    />
  );
}
