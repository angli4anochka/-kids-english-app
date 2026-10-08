import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dJaneProfile(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage3_jane_profile.html"
      title="Recover Jane's Profile"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
