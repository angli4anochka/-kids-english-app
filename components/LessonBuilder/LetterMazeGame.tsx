import { useState, useEffect, useRef } from 'react';

export interface LetterMazeConfig {
  title: string;
  subtitle: string;
  targetLetters: string[];
  lives: number;
}

export interface LetterMazeResult {
  score: number;
  status: 'completed' | 'failed';
  livesLeft: number;
  totalLetters: number;
}

interface Props {
  config: LetterMazeConfig;
  onComplete?: (result: LetterMazeResult) => void;
}

const LetterMazeGame: React.FC<Props> = ({ config, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(config.lives);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'good' | 'bad' | ''>('');
  const [showStartModal, setShowStartModal] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endMessage, setEndMessage] = useState('');
  const [player, setPlayer] = useState({ r: 1, c: 1 });
  const [map, setMap] = useState<string[][]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundOn = useRef(true);

  const baseMap = [
    "#############",
    "#S    #     #",
    "# ### # ### #",
    "# #   # #   #",
    "# # ### # # #",
    "#   #   # # #",
    "### # ### # #",
    "#   #     # #",
    "# ### ##### #",
    "#     #     #",
    "# ### # ### #",
    "#   #   #   #",
    "#############"
  ];

  const letterLayouts = [
    { A: [11, 11], B: [1, 5], C: [5, 7], D: [3, 11] },
    { A: [3, 3], B: [1, 11], C: [5, 7], D: [11, 1] },
    { A: [1, 5], B: [5, 7], C: [11, 1], D: [11, 11] },
    { A: [1, 5], B: [5, 7], C: [3, 11], D: [7, 9] }
  ];

  const rows = baseMap.length;
  const cols = baseMap[0].length;

  const cloneMap = () => baseMap.map(row => row.split(''));

  const loadRound = (roundNum: number) => {
    const newMap = cloneMap();
    setPlayer({ r: 1, c: 1 });

    const layout = letterLayouts[Math.min(roundNum, letterLayouts.length - 1)];

    for (const letter of config.targetLetters) {
      const coords = layout[letter as keyof typeof layout];
      if (coords) {
        const [r, c] = coords;
        newMap[r][c] = letter;
      }
    }

    setMap(newMap);
    setMessage(`Find letter ${config.targetLetters[roundNum]}!`);
    setMessageType('');
  };

  const startGame = () => {
    setRound(0);
    setScore(0);
    setLives(config.lives);
    setGameStarted(true);
    setShowStartModal(false);
    setShowEndModal(false);
    loadRound(0);
  };

  // Auto-start game on mount
  useEffect(() => {
    startGame();
  }, []);

  const playSound = (type: 'correct' | 'wrong' | 'wall' | 'win') => {
    if (!soundOn.current) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const tone = (freq: number, start: number, duration: number, wave: OscillatorType = 'sine', volume = 0.12) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = wave;
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration + 0.03);
      };

      if (type === 'correct') {
        tone(520, 0, 0.12);
        tone(760, 0.11, 0.12);
        tone(980, 0.22, 0.14);
      } else if (type === 'wrong') {
        tone(170, 0, 0.18, 'square', 0.13);
        tone(95, 0.1, 0.2, 'square', 0.1);
      } else if (type === 'wall') {
        tone(210, 0, 0.08, 'square', 0.07);
      } else if (type === 'win') {
        tone(520, 0, 0.12);
        tone(660, 0.11, 0.12);
        tone(820, 0.22, 0.12);
        tone(1040, 0.34, 0.2);
      }
    } catch (e) {
      console.log('Audio blocked:', e);
    }
  };

  const handleLetter = (letter: string, newMap: string[][], newPlayer: { r: number; c: number }) => {
    const target = config.targetLetters[round];

    if (letter === target) {
      setScore(prev => prev + 1);
      newMap[newPlayer.r][newPlayer.c] = ' ';
      setMap(newMap);
      setMessage(`Great! You found ${letter}! +1`);
      setMessageType('good');
      playSound('correct');

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= config.targetLetters.length) {
          setGameStarted(false);
          setShowEndModal(true);
          setEndMessage(`🎉 Great job! You found all letters. Final score: ${score + 1}.`);
          playSound('win');
          if (onComplete) onComplete({
            score: score + 1,
            status: 'completed',
            livesLeft: lives,
            totalLetters: config.targetLetters.length,
          });
        } else {
          setRound(nextRound);
          loadRound(nextRound);
        }
      }, 850);
    } else {
      const newScore = Math.max(0, score - 1);
      const newLives = lives - 1;
      setScore(newScore);
      setLives(newLives);
      newMap[newPlayer.r][newPlayer.c] = ' ';
      setMap(newMap);
      setMessage(`Oops! This is ${letter}. We need ${target}. -1`);
      setMessageType('bad');
      playSound('wrong');

      if (newLives <= 0) {
        setTimeout(() => {
          setGameStarted(false);
          setShowEndModal(true);
          setEndMessage(`Try again! You lost all lives. Final score: ${newScore}.`);
          if (onComplete) onComplete({
            score: newScore,
            status: 'failed',
            livesLeft: 0,
            totalLetters: config.targetLetters.length,
          });
        }, 500);
      }
    }
  };

  const move = (dr: number, dc: number) => {
    if (!gameStarted || lives <= 0) return;

    const nr = player.r + dr;
    const nc = player.c + dc;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
    if (map[nr][nc] === '#') {
      setMessage('Wall! Try another way.');
      setMessageType('bad');
      playSound('wall');
      return;
    }

    const newPlayer = { r: nr, c: nc };
    setPlayer(newPlayer);

    const cell = map[nr][nc];
    const newMap = map.map(row => [...row]);

    if (config.targetLetters.includes(cell)) {
      handleLetter(cell, newMap, newPlayer);
    } else {
      setMap(newMap);
      setMessage('');
      setMessageType('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mapKeys: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        KeyW: [-1, 0],
        KeyS: [1, 0],
        KeyA: [0, -1],
        KeyD: [0, 1]
      };

      if (mapKeys[e.code]) {
        e.preventDefault();
        move(...mapKeys[e.code]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, player, map, lives, round, score]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 overflow-hidden" style={{
      background: 'radial-gradient(circle at 15% 15%, rgba(255, 255, 255, 0.85), transparent 24%), radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.65), transparent 20%), linear-gradient(135deg, #fef3c7, #bae6fd)'
    }}>
      <div className="w-full max-w-6xl h-full max-h-full bg-white/80 rounded-3xl shadow-2xl overflow-auto" style={{ border: '5px solid rgba(255, 255, 255, 0.95)' }}>
        {/* Header */}
        <div className="grid grid-cols-3 gap-3 items-center px-5 py-4 bg-white/60" style={{ borderBottom: '4px solid rgba(255,255,255,0.8)' }}>
          <div className="text-2xl md:text-4xl font-black text-blue-900 flex items-center gap-2">
            <span className="animate-bounce">🧭</span> {config.title}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <div className="bg-white px-4 py-2 rounded-full text-sm md:text-lg font-black shadow-md border-2 border-blue-100">
              Round {round + 1} / {config.targetLetters.length}
            </div>
            <div className="bg-white px-4 py-2 rounded-full text-sm md:text-lg font-black shadow-md border-2 border-blue-100">
              Score: {score}
            </div>
            <div className="bg-white px-4 py-2 rounded-full text-sm md:text-lg font-black shadow-md border-2 border-blue-100">
              {'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(Math.max(0, config.lives - lives))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black px-3 py-2 rounded-2xl shadow-md border-3 border-white/75 transition hover:-translate-y-1"
            >
              ↻ Restart
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid md:grid-cols-[1fr_250px] gap-4 p-5">
          {/* Maze */}
          <div className="bg-white/75 rounded-3xl p-4 shadow-md border-4 border-white/90">
            <div className={`text-center mb-3 min-h-[40px] text-xl md:text-3xl font-black ${messageType === 'good' ? 'text-green-600 animate-pulse' : messageType === 'bad' ? 'text-red-600' : 'text-blue-900'}`}>
              {message || `Find letter ${config.targetLetters[round]}!`}
            </div>

            <div
              className="grid gap-1 w-full max-w-2xl mx-auto bg-blue-100 p-2 rounded-2xl"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.9)'
              }}
            >
              {map.map((row, r) =>
                row.map((cell, c) => {
                  const isWall = cell === '#';
                  const isPlayer = player.r === r && player.c === c;
                  const isLetter = config.targetLetters.includes(cell);
                  const isTarget = cell === config.targetLetters[round];

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs md:text-lg font-black ${
                        isWall
                          ? 'bg-gradient-to-br from-blue-600 to-blue-900'
                          : 'bg-white'
                      }`}
                      style={{
                        boxShadow: isWall ? 'inset 0 -5px 0 rgba(0,0,0,0.12)' : 'inset 0 0 0 2px rgba(37, 99, 235, 0.08)'
                      }}
                    >
                      {isPlayer ? (
                        <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                          🙂
                        </div>
                      ) : isLetter ? (
                        <div className={`w-3/4 h-3/4 rounded-full flex items-center justify-center shadow-md border-2 border-white/90 ${
                          isTarget
                            ? 'bg-gradient-to-br from-green-200 to-green-500 text-green-900 animate-pulse'
                            : 'bg-gradient-to-br from-red-200 to-red-400 text-red-900'
                        }`}>
                          {cell}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="bg-white/75 rounded-3xl p-4 shadow-md border-4 border-white/90">
            <div className="bg-white rounded-2xl p-4 text-center shadow-md border-2 border-blue-100 mb-4">
              <div className="text-sm font-black text-gray-500 uppercase tracking-wide mb-2">
                Find this letter
              </div>
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-green-200 to-green-500 text-green-900 flex items-center justify-center text-6xl font-black shadow-md border-4 border-white">
                {config.targetLetters[round]}
              </div>
              <p className="text-sm font-bold text-gray-700 mt-3">
                Move through the maze and collect the correct letter.
              </p>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 grid-rows-3 gap-2 w-48 mx-auto mb-4">
              <button onClick={() => move(-1, 0)} className="col-start-2 row-start-1 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black rounded-2xl h-14 shadow-md border-3 border-white/75 transition hover:-translate-y-1">
                ↑
              </button>
              <button onClick={() => move(0, -1)} className="col-start-1 row-start-2 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black rounded-2xl h-14 shadow-md border-3 border-white/75 transition hover:-translate-y-1">
                ←
              </button>
              <button onClick={() => move(0, 1)} className="col-start-3 row-start-2 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black rounded-2xl h-14 shadow-md border-3 border-white/75 transition hover:-translate-y-1">
                →
              </button>
              <button onClick={() => move(1, 0)} className="col-start-2 row-start-3 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black rounded-2xl h-14 shadow-md border-3 border-white/75 transition hover:-translate-y-1">
                ↓
              </button>
            </div>

            <div className="text-xs font-bold text-gray-600 leading-relaxed">
              {config.subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl border-6 border-white/90 max-w-lg animate-scale-in">
            <h1 className="text-4xl md:text-6xl font-black text-blue-900 mb-4">🧭 {config.title}</h1>
            <p className="text-lg md:text-2xl font-bold text-gray-700 mb-2">
              {config.subtitle}
            </p>
            <p className="text-base md:text-xl font-bold text-gray-600 mb-6">
              Find letters: <b>{config.targetLetters.join(', ')}</b>
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-black text-2xl md:text-4xl px-8 py-4 rounded-2xl shadow-lg border-4 border-white/85 transition hover:-translate-y-1"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* End Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl border-6 border-white/90 max-w-lg animate-scale-in">
            <p className="text-lg md:text-2xl font-bold text-gray-700 whitespace-pre-line">
              {endMessage}
            </p>
            <button
              onClick={startGame}
              className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-black text-2xl md:text-4xl px-8 py-4 rounded-2xl shadow-lg border-4 border-white/85 transition hover:-translate-y-1"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterMazeGame;
