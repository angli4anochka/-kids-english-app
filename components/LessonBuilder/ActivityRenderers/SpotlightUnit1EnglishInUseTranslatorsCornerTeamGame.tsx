import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1EnglishInUseTranslatorsCornerTeamGame(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1_english_in_use_translators_corner_team_game.html"
      title="English in Use: Translator's Corner"
      sandbox={SANDBOX}
    />
  );
}
