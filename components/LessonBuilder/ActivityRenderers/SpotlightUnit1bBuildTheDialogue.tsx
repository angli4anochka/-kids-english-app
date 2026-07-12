import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bBuildTheDialogue(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_build_the_dialogue.html"
      title="Build the Dialogue"
      doneMessageTypes={['slide8-dialogue-built']}
      sandbox={SANDBOX}
    />
  );
}
