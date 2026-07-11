import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5DialogueName(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/dialogue-whats-your-name.html"
      title="Dialogue: What's your name?"
      doneMessageTypes={['dialogue-whats-your-name-done']}
      width={1220}
      height={820}
    />
  );
}
