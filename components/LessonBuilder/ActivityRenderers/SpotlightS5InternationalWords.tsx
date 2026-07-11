import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5InternationalWords(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/international-words-interactive.html"
      title="International Words"
      doneMessageTypes={['international-words-done']}
      width={1220}
      height={770}
    />
  );
}
