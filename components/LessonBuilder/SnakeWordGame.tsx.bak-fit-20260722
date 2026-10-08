import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface SnakeWordGameProps {
  words: string[];
  speedMs?: number;
  lives?: number;
  wrongLetterPenalty?: 'lose-life' | 'minus-score' | 'restart-word';
  showHint?: boolean;
  previewMode?: boolean;
  playerId?: string;
  sessionId?: string;
  onProgress?: (progress: GameProgress) => void;
  onFinish?: (result: GameResult) => void;
}

export interface GameProgress {
  currentWord: string;
  currentWordIndex: number;
  collectedLetters: string;
  nextLetter: string;
  score: number;
  mistakes: number;
  livesLeft: number;
  status: 'playing' | 'finished' | 'failed';
}

export interface GameResult {
  score: number;
  mistakes: number;
  completedWords: string[];
  totalWords: number;
  timeSpentSec: number;
  status: 'finished' | 'failed';
}

interface Position {
  x: number;
  y: number;
}

interface Letter {
  letter: string;
  correct: boolean;
  x: number;
  y: number;
}

interface Direction {
  x: number;
  y: number;
}

const GRID_WIDTH = 14;  // 14x11 grid (compact for better fit)
const GRID_HEIGHT = 11; // 11 rows to fit on screen
const CELL_SIZE = 39;   // 39px cells

const SnakeWordGame = ({
  words = [],
  speedMs = 390,
  lives: initialLives = 3,
  wrongLetterPenalty = 'lose-life',
  showHint = true,
  previewMode = false,
  onProgress,
  onFinish,
}: SnakeWordGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // Game state
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'paused' | 'finished' | 'failed'>('ready');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordIndex, setWordIndexState] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [livesLeft, setLivesLeft] = useState(initialLives);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  // Snake state
  const [snake, setSnake] = useState<Position[]>([
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ]);
  const [direction, setDirection] = useState<Direction>({ x: 1, y: 0 });
  const [nextDirection, setNextDirection] = useState<Direction>({ x: 1, y: 0 });
  const [letters, setLetters] = useState<Letter[]>([]);

  const currentWord = (words[currentWordIndex] || '').toUpperCase();
  const nextLetter = currentWord[wordIndex] || '✓';

  // Audio context
  const playTone = useCallback((freq: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audio = new AudioCtx();
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.05;

      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();

      setTimeout(() => {
        osc.stop();
        audio.close();
      }, duration * 1000);
    } catch (e) {
      // Silent fallback
    }
  }, []);

  // Helper functions
  const randomCell = useCallback((): Position => ({
    x: Math.floor(Math.random() * GRID_WIDTH),
    y: Math.floor(Math.random() * GRID_HEIGHT),
  }), []);

  const sameCell = useCallback((a: Position, b: Position) => a.x === b.x && a.y === b.y, []);

  const occupied = useCallback((pos: Position, currentSnake: Position[], currentLetters: Letter[]) => {
    return currentSnake.some(part => sameCell(part, pos)) ||
           currentLetters.some(item => sameCell(item, pos));
  }, [sameCell]);

  const getSafeRandomCell = useCallback((currentSnake: Position[], currentLetters: Letter[]): Position => {
    let pos = randomCell();
    let attempts = 0;
    while (occupied(pos, currentSnake, currentLetters) && attempts < 300) {
      pos = randomCell();
      attempts++;
    }
    return pos;
  }, [randomCell, occupied]);

  // Spawn letters on field
  const spawnLetters = useCallback((currentSnake: Position[], targetLetter: string) => {
    const newLetters: Letter[] = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const decoys = alphabet
      .filter(l => l !== targetLetter)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const allLetters = [targetLetter, ...decoys].sort(() => Math.random() - 0.5);

    allLetters.forEach(letter => {
      const pos = getSafeRandomCell(currentSnake, newLetters);
      newLetters.push({
        letter,
        correct: letter === targetLetter,
        ...pos,
      });
    });

    setLetters(newLetters);
  }, [getSafeRandomCell]);

  // Initialize game
  const initGame = useCallback(() => {
    const initialSnake = [
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ];
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    setNextDirection({ x: 1, y: 0 });
    setWordIndexState(0);
    setScore(0);
    setMistakes(0);
    setLivesLeft(initialLives);
    setCompletedWords([]);
    setStartTime(Date.now());

    if (currentWord) {
      spawnLetters(initialSnake, currentWord[0]);
    }
  }, [currentWord, initialLives, spawnLetters]);

  // Start game
  const startGame = useCallback(() => {
    if (words.length === 0) {
      alert('No words to play!');
      return;
    }
    initGame();
    setGameStatus('playing');
  }, [words.length, initGame]);

  // Game step
  const step = useCallback(() => {
    setDirection(nextDirection);

    setSnake(prevSnake => {
      const head = {
        x: prevSnake[0].x + nextDirection.x,
        y: prevSnake[0].y + nextDirection.y,
      };

      // Check wall collision - minus 5 points instead of game over
      if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        setScore(prev => Math.max(0, prev - 5));
        setShake(true);
        setTimeout(() => setShake(false), 500);
        // Bounce back - reverse direction
        setDirection(prev => ({ x: -prev.x, y: -prev.y }));
        setNextDirection(prev => ({ x: -prev.x, y: -prev.y }));
        return prevSnake;
      }

      // Check self collision - minus 5 points instead of game over
      if (prevSnake.some(part => sameCell(part, head))) {
        setScore(prev => Math.max(0, prev - 5));
        setShake(true);
        setTimeout(() => setShake(false), 500);
        // Bounce back - reverse direction
        setDirection(prev => ({ x: -prev.x, y: -prev.y }));
        setNextDirection(prev => ({ x: -prev.x, y: -prev.y }));
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check letter collision
      const hitIndex = letters.findIndex(item => sameCell(item, head));

      if (hitIndex >= 0) {
        const item = letters[hitIndex];

        if (item.letter === currentWord[wordIndex]) {
          // Correct letter
          setScore(prev => prev + 10);
          setWordIndexState(prev => prev + 1);
          playTone(520, 0.07);

          // Check if word completed
          if (wordIndex + 1 >= currentWord.length) {
            setCompletedWords(prev => [...prev, currentWord]);

            // Check if all words completed
            if (currentWordIndex + 1 >= words.length) {
              setGameStatus('finished');
              return newSnake;
            } else {
              // Move to next word
              setTimeout(() => {
                setCurrentWordIndex(prev => prev + 1);
                setWordIndexState(0);
                const nextWord = words[currentWordIndex + 1].toUpperCase();
                spawnLetters(newSnake, nextWord[0]);
              }, 1000);
            }
          } else {
            // Spawn next letters
            spawnLetters(newSnake, currentWord[wordIndex + 1]);
          }

          return newSnake; // Snake grows
        } else {
          // Wrong letter
          setMistakes(prev => prev + 1);
          playTone(160, 0.09);
          setShake(true);
          setTimeout(() => setShake(false), 250);

          if (wrongLetterPenalty === 'lose-life') {
            setLivesLeft(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameStatus('failed');
              }
              return newLives;
            });
          } else if (wrongLetterPenalty === 'minus-score') {
            setScore(prev => Math.max(0, prev - 5));
          }

          // Remove wrong letter and spawn new decoy
          setLetters(prevLetters => {
            const filtered = prevLetters.filter((_, i) => i !== hitIndex);
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== currentWord[wordIndex]);
            const newLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            const pos = getSafeRandomCell(newSnake.slice(0, -1), filtered);
            return [...filtered, { letter: newLetter, correct: false, ...pos }];
          });

          return newSnake.slice(0, -1); // Remove tail
        }
      }

      return newSnake.slice(0, -1); // Normal move
    });
  }, [
    nextDirection,
    letters,
    currentWord,
    wordIndex,
    currentWordIndex,
    words,
    wrongLetterPenalty,
    sameCell,
    playTone,
    spawnLetters,
    getSafeRandomCell,
  ]);

  // Game loop
  useEffect(() => {
    if (gameStatus !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = window.setInterval(step, speedMs);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStatus, step, speedMs]);

  // Handle game end
  useEffect(() => {
    if (gameStatus === 'finished' || gameStatus === 'failed') {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      if (onFinish) {
        onFinish({
          score,
          mistakes,
          completedWords,
          totalWords: words.length,
          timeSpentSec: timeSpent,
          status: gameStatus,
        });
      }
    }
  }, [gameStatus, score, mistakes, completedWords, words.length, startTime, onFinish]);

  // Change direction handler (for both keyboard and touch controls)
  const changeDirection = useCallback((newDir: Direction) => {
    if (gameStatus !== 'playing') return;

    // Prevent reversing
    const reversing = newDir.x + direction.x === 0 && newDir.y + direction.y === 0;
    if (!reversing) {
      setNextDirection(newDir);
    }
  }, [gameStatus, direction]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const dirMap: Record<string, Direction> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const proposed = dirMap[e.key];
      if (!proposed) return;

      e.preventDefault();
      changeDirection(proposed);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, changeDirection]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#dff3d8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw watermark
    if (currentWord) {
      ctx.fillStyle = 'rgba(45,123,70,0.12)';
      ctx.font = '900 52px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentWord, canvas.width / 2, canvas.height / 2);
    }

    // Draw letters
    letters.forEach(item => {
      const cx = item.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = item.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.save();
      ctx.translate(cx, cy);

      // Letter circle
      ctx.fillStyle = item.correct ? '#ffd166' : '#ffffff';
      ctx.strokeStyle = item.correct ? '#d99900' : 'rgba(43,33,24,0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, CELL_SIZE * 0.43, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Apple leaf for correct letter
      if (item.correct) {
        ctx.fillStyle = '#51b36d';
        ctx.beginPath();
        ctx.ellipse(5, -11, 5, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#7b4f28';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(1, -15);
        ctx.stroke();
      }

      // Letter text
      ctx.fillStyle = item.correct ? '#2b2118' : '#77685d';
      ctx.font = '900 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.letter, 0, 1);
      ctx.restore();
    });

    // Draw snake
    snake.forEach((part, index) => {
      const x = part.x * CELL_SIZE + 2;
      const y = part.y * CELL_SIZE + 2;
      const size = CELL_SIZE - 4;

      ctx.fillStyle = index === 0 ? '#2d7b46' : '#51b36d';
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 8);
      ctx.fill();

      // Draw eyes on head
      if (index === 0) {
        const eyeOffsetX = direction.x !== 0 ? direction.x * 4 : 5;
        const eyeOffsetY = direction.y !== 0 ? direction.y * 4 : 5;

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + size / 2 + eyeOffsetX - 4, y + size / 2 + eyeOffsetY - 4, 3, 0, Math.PI * 2);
        ctx.arc(x + size / 2 + eyeOffsetX + 4, y + size / 2 + eyeOffsetY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2b2118';
        ctx.beginPath();
        ctx.arc(x + size / 2 + eyeOffsetX - 4, y + size / 2 + eyeOffsetY - 4, 1.5, 0, Math.PI * 2);
        ctx.arc(x + size / 2 + eyeOffsetX + 4, y + size / 2 + eyeOffsetY - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [snake, letters, currentWord, direction]);

  // No words state
  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🐍</div>
          <p className="text-gray-600 text-lg">No words configured yet</p>
          <p className="text-gray-400 text-sm">Add words in the builder</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 overflow-hidden flex items-center justify-center">
      <div className="w-full h-full">
        <div className="grid grid-cols-12 gap-3 h-full">
          {/* Left Panel */}
          <aside className="col-span-4 bg-white rounded-3xl p-4 shadow-2xl space-y-3 flex flex-col overflow-hidden">
            <div>
              <h1 className="text-2xl font-black mb-1">Snake Word</h1>
            </div>

            {/* Word slots */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Build the word</div>
              <div className="flex gap-1.5 flex-wrap">
                {currentWord.split('').map((letter, index) => (
                  <div
                    key={index}
                    className={`w-9 h-10 flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                      index < wordIndex
                        ? 'bg-green-500 text-white shadow-lg transform -rotate-2'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* Start button */}
            {gameStatus === 'ready' && (
              <button
                onClick={startGame}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition shadow-lg"
              >
                Start game
              </button>
            )}

            {/* On-screen Controls */}
            <div className="bg-gray-50 rounded-xl p-3 mt-auto">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 text-center">Controls</div>
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-36 mx-auto">
                <button
                  onClick={() => changeDirection({ x: 0, y: -1 })}
                  className="col-start-2 row-start-1 bg-blue-600 hover:bg-blue-700 text-white text-xl font-black rounded-xl h-10 shadow-md transition active:scale-95"
                >
                  ↑
                </button>
                <button
                  onClick={() => changeDirection({ x: -1, y: 0 })}
                  className="col-start-1 row-start-2 bg-blue-600 hover:bg-blue-700 text-white text-xl font-black rounded-xl h-10 shadow-md transition active:scale-95"
                >
                  ←
                </button>
                <button
                  onClick={() => changeDirection({ x: 1, y: 0 })}
                  className="col-start-3 row-start-2 bg-blue-600 hover:bg-blue-700 text-white text-xl font-black rounded-xl h-10 shadow-md transition active:scale-95"
                >
                  →
                </button>
                <button
                  onClick={() => changeDirection({ x: 0, y: 1 })}
                  className="col-start-2 row-start-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-black rounded-xl h-10 shadow-md transition active:scale-95"
                >
                  ↓
                </button>
              </div>
            </div>
          </aside>

          {/* Right Panel - Game */}
          <section className={`col-span-8 bg-white rounded-2xl p-2 shadow-2xl flex flex-col ${shake ? 'animate-shake' : ''}`}>
            {gameStatus === 'ready' && (
              <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">🐍</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">Ready?</h2>
                  <p className="text-gray-600">Collect {currentWord.split('').join(', ')} in order. Avoid fake letters, walls, and your own tail.</p>
                </div>
              </div>
            )}

            {gameStatus === 'playing' && (
              <div className="flex-1 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={GRID_WIDTH * CELL_SIZE}
                  height={GRID_HEIGHT * CELL_SIZE}
                  className="rounded-xl shadow-inner"
                  style={{
                    imageRendering: 'pixelated',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}

            {gameStatus === 'finished' && (
              <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl">
                <div className="text-center bg-white rounded-3xl p-8 shadow-2xl max-w-md">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-3">You win!</h2>
                  <p className="text-gray-600 mb-4">You built {currentWord}. The snake is educated now.</p>
                  <div className="space-y-2 mb-6 text-left bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className="font-bold text-blue-600">{score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mistakes:</span>
                      <span className="font-bold text-red-600">{mistakes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Words:</span>
                      <span className="font-bold text-purple-600">{completedWords.length}/{words.length}</span>
                    </div>
                  </div>
                  <button
                    onClick={startGame}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg"
                  >
                    Play again
                  </button>
                </div>
              </div>
            )}

            {gameStatus === 'failed' && (
              <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl">
                <div className="text-center bg-white rounded-3xl p-8 shadow-2xl max-w-md">
                  <div className="text-6xl mb-4">💀</div>
                  <h2 className="text-3xl font-bold text-red-600 mb-3">Game over</h2>
                  <p className="text-gray-600 mb-4">The snake crashed. Nature is healing, grammar is not.</p>
                  <div className="space-y-2 mb-6 text-left bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className="font-bold text-blue-600">{score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mistakes:</span>
                      <span className="font-bold text-red-600">{mistakes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-bold text-purple-600">{completedWords.length}/{words.length}</span>
                    </div>
                  </div>
                  <button
                    onClick={startGame}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition shadow-lg"
                  >
                    Restart
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.25s ease;
        }
      `}</style>
    </div>
  );
};

export default SnakeWordGame;
