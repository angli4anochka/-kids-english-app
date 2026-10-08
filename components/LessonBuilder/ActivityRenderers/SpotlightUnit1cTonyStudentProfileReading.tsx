import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cTonyStudentProfileReading(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_tony_student_profile_reading.html"
      title="Read a Student Profile"
      doneMessageTypes={['lesson:profile-reading-complete']}
      sandbox={SANDBOX}
    />
  );
}
