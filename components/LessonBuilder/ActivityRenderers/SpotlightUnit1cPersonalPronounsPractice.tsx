import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cPersonalPronounsPractice(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_personal_pronouns_practice.html"
      title="Personal Pronouns Practice"
      doneMessageTypes={['lesson:pronoun-sorting-complete']}
      sandbox={SANDBOX}
    />
  );
}
