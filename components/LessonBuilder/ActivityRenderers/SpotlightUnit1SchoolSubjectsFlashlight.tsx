import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1SchoolSubjectsFlashlight(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/school_subjects_flashlight.html"
      title="School Subjects Flashlight Game"
      doneMessageTypes={['gameCompleted', 'school-subjects-flashlight-done']}
      sandbox={SANDBOX}
    />
  );
}
