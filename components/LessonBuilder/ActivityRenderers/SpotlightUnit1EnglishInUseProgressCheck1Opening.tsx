import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1EnglishInUseProgressCheck1Opening(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/progress_check_1_opening.html"
      title="English in Use: Progress Check 1"
      sandbox={SANDBOX}
    />
  );
}
