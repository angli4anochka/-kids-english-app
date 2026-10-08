import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dSchoolsInEngland(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage8_schools_in_england.html"
      title="Decrypt Schools in England"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
