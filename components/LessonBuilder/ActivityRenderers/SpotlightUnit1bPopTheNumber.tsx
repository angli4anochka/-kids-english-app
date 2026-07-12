import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bPopTheNumber(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/pop_the_number_game.html"
      title="Pop the Number"
      doneMessageTypes={['unit1b-pop-the-number-done']}
      sandbox={SANDBOX}
    />
  );
}
