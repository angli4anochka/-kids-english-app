import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function SpotlightS5FindWordsRightWrong(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/spotlight/find-words-right-wrong-ah.html"
      title="Find the Words + Right/Wrong"
      doneMessageTypes={['find-words-right-wrong-done']}
      width={1220}
      height={820}
    />
  );
}
