import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bAmIsAreRulesPracticeNoMonster(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_am_is_are_rules_practice_no_monster.html"
      title="Am / Is / Are"
      doneMessageTypes={['am-is-are-complete']}
      sandbox={SANDBOX}
    />
  );
}
