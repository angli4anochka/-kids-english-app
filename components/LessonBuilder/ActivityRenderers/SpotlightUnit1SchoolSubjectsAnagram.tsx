import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1SchoolSubjectsAnagram(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/school_subjects_anagram.html"
      title="School Subjects Anagram Game"
      doneMessageTypes={['school-subjects-anagram-done']}
      sandbox={SANDBOX}
    />
  );
}
