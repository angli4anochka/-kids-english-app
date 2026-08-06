import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1EnglishInUseSpeakingSituationCards(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1_english_in_use_speaking_situation_cards.html"
      title="English in Use: Speaking Situations"
      sandbox={SANDBOX}
    />
  );
}
