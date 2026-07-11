import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5ReadingRulesJR(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/reading-rules-jr.html"
      title="Reading Rules J-R"
      doneMessageTypes={['reading-rules-jr-done']}
      width={1000}
      height={580}
    />
  );
}
