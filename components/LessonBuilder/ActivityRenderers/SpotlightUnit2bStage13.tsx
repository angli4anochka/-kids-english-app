import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';
export default function SpotlightUnit2bStage13(props: SpotlightActivityProps) {
  return <SpotlightIframeActivity {...props} src="/games/unit2b-stage-13.html" title="Unit 2b — My Birthday Wishlist" doneMessageTypes={['lesson-step-complete']} width={1280} height={800} sandbox={SANDBOX} />;
}
