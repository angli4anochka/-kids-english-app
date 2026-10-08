'use client';

import { useMemo, useState } from 'react';

export interface BubbleConfig {
  title: string;
  instruction: string;
  items: string[];
  rounds: number;
}

export interface BubbleResult {
  score: number;
  total: number;
  mistakes: number;
}

interface Props {
  config: BubbleConfig;
  onComplete?: (result: BubbleResult) => void;
}

const shuffle = <T,>(values: T[]) => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default function BubbleGame({ config, onComplete }: Props) {
  const items = useMemo(() => [...new Set(config.items.map(v => v.trim()).filter(Boolean))], [config.items]);
  const total = Math.max(1, Math.min(config.rounds || items.length, 50));
  const targets = useMemo(() => {
    const result: string[] = [];
    while (result.length < total) result.push(...shuffle(items));
    return result.slice(0, total);
  }, [items, total]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const target = targets[round] || items[0] || '';
  const options = useMemo(() => shuffle([target, ...shuffle(items.filter(item => item !== target)).slice(0, 5)]), [items, round, target]);
  const bubbleLayout = useMemo(() => {
    const slots = [
      { left: 15, top: 25 }, { left: 49, top: 20 }, { left: 82, top: 27 },
      { left: 18, top: 73 }, { left: 52, top: 78 }, { left: 84, top: 70 },
    ];
    return shuffle(slots).map((slot, index) => ({
      left: Math.max(10, Math.min(90, slot.left + (Math.random() * 8 - 4))),
      top: Math.max(15, Math.min(85, slot.top + (Math.random() * 10 - 5))),
      scale: .88 + Math.random() * .2,
      drift: 3 + index * .25 + Math.random() * .6,
    }));
  }, [round]);

  const choose = (value: string) => {
    if (finished || wrong.includes(value)) return;
    if (value !== target) {
      setWrong(current => [...current, value]);
      setMistakes(current => current + 1);
      return;
    }
    const nextScore = score + 1;
    setScore(nextScore);
    if (round + 1 >= total) {
      setFinished(true);
      onComplete?.({ score: nextScore, total, mistakes });
    } else {
      setRound(current => current + 1);
      setWrong([]);
    }
  };

  if (items.length < 6) {
    return <div className="grid h-full place-items-center bg-sky-50 p-6 text-center font-bold text-slate-700">Добавьте минимум 6 разных слов или букв.</div>;
  }

  if (finished) {
    return (
      <div className="grid h-full place-items-center overflow-hidden p-6 text-white" style={{ background: 'radial-gradient(circle at top, #9fe8ff 0%, #60d1ff 15%, #1e7bc4 45%, #0f3f85 72%, #081b45 100%)' }}>
        <div className="rounded-[2rem] border border-white/40 bg-white/20 px-10 py-8 text-center shadow-2xl backdrop-blur-md">
          <div className="text-7xl">🫧</div>
          <h2 className="mt-3 text-4xl font-black">Готово!</h2>
          <p className="mt-3 text-2xl font-bold">{score} / {total}</p>
          <p className="mt-2 text-white/85">Ошибок: {mistakes}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden p-4 text-white" style={{ background: 'radial-gradient(circle at top, #9fe8ff 0%, #60d1ff 15%, #1e7bc4 45%, #0f3f85 72%, #081b45 100%)' }}>
      <style>{`
        @keyframes bubbleFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.04)}}
        @keyframes bubbleShimmer{from{transform:translateY(0)}to{transform:translateY(-40px)}}
        @keyframes ambientRise{0%{transform:translateY(18vh) scale(.7);opacity:0}15%{opacity:.38}85%{opacity:.28}100%{transform:translateY(-115vh) scale(1.2);opacity:0}}
        .bubble-ambient{position:absolute;bottom:-18%;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.9),rgba(255,255,255,.28) 45%,rgba(255,255,255,.02) 85%);border:1px solid rgba(255,255,255,.24);box-shadow:inset 2px 2px 6px rgba(255,255,255,.25);animation:ambientRise linear infinite}
        .bubble-option{
          position:relative; isolation:isolate; overflow:hidden; border:1px solid rgba(255,255,255,.28)!important;
          background:rgba(88,198,255,.08)!important;
          box-shadow:inset -10px -16px 26px rgba(255,255,255,.16),inset 10px 10px 24px rgba(255,255,255,.28),0 14px 30px rgba(7,27,69,.26)!important;
        }
        .bubble-option::before{
          content:"";position:absolute;inset:0;border-radius:50%;z-index:-1;
          background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.95) 0 4%,rgba(255,255,255,.5) 5%,transparent 16%),radial-gradient(circle at 44% 38%,rgba(255,255,255,.3) 0 8%,transparent 18%),radial-gradient(circle at 60% 70%,rgba(255,255,255,.15) 0 8%,transparent 24%),radial-gradient(circle at 65% 70%,rgba(85,235,255,.32),rgba(25,90,190,.10) 60%,rgba(255,255,255,.02) 100%);
        }
        .bubble-option::after{content:"";position:absolute;left:18%;top:16%;width:20%;height:20%;border-radius:50%;background:rgba(255,255,255,.85);filter:blur(1px);opacity:.9;z-index:-1}
        .bubble-option:hover{filter:brightness(1.12)}
        .bubble-option.bubble-wrong{background:rgba(248,113,113,.28)!important;border-color:rgba(254,202,202,.8)!important}
      `}</style>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 15%,rgba(255,255,255,.35) 0,rgba(255,255,255,.08) 10%,transparent 30%),radial-gradient(circle at 80% 20%,rgba(255,255,255,.24) 0,rgba(255,255,255,.06) 8%,transparent 28%),radial-gradient(circle at 70% 75%,rgba(255,255,255,.18) 0,rgba(255,255,255,.04) 10%,transparent 25%),linear-gradient(to bottom,rgba(255,255,255,.10),transparent 18%)', mixBlendMode: 'screen' }} />
      <div className="pointer-events-none absolute -inset-y-10 inset-x-0 opacity-55" style={{ background: 'radial-gradient(circle at 10% 90%,rgba(255,255,255,.12) 0 2px,transparent 3px) 0 0/130px 130px,radial-gradient(circle at 60% 70%,rgba(255,255,255,.10) 0 2px,transparent 3px) 0 0/160px 160px', animation: 'bubbleShimmer 14s linear infinite' }} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} className="bubble-ambient" style={{ left: `${3 + ((index * 37) % 94)}%`, width: `${10 + (index % 5) * 5}px`, height: `${10 + (index % 5) * 5}px`, animationDuration: `${7 + (index % 6) * 1.4}s`, animationDelay: `${-index * .9}s` }} />
        ))}
      </div>
      <header className="z-10 flex items-start justify-between gap-4">
        <div><h2 className="text-2xl font-black md:text-4xl">{config.title || 'Bubble'}</h2><p className="font-semibold text-white/80">{config.instruction || 'Найди правильный пузырь'}</p></div>
        <div className="rounded-full bg-white/20 px-4 py-2 font-black backdrop-blur">{round + 1} / {total}</div>
      </header>
      <section className="z-10 mx-auto mt-2 rounded-3xl border border-white/50 bg-white/20 px-8 py-3 text-center shadow-xl backdrop-blur-md">
        <div className="text-xs font-black uppercase tracking-[.2em] text-white/75">Найди</div>
        <div className="break-words text-3xl font-black md:text-5xl">{target}</div>
      </section>
      <div className="relative z-10 min-h-0 flex-1 py-2">
        {options.map((option, index) => {
          const isWrong = wrong.includes(option);
          const position = bubbleLayout[index];
          return (
            <div key={`${round}-${option}`} className="absolute" style={{ left: `${position.left}%`, top: `${position.top}%`, transform: `translate(-50%,-50%) scale(${position.scale})` }}>
              <button onClick={() => choose(option)} disabled={isWrong}
                className={`bubble-option grid aspect-square w-[min(27vw,18vh,170px)] place-items-center rounded-full p-3 text-center font-black transition ${isWrong ? 'bubble-wrong scale-75 opacity-25' : 'hover:scale-110 active:scale-95'}`}
                style={{ animation: isWrong ? 'none' : `bubbleFloat ${position.drift}s ease-in-out ${index * .12}s infinite` }}>
                <span className="max-w-full break-words text-lg leading-tight md:text-2xl">{option}</span>
              </button>
            </div>
          );
        })}
      </div>
      <footer className="z-10 flex justify-between text-sm font-bold text-white/85"><span>Очки: {score}</span><span>Ошибки: {mistakes}</span></footer>
      <div className="pointer-events-none absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-pink-300/20 blur-2xl" />
    </div>
  );
}
