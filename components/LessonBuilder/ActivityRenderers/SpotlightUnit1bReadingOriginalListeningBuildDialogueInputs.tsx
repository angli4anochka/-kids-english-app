import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bReadingOriginalListeningBuildDialogueInputs(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_reading_original_listening_build_dialogue_inputs.html"
      title="Reading, Listening, Build Dialogue"
      doneMessageTypes={['custom-dialogue-complete']}
      sandbox={SANDBOX}
    />
  );
}
