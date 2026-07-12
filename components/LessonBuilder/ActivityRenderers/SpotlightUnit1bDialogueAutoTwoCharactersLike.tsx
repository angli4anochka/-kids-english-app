import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bDialogueAutoTwoCharactersLike(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_dialogue_auto_two_characters_like.html"
      title="Meet the Characters"
      doneMessageTypes={['slide7-dialogue-answer', 'slide7-dialogue-complete']}
      sandbox={SANDBOX}
    />
  );
}
