import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5ReadingRuleI(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/reading-rule-i-names.html"
      title="Reading Rule Ii + Names"
      doneMessageTypes={['reading-rule-i-names-done']}
      width={1000}
      height={580}
    />
  );
}
