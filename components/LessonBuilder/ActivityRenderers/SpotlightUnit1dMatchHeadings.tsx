import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dMatchHeadings(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage4_match_headings.html"
      title="Sort Jane's Data Fragments"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
