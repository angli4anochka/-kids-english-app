import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dPersonalPronouns(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage6_personal_pronouns.html"
      title="Restore the Identity Links"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
