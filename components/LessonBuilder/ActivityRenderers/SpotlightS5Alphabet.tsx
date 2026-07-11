import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5Alphabet(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/spotlight5-alphabet-dragdrop.html"
      title="The English Alphabet"
      doneMessageTypes={['spotlight5-alphabet-done']}
      width={1180}
      height={820}
    />
  );
}
