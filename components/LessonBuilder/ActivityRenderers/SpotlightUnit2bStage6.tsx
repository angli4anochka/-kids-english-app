import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';
export default function SpotlightUnit2bStage6(props: SpotlightActivityProps) {
  return <SpotlightIframeActivity {...props} src="/games/unit2b-stage-6.html" title="Unit 2b — He/She Has Got Constructor" doneMessageTypes={['lesson-step-complete']} width={1440} height={900} sandbox={SANDBOX} />;
}
