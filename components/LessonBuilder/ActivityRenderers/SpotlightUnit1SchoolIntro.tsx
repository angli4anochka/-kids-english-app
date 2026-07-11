import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1SchoolIntro(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/school_intro_scratch.html"
      title="School Intro Scratch Game"
      doneMessageTypes={['school-intro-done']}
      sandbox={SANDBOX}
    />
  );
}
