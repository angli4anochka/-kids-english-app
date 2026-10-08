import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1EnglishInUseQuestionWordsAboutMe(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1_english_in_use_question_words_about_me.html"
      title="English in Use: Question Words"
      sandbox={SANDBOX}
    />
  );
}
