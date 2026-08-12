import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bQuestionBuilder(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_question_builder.html"
      title="Question builder"
      doneMessageTypes={['question-builder-complete']}
      sandbox={SANDBOX}
    />
  );
}
