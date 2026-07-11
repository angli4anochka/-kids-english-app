import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5WeLearnEnglish(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/we-learn-english-dragdrop.html"
      title="We Learn English"
      doneMessageTypes={['we-learn-english-done']}
      width={1180}
      height={820}
    />
  );
}
