import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function KidsBoxAlphabetCodebreakerSZ(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/kidsbox-alphabet-codebreaker-s-z.html"
      title="Alphabet Codebreaker ? S to Z"
      doneMessageTypes={['kidsbox-alphabet-codebreaker-s-z-done']}
    />
  );
}
