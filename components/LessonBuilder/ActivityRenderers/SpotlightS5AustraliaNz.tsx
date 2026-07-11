import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5AustraliaNz(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/australia-nz-interactive.html"
      title="Australia / New Zealand"
      doneMessageTypes={['australia-nz-done']}
      width={1220}
      height={830}
    />
  );
}
