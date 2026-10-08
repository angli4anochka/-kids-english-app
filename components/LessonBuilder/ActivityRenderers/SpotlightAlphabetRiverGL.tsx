import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightAlphabetRiverGL(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/alphabet-river-g-l.html"
      title="Alphabet River G-L"
      doneMessageTypes={['alphabet-river-complete']}
      sandbox={SANDBOX}
    />
  );
}
