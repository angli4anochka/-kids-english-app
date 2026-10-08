import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cSchoolSubjectRiddles(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_school_subject_riddles.html"
      title="Guess the School Subject"
      doneMessageTypes={['lesson:subject-riddles-complete']}
      sandbox={SANDBOX}
    />
  );
}
