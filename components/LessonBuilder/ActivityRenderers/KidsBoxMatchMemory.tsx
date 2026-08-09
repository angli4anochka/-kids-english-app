import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function KidsBoxMatchMemory(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/kidsbox-match-memory.html"
      title="Match Memory"
      doneMessageTypes={['kidsbox-match-memory-done']}
    />
  );
}
