import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1bAffirmativeNegativeHtmlWorksheetDynamicPhotos(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1b_affirmative_negative_html_worksheet_dynamic_photos.html"
      title="Affirmative or negative?"
      doneMessageTypes={['affirmative-negative-complete']}
      sandbox={SANDBOX}
    />
  );
}
