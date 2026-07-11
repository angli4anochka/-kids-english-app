import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1MondayTimetableDays(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/monday_timetable_days_less_buttons.html"
      title="Monday Timetable and Days"
      doneMessageTypes={['monday-timetable-days-done']}
      sandbox={SANDBOX}
    />
  );
}
