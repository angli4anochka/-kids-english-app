(() => {
  const player = new Audio();
  player.preload = 'auto';
  let request = 0;
  function stop() {
    request++;
    player.pause();
    if (Number.isFinite(player.duration)) player.currentTime = 0;
  }
  window.ClassroomAudio = {
    stop,
    play(clip, onError) {
      stop();
      const current = request;
      player.src = '/classroom-games/audio-us-jenny-v1/' + encodeURIComponent(clip) + '.mp3';
      player.playbackRate = 1;
      player.play().catch(error => {
        if (current !== request || error.name === 'AbortError') return;
        onError?.(error.name === 'NotAllowedError'
          ? 'Tap Listen to hear the voice.'
          : 'Audio could not load. Tap Listen to retry.');
      });
    }
  };
  addEventListener('pagehide', stop);
})();
