import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';
export default function SpotlightUnit2bStage12(props: SpotlightActivityProps) {
  return <SpotlightIframeActivity {...props} src="/games/unit2b-stage-12.html" title="Unit 2b — Everyday English" doneMessageTypes={['lesson-step-complete']} width={1280} height={800} sandbox={SANDBOX} />;
}
