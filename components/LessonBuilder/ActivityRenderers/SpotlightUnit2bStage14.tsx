import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';
export default function SpotlightUnit2bStage14(props: SpotlightActivityProps) {
  return <SpotlightIframeActivity {...props} src="/games/unit2b-stage-14.html" title="Unit 2b — Progress Check: My Things" doneMessageTypes={['lesson-step-complete']} width={1280} height={800} sandbox={SANDBOX} />;
}
