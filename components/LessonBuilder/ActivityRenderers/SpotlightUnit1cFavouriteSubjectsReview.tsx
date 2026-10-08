import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cFavouriteSubjectsReview(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_favourite_subjects_review.html"
      title="Favourite Subjects Review"
      doneMessageTypes={['lesson:review-complete']}
      sandbox={SANDBOX}
    />
  );
}
