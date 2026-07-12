import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bHowOldAreThey(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_how_old_are_they_vertical.html"
      title="How old are they?"
      doneMessageTypes={['unit1b-how-old-are-they-done']}
      sandbox={SANDBOX}
    />
  );
}
