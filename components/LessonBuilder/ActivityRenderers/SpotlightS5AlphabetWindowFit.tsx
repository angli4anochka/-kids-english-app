import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5AlphabetWindowFit(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/spotlight5-alphabet-dragdrop-window-fit.html"
      title="Alphabet Drag & Drop"
      doneMessageTypes={['spotlight5-alphabet-done']}
    />
  );
}
