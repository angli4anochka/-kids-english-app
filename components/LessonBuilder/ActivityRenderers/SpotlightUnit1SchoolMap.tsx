import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1SchoolMap(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/school_map_drag_drop.html"
      title="School Map Drag and Drop"
      doneMessageTypes={['school-map-done']}
      sandbox={SANDBOX}
    />
  );
}
