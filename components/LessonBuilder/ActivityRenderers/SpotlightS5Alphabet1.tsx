import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5Alphabet1(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/alphabet-1-interactive.html"
      title="The English Alphabet I"
      doneMessageTypes={['alphabet-1-done']}
      width={1220}
      height={830}
    />
  );
}
