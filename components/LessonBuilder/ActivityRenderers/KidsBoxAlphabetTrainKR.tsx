import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function KidsBoxAlphabetTrainKR(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/kidsbox-alphabet-train-k-r.html"
      title="Alphabet Train ? K to R"
      doneMessageTypes={['kidsbox-alphabet-train-k-r-done']}
    />
  );
}
