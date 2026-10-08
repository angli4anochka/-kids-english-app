import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cWriteAboutClassmate(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_write_about_classmate.html"
      title="Write About a Classmate"
      doneMessageTypes={['lesson:classmate-writing-complete']}
      sandbox={SANDBOX}
    />
  );
}
