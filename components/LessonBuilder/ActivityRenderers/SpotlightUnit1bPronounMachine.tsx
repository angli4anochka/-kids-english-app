import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bPronounMachine(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_pronoun_machine_random_design_fixed_we.html"
      title="Pronoun Machine"
      doneMessageTypes={['pronoun-machine-complete']}
      sandbox={SANDBOX}
    />
  );
}
