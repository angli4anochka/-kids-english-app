import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5AlphabetIR(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/alphabet-ir-interactive.html"
      title="Alphabet I-R"
      doneMessageTypes={['alphabet-ir-done']}
      width={1000}
      height={580}
    />
  );
}
