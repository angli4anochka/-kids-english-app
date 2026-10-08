import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock';

export default function SpotlightUnit1cCapitalLettersFromBook(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/unit1c_capital_letters_from_book.html"
      title="Correct the Capital Letters"
      doneMessageTypes={['lesson:capital-letters-complete']}
      sandbox={SANDBOX}
    />
  );
}
