import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5UkUsa(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/uk-usa-interactive.html"
      title="The UK / The USA"
      doneMessageTypes={['uk-usa-done']}
      width={1220}
      height={830}
    />
  );
}
