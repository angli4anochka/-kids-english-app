import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dPronounSecurityCheck(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage7_pronoun_security_check.html"
      title="Restore the Missing Pronouns"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
