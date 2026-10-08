import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bFinalOpenProfile(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/final_open_profile_send_teacher.html"
      title="My profile"
      doneMessageTypes={['final-open-profile']}
      sandbox={SANDBOX}
    />
  );
}
