import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit2aStage16(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit2a-stage-16.html"
      title="Unit 2a — Lesson complete"
      doneMessageTypes={['lesson-complete']}
      sandbox={SANDBOX}
    />
  );
}
