import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit2aStage8(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit2a-stage-8.html"
      title="Unit 2a — Write about them"
      doneMessageTypes={['lesson-step-complete']}
      sandbox={SANDBOX}
    />
  );
}
