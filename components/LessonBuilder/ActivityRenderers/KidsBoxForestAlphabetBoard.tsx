import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

export default function KidsBoxForestAlphabetBoard(props: SpotlightActivityProps) {
  return (
    <SpotlightIframeActivity
      {...props}
      src="/games/kidsbox-forest-alphabet-board.html"
      title="Forest Alphabet Board Game"
      doneMessageTypes={['kidsbox-forest-board-done']}
      realtime={{ outgoingType: 'forest-board-action', socketEvent: 'forest-board:update', incomingEvent: 'forest-board:state', incomingType: 'forest-board-remote-state' }}
    />
  );
}
