import { useState, useEffect, useRef } from 'react';

export interface LetterRaceConfig {
  title: string;
  subtitle: string;
  letterA: string;
  letterB: string;
  targetGoal: number;
}

export interface LetterRaceResult {
  score: number;
  mistakes: number;
}

interface Props {
  config: LetterRaceConfig;
  onComplete?: (result: LetterRaceResult) => void;
}

interface Letter {
  id: number;
  x: number;
  y: number;
  letter: string;
  hit: boolean;
  wobble: number;
}

const LetterRaceGame: React.FC<Props> = ({ config, onComplete }) => {
  const [targetLetter, setTargetLetter] = useState(config.letterA);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastBad, setToastBad] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [, forceUpdate] = useState(0); // For forcing re-render when letters change

  const roadRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const carXRef = useRef(0.5);
  const carYRef = useRef(0.79);
  const vxRef = useRef(0);
  const vyRef = useRef(0);
  const speedRef = useRef(210);
  const spawnTimerRef = useRef(0);
  const lettersRef = useRef<Letter[]>([]);
  const lastTimeRef = useRef(0);
  const keysRef = useRef(new Set<string>());
  const nextIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const carBumpRef = useRef(false);

  const unlockAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const beep = (freq = 440, duration = 0.08, type: OscillatorType = 'sine', volume = 0.05) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration + 0.02);
  };

  const correctSound = () => {
    beep(660, 0.08, 'triangle', 0.055);
    setTimeout(() => beep(880, 0.09, 'triangle', 0.05), 75);
  };

  const wrongSound = () => {
    beep(190, 0.13, 'sawtooth', 0.04);
    setTimeout(() => beep(130, 0.13, 'sawtooth', 0.035), 80);
  };

  const winSound = () => {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => setTimeout(() => beep(n, 0.16, 'triangle', 0.06), i * 115));
  };

  const showToastMessage = (text: string, bad = false) => {
    setToastMsg(text);
    setToastBad(bad);
    setShowToast(false);
    setTimeout(() => setShowToast(true), 10);
  };

  const updateCarPosition = () => {
    if (!roadRef.current || !carRef.current) return;
    const rect = roadRef.current.getBoundingClientRect();
    const laneMin = rect.width * 0.16;
    const laneMax = rect.width * 0.84;
    const x = laneMin + (laneMax - laneMin) * carXRef.current;
    const y = rect.height * carYRef.current;
    carRef.current.style.left = x + 'px';
    carRef.current.style.top = y + 'px';
  };

  const spawnLetter = () => {
    if (!roadRef.current || gameOver || !running) {
      console.log('[LETTER RACE] Cannot spawn:', { roadRef: !!roadRef.current, gameOver, running });
      return;
    }
    const rect = roadRef.current.getBoundingClientRect();
    const safeLeft = rect.width * 0.18;
    const safeRight = rect.width * 0.82;
    const letter = Math.random() < 0.55 ? targetLetter : (targetLetter === config.letterA ? config.letterB : config.letterA);
    const x = safeLeft + Math.random() * (safeRight - safeLeft - 58);
    const y = -70; // Start above visible area for proper animation

    console.log('[LETTER RACE] Spawning letter:', letter, 'at', x, y, 'config:', config);

    lettersRef.current.push({
      id: nextIdRef.current++,
      x,
      y,
      letter,
      hit: false,
      wobble: Math.random() * Math.PI * 2,
    });
  };

  const intersects = (a: DOMRect, b: DOMRect) => {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  };

  const handleHit = (letter: Letter) => {
    letter.hit = true;

    if (letter.letter === targetLetter) {
      setScore((prev) => {
        const newScore = Math.min(config.targetGoal, prev + 1);
        if (newScore >= config.targetGoal) {
          setTimeout(() => finishGame(), 100);
        }
        return newScore;
      });
      showToastMessage('+1 правильная буква!');
      correctSound();
      speedRef.current = Math.min(290, speedRef.current + 7);
    } else {
      setMistakes((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 1));
      showToastMessage('Ой, не та буква!', true);
      wrongSound();
      carBumpRef.current = true;
      setTimeout(() => {
        carBumpRef.current = false;
      }, 220);
      carXRef.current = Math.min(0.98, Math.max(0.02, carXRef.current + (Math.random() < 0.5 ? -0.08 : 0.08)));
    }
  };

  const finishGame = () => {
    setGameOver(true);
    setRunning(false);
    setShowWin(true);
    winSound();
    if (onComplete) {
      setTimeout(() => {
        onComplete({ score, mistakes });
      }, 2000);
    }
  };

  const restartGame = (keepTarget = true) => {
    setScore(0);
    setMistakes(0);
    setGameOver(false);
    setRunning(true);
    setShowWin(false);
    spawnTimerRef.current = 0;
    speedRef.current = 210;
    carXRef.current = 0.5;
    carYRef.current = 0.79;
    vxRef.current = 0;
    vyRef.current = 0;
    lastTimeRef.current = performance.now();
    lettersRef.current = [];
    carBumpRef.current = false;
    updateCarPosition();
  };

  const setTarget = (letter: string) => {
    setTargetLetter(letter);
    restartGame(false);
  };

  const startGame = () => {
    console.log('[LETTER RACE] Starting game with config:', config);
    setRunning(true);
    setGameOver(false);
    spawnTimerRef.current = 0; // Spawn immediately
    lastTimeRef.current = performance.now();
    lettersRef.current = []; // Clear any old letters
    unlockAudio();
    beep(440, 0.08, 'triangle', 0.04);

    // Force spawn first letter immediately
    setTimeout(() => {
      if (roadRef.current) {
        spawnLetter();
        console.log('[LETTER RACE] Force spawned first letter, total letters:', lettersRef.current.length);
      }
    }, 100);
  };

  const gameLoop = (now: number) => {
    const dt = Math.min(0.033, (now - lastTimeRef.current) / 1000 || 0);
    lastTimeRef.current = now;

    if (running && !gameOver) {
      const keys = keysRef.current;
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      const up = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
      const down = keys.has('ArrowDown') || keys.has('s') || keys.has('S');

      vxRef.current = 0;
      vyRef.current = 0;
      if (left) vxRef.current -= 1;
      if (right) vxRef.current += 1;
      if (up) vyRef.current -= 1;
      if (down) vyRef.current += 1;

      carXRef.current = Math.min(1, Math.max(0, carXRef.current + vxRef.current * dt * 1.55));
      carYRef.current = Math.min(0.88, Math.max(0.58, carYRef.current + vyRef.current * dt * 0.75));
      updateCarPosition();

      spawnTimerRef.current -= dt;
      if (spawnTimerRef.current <= 0) {
        spawnLetter();
        spawnTimerRef.current = Math.max(0.62, 1.12 - score * 0.035);
      }

      if (carRef.current && roadRef.current) {
        const carRect = carRef.current.getBoundingClientRect();
        const roadRect = roadRef.current.getBoundingClientRect();

        lettersRef.current = lettersRef.current.filter((item) => {
          if (item.hit) return false;
          item.y += speedRef.current * dt;
          item.wobble += dt * 3.2;

          // Check collision
          const letterEl = document.getElementById(`letter-${item.id}`);
          if (letterEl) {
            const itemRect = letterEl.getBoundingClientRect();
            if (intersects(carRect, itemRect)) {
              handleHit(item);
              return false;
            }
            if (itemRect.top > roadRect.bottom + 80) {
              return false;
            }
          }
          return true;
        });

        // Force re-render to show updated letter positions
        forceUpdate(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
        setTarget(config.letterA);
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        setTarget(config.letterB);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
      gameLoop(performance.now());
    }, 16);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [running, gameOver, score, targetLetter]);

  useEffect(() => {
    updateCarPosition();
    window.addEventListener('resize', updateCarPosition);
    return () => window.removeEventListener('resize', updateCarPosition);
  }, []);

  useEffect(() => {
    unlockAudio();
  }, []);

  return (
    <div className="w-full h-full overflow-hidden bg-gradient-to-br from-blue-50 via-yellow-50 to-purple-50 flex items-center justify-center">
      <div className="w-full h-full grid grid-cols-[292px_1fr] gap-[18px] p-[18px]">
        {/* Left Panel */}
        <aside className="bg-white/90 backdrop-blur-sm rounded-[20px] p-3 shadow-2xl border-[3px] border-white/98 flex flex-col gap-[6px] overflow-hidden">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900 leading-tight">{config.title}</h1>
            <p className="text-xs text-gray-600 leading-snug mt-0.5">{config.subtitle}</p>
          </div>

          {/* Target Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-yellow-100 to-yellow-200 border-[2px] border-yellow-400 rounded-[16px] p-[8px] text-center">
            <div className="absolute w-[60px] h-[60px] bg-white/35 rounded-full -top-[25px] -left-[18px]" />
            <div className="absolute w-[60px] h-[60px] bg-white/35 rounded-full -bottom-[28px] -right-[22px]" />
            <div className="relative z-10 text-[11px] font-extrabold text-yellow-900 mb-0">СОБИРАЕМ БУКВУ</div>
            <div className="relative z-10 text-[52px] font-black leading-none text-gray-900" style={{ textShadow: '0 4px 0 rgba(251, 191, 36, 0.45)' }}>
              {targetLetter}
            </div>
          </div>

          {/* Letter Choice Buttons */}
          <div className="flex gap-[6px]">
            <button
              onClick={() => setTarget(config.letterA)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-[12px] px-[8px] py-1.5 text-[20px] shadow-[0_4px_0_#7c3aed] active:translate-y-1 active:shadow-[0_2px_0_#7c3aed] transition-all"
            >
              {config.letterA}
            </button>
            <button
              onClick={() => setTarget(config.letterB)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-[12px] px-[8px] py-1.5 text-[20px] shadow-[0_4px_0_#7c3aed] active:translate-y-1 active:shadow-[0_2px_0_#7c3aed] transition-all"
            >
              {config.letterB}
            </button>
          </div>

          {/* Control Buttons */}
          <button
            onClick={startGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black rounded-[12px] px-[8px] py-1.5 text-[13px] shadow-[0_4px_0_#15803d] active:translate-y-1 active:shadow-[0_2px_0_#15803d] transition-all"
          >
            ▶ Старт
          </button>

          {/* On-screen Controls */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-[12px] p-[8px]">
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-center">Управление</div>
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-40 mx-auto">
              <button
                onMouseDown={() => { keysRef.current.add('ArrowUp'); }}
                onMouseUp={() => { keysRef.current.delete('ArrowUp'); }}
                onMouseLeave={() => { keysRef.current.delete('ArrowUp'); }}
                onTouchStart={() => { keysRef.current.add('ArrowUp'); }}
                onTouchEnd={() => { keysRef.current.delete('ArrowUp'); }}
                className="col-start-2 row-start-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-black rounded-xl h-9 shadow-md border-2 border-white/75 transition active:scale-95"
              >
                ↑
              </button>
              <button
                onMouseDown={() => { keysRef.current.add('ArrowLeft'); }}
                onMouseUp={() => { keysRef.current.delete('ArrowLeft'); }}
                onMouseLeave={() => { keysRef.current.delete('ArrowLeft'); }}
                onTouchStart={() => { keysRef.current.add('ArrowLeft'); }}
                onTouchEnd={() => { keysRef.current.delete('ArrowLeft'); }}
                className="col-start-1 row-start-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-black rounded-xl h-9 shadow-md border-2 border-white/75 transition active:scale-95"
              >
                ←
              </button>
              <button
                onMouseDown={() => { keysRef.current.add('ArrowRight'); }}
                onMouseUp={() => { keysRef.current.delete('ArrowRight'); }}
                onMouseLeave={() => { keysRef.current.delete('ArrowRight'); }}
                onTouchStart={() => { keysRef.current.add('ArrowRight'); }}
                onTouchEnd={() => { keysRef.current.delete('ArrowRight'); }}
                className="col-start-3 row-start-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-black rounded-xl h-9 shadow-md border-2 border-white/75 transition active:scale-95"
              >
                →
              </button>
              <button
                onMouseDown={() => { keysRef.current.add('ArrowDown'); }}
                onMouseUp={() => { keysRef.current.delete('ArrowDown'); }}
                onMouseLeave={() => { keysRef.current.delete('ArrowDown'); }}
                onTouchStart={() => { keysRef.current.add('ArrowDown'); }}
                onTouchEnd={() => { keysRef.current.delete('ArrowDown'); }}
                className="col-start-2 row-start-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-black rounded-xl h-9 shadow-md border-2 border-white/75 transition active:scale-95"
              >
                ↓
              </button>
            </div>
          </div>
        </aside>

        {/* Road/Game Area */}
        <main className="flex items-center justify-center min-w-0 h-full">
          <div
            ref={roadRef}
            className="relative w-full max-w-[520px] h-full min-h-[540px] max-h-[704px] overflow-hidden rounded-[34px] border-[7px] border-gray-50 shadow-[0_22px_60px_rgba(15,23,42,0.26),inset_0_0_0_5px_rgba(15,23,42,0.09)]"
            style={{
              background: 'linear-gradient(90deg, #16a34a 0 10%, transparent 10% 90%, #16a34a 90% 100%), repeating-linear-gradient(0deg, #2f3542 0 38px, #363d4d 38px 76px)',
            }}
          >
            {/* Road center line */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-3 h-full opacity-90"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent 0 36px, rgba(255,255,255,0.95) 36px 88px, transparent 88px 128px)',
                WebkitAnimation: 'roadLines 0.55s linear infinite',
                animation: 'roadLines 0.55s linear infinite',
              }}
            />

            {/* Banner */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[86%] max-w-[390px] p-3 rounded-[20px] bg-white/92 border-[3px] border-gray-900/12 shadow-lg text-center z-[15] font-black text-gray-900">
              Собери {config.targetGoal} букв <span className="text-yellow-600">{targetLetter}</span>
              <small className="block mt-1 text-xs text-gray-500 font-extrabold">Неправильные буквы тормозят машинку</small>
            </div>

            {/* Toast */}
            {showToast && (
              <div
                className={`absolute z-[45] left-1/2 top-[88px] -translate-x-1/2 px-[14px] py-[9px] rounded-full font-black text-white shadow-lg ${
                  toastBad ? 'bg-red-500/95' : 'bg-green-500/95'
                }`}
                style={{
                  WebkitAnimation: 'toast 0.75s ease forwards',
                  animation: 'toast 0.75s ease forwards'
                }}
              >
                {toastMsg}
              </div>
            )}

            {/* Car */}
            <div
              ref={carRef}
              className={`absolute z-10 w-[82px] h-[126px] -translate-x-1/2 -translate-y-1/2 transition-transform ${
                carBumpRef.current ? 'animate-[carBump_0.22s_linear]' : ''
              }`}
              style={{ filter: 'drop-shadow(0 16px 14px rgba(0,0,0,0.38))' }}
            >
              {/* Wheels */}
              <div className="absolute left-0 top-5 w-5 h-[30px] rounded-lg bg-gray-900 border-[3px] border-black shadow-[inset_0_0_0_3px_#64748b]" />
              <div className="absolute right-0 top-5 w-5 h-[30px] rounded-lg bg-gray-900 border-[3px] border-black shadow-[inset_0_0_0_3px_#64748b]" />
              <div className="absolute left-0 bottom-4 w-5 h-[30px] rounded-lg bg-gray-900 border-[3px] border-black shadow-[inset_0_0_0_3px_#64748b]" />
              <div className="absolute right-0 bottom-4 w-5 h-[30px] rounded-lg bg-gray-900 border-[3px] border-black shadow-[inset_0_0_0_3px_#64748b]" />

              {/* Car Body */}
              <div className="absolute left-[10px] top-[7px] w-[62px] h-[112px] rounded-t-[28px] rounded-b-[22px] bg-gradient-to-b from-rose-400 via-red-500 to-red-800 border-[4px] border-red-900 overflow-hidden">
                {/* Windshield */}
                <div className="absolute left-[13px] top-[13px] w-[28px] h-[31px] rounded-t-[14px] rounded-b-lg bg-gradient-to-b from-blue-100 to-blue-400 border-[3px] border-gray-900/45" />
                {/* Star */}
                <div className="absolute left-1/2 top-[57px] -translate-x-1/2 text-yellow-200 text-2xl">★</div>
                {/* Headlights */}
                <div className="absolute z-[2] top-[5px] left-[17px] w-3 h-[11px] rounded-full bg-yellow-100 shadow-[0_0_18px_#fde047]" />
                <div className="absolute z-[2] top-[5px] right-[17px] w-3 h-[11px] rounded-full bg-yellow-100 shadow-[0_0_18px_#fde047]" />
              </div>
            </div>

            {/* Letters */}
            {lettersRef.current.map((letter) => {
              const wobbleX = Math.sin(letter.wobble) * 6;
              const isGood = letter.letter === targetLetter;
              return (
                <div
                  key={letter.id}
                  id={`letter-${letter.id}`}
                  className={`absolute z-[8] w-[58px] h-[58px] rounded-full flex items-center justify-center text-[36px] font-black text-gray-900 border-4 shadow-lg transition-all ${
                    letter.hit ? 'opacity-0 scale-[1.65] rotate-[16deg]' : ''
                  } ${
                    isGood
                      ? 'border-green-500 bg-gradient-to-br from-green-100 to-green-300'
                      : 'border-orange-500 bg-gradient-to-br from-orange-100 to-orange-300'
                  }`}
                  style={{
                    left: `${letter.x}px`,
                    top: `${letter.y}px`,
                    transform: `translateX(${wobbleX}px)`,
                  }}
                >
                  {letter.letter}
                </div>
              );
            })}

            {/* Win Overlay */}
            {showWin && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-[26px] bg-gray-900/55 backdrop-blur">
                <div className="w-[88%] max-w-[390px] rounded-[32px] bg-white p-[26px] text-center border-[5px] border-yellow-400 shadow-2xl animate-[winPop_0.38s_cubic-bezier(0.22,1.35,0.36,1)_forwards]">
                  <h2 className="text-4xl text-gray-900 font-bold mb-3">Финиш! 🏁</h2>
                  <p className="text-gray-600 text-base leading-relaxed mb-5">
                    Ты собрал(а) {config.targetGoal} правильных букв. Машинка довольна!
                  </p>
                  <button
                    onClick={() => restartGame()}
                    className="bg-green-600 hover:bg-green-700 text-white font-black rounded-[17px] px-8 py-3 text-[15px] shadow-[0_7px_0_#15803d] active:translate-y-1 active:shadow-[0_3px_0_#15803d] transition-all"
                  >
                    Играть ещё раз
                  </button>
                </div>
              </div>
            )}

            {/* Light overlay effect */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.35), transparent 18%, transparent 82%, rgba(255,255,255,0.35)), radial-gradient(circle at 15% 5%, rgba(255,255,255,0.18), transparent 23%)',
              }}
            />
          </div>
        </main>
      </div>

      <style>{`
        @keyframes roadLines {
          from { transform: translateY(-128px); }
          to { transform: translateY(0); }
        }
        @-webkit-keyframes roadLines {
          from { -webkit-transform: translateY(-128px); transform: translateY(-128px); }
          to { -webkit-transform: translateY(0); transform: translateY(0); }
        }
        @keyframes carBump {
          0%, 100% { filter: drop-shadow(0 16px 14px rgba(0,0,0,0.38)); }
          35% { filter: drop-shadow(0 16px 14px rgba(239,68,68,0.65)); transform: translate(-50%, -50%) rotate(-7deg) scale(0.98); }
          70% { transform: translate(-50%, -50%) rotate(7deg) scale(0.98); }
        }
        @-webkit-keyframes carBump {
          0%, 100% { -webkit-filter: drop-shadow(0 16px 14px rgba(0,0,0,0.38)); filter: drop-shadow(0 16px 14px rgba(0,0,0,0.38)); }
          35% { -webkit-filter: drop-shadow(0 16px 14px rgba(239,68,68,0.65)); filter: drop-shadow(0 16px 14px rgba(239,68,68,0.65)); -webkit-transform: translate(-50%, -50%) rotate(-7deg) scale(0.98); transform: translate(-50%, -50%) rotate(-7deg) scale(0.98); }
          70% { -webkit-transform: translate(-50%, -50%) rotate(7deg) scale(0.98); transform: translate(-50%, -50%) rotate(7deg) scale(0.98); }
        }
        @keyframes toast {
          0% { opacity: 0; transform: translate(-50%, 12px) scale(0.92); }
          15%, 78% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -12px) scale(0.96); }
        }
        @-webkit-keyframes toast {
          0% { opacity: 0; -webkit-transform: translate(-50%, 12px) scale(0.92); transform: translate(-50%, 12px) scale(0.92); }
          15%, 78% { opacity: 1; -webkit-transform: translate(-50%, 0) scale(1); transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; -webkit-transform: translate(-50%, -12px) scale(0.96); transform: translate(-50%, -12px) scale(0.96); }
        }
        @keyframes winPop {
          from { opacity: 0; transform: scale(0.72) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @-webkit-keyframes winPop {
          from { opacity: 0; -webkit-transform: scale(0.72) translateY(20px); transform: scale(0.72) translateY(20px); }
          to { opacity: 1; -webkit-transform: scale(1) translateY(0); transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LetterRaceGame;
