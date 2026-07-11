import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5SongReadingRules(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/song-reading-rules-ah.html"
      title="Sing the Song + Reading Rules"
      doneMessageTypes={['song-reading-rules-done']}
      width={1220}
      height={820}
    />
  );
}
