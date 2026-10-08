import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1dHomepageBuilder(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1d_stage10_homepage_builder.html"
      title="Create Your Own Homepage"
      doneMessageTypes={['spotlight-result']}
      sandbox={SANDBOX}
    />
  );
}
