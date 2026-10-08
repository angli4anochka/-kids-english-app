import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';
export default function SpotlightUnit2bStage7(props: SpotlightActivityProps) {
  return <SpotlightIframeActivity {...props} src="/games/unit2b-stage-7.html" title="Unit 2b — Find Five Differences" doneMessageTypes={['lesson-step-complete']} width={1440} height={900} sandbox={SANDBOX} />;
}
