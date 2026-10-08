import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit2bStage3(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit2b-stage-3.html"
      title="Unit 2b — Personal Things"
      doneMessageTypes={['lesson-step-complete']}
      width={1280}
      height={800}
      sandbox={SANDBOX}
    />
  );
}
