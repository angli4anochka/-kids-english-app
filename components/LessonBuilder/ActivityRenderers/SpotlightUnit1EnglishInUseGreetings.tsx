import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1EnglishInUseGreetings(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1_english_in_use_greetings.html"
      title="English in Use: Greetings"
      sandbox={SANDBOX}
    />
  );
}
