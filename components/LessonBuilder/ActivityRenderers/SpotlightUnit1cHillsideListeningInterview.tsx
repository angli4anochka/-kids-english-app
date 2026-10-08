import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cHillsideListeningInterview(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_hillside_listening_interview.html"
      title="Hillside Secondary School"
      doneMessageTypes={['lesson:classmate-interview-complete']}
      sandbox={SANDBOX}
    />
  );
}
