import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cTimetablePresentationScoreboard(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_timetable_presentation_scoreboard.html"
      title="School Programme"
      doneMessageTypes={['lesson:timetable-presentation-complete']}
      sandbox={SANDBOX}
    />
  );
}
