import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';
export default function SpotlightUnit2bStage11(props: SpotlightActivityProps) {
  return <SpotlightIframeActivity {...props} src="/games/unit2b-stage-11.html" title="Unit 2b — This, These, That, Those" doneMessageTypes={['lesson-step-complete']} width={1280} height={800} sandbox={SANDBOX} />;
}
