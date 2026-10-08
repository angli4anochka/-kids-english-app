import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bToBeSixForms10SentencesRandom(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/to_be_six_forms_10_sentences_random.html"
      title="to be: positive / negative"
      doneMessageTypes={['to-be-six-forms-complete']}
      sandbox={SANDBOX}
    />
  );
}
