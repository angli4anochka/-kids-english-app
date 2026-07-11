import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1AAnSchoolObjects(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/a_an_school_objects_game.html"
      title="A or An? School Objects"
      doneMessageTypes={['a-an-school-objects-done']}
      sandbox={SANDBOX}
    />
  );
}
