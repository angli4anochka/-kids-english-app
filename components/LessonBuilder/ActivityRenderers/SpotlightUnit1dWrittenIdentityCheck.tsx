import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dWrittenIdentityCheck(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage9_written_identity_check.html"
      title="Confirm Your Student Identity"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
