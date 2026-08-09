import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function KidsBoxMatchMemory(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/kidsbox-oxford-phonics-memory-a-j.html"
      title="Oxford Phonics Memory ? A to J"
      doneMessageTypes={['kidsbox-oxford-phonics-memory-done']}
    />
  );
}
