'use client';

import { useMemo, useRef, useState } from 'react';

export interface FlashlightItem { word: string; icon?: string }
export interface FlashlightConfig {
  title: string;
  instruction: string;
  targets: FlashlightItem[];
  decoys: FlashlightItem[];
}
export interface FlashlightResult { score: number; total: number; mistakes: number; found: string[] }

interface Props { config: FlashlightConfig; onComplete?: (result: FlashlightResult) => void }

const icons = ['📘', '✏️', '🔬', '🎨', '🌍', '🎵', '💻', '⚽', '🧩', '⭐', '🍎', '🚂'];

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

function shuffle<T>(items: T[], seed: number) {
  const copy = [...items];
  let state = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlashlightGame({ config, onComplete }: Props) {
  const normalizedTargets = config.targets.filter(item => item.word.trim());
  const total = normalizedTargets.length;
  const key = JSON.stringify(config.targets) + JSON.stringify(config.decoys);
  const cards = useMemo(() => shuffle([
    ...normalizedTargets.map((item, i) => ({ ...item, target: true, id: `t-${i}-${item.word}` })),
    ...config.decoys.filter(item => item.word.trim()).map((item, i) => ({ ...item, target: false, id: `d-${i}-${item.word}` })),
  ], hash(key)), [key]);
  const [found, setFound] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState('');
  const [done, setDone] = useState(false);
  const [lamp, setLamp] = useState({ x: 50, y: 55 });
  const sent = useRef(false);

  const moveLamp = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLamp({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  const choose = (card: typeof cards[number]) => {
    if (done || found.includes(card.id)) return;
    if (!card.target) {
      setMistakes(value => value + 1);
      setWrong(card.id);
      window.setTimeout(() => setWrong(''), 450);
      return;
    }
    const next = [...found, card.id];
    setFound(next);
    if (next.length === total) {
      setDone(true);
      if (!sent.current) {
        sent.current = true;
        onComplete?.({ score: Math.max(0, total - mistakes), total, mistakes, found: normalizedTargets.map(item => item.word) });
      }
    }
  };

  return (
    <div className="h-full min-h-[480px] overflow-hidden rounded-2xl bg-[#081225] text-white flex flex-col select-none">
      <header className="shrink-0 px-4 py-3 text-center bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 text-slate-900 shadow-lg z-30">
        <div className="text-xl sm:text-2xl font-black tracking-wide">🔦 {config.title || 'Flashlight'}</div>
        <div className="text-xs sm:text-sm font-semibold">{config.instruction || 'Найди все нужные слова'}</div>
      </header>
      <div className="shrink-0 flex justify-center gap-5 py-2 text-sm font-bold bg-slate-900/90 z-30">
        <span>Найдено: <b className="text-yellow-300">{found.length}/{total}</b></span>
        <span>Ошибки: <b className="text-rose-300">{mistakes}</b></span>
      </div>
      <div className="relative flex-1 min-h-0 cursor-none touch-none" onPointerMove={moveLamp} onPointerDown={moveLamp}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,#243763_0,transparent_32%),radial-gradient(circle_at_80%_75%,#17294a_0,transparent_30%),linear-gradient(#101b35,#050914)]" />
        <div className="absolute inset-0 p-4 grid grid-cols-3 sm:grid-cols-4 gap-2 place-items-center">
          {cards.map((card, index) => {
            const isFound = found.includes(card.id);
            return (
              <button key={card.id} onClick={() => choose(card)} style={{ transform: `translate(${(hash(card.id) % 17) - 8}px, ${(hash(card.id + 'y') % 15) - 7}px) rotate(${(hash(card.id + 'r') % 9) - 4}deg)` }}
                className={`relative w-full max-w-[150px] min-h-[66px] rounded-2xl border-2 px-2 py-1 transition-all ${isFound ? 'z-30 pointer-events-none border-yellow-200 bg-gradient-to-br from-yellow-100 to-amber-300 text-slate-900 scale-105 shadow-[0_0_16px_6px_rgba(253,224,71,.75)]' : wrong === card.id ? 'border-red-400 bg-red-500/35 animate-pulse' : 'border-sky-200/30 bg-white/10 hover:scale-105'}`}>
                <span className="block text-xl sm:text-2xl">{card.icon || icons[index % icons.length]}</span>
                <span className="block text-sm sm:text-base font-black break-words">{card.word}</span>
              </button>
            );
          })}
        </div>
        <div className="absolute inset-0 pointer-events-none z-20" style={{ background: `radial-gradient(circle 58px at ${lamp.x}% ${lamp.y}%, transparent 0, rgba(1,5,15,.06) 60%, rgba(1,5,15,.96) 100%)` }} />
        <div className="absolute pointer-events-none z-20 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-100/80 shadow-[0_0_10px_4px_rgba(255,240,140,.35)]" style={{ left: `${lamp.x}%`, top: `${lamp.y}%` }} />
        {done && <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/75 cursor-default">
          <div className="rounded-3xl bg-white text-slate-900 p-7 text-center shadow-2xl mx-4">
            <div className="text-5xl mb-2">🌟</div><div className="text-2xl font-black">Все найдено!</div>
            <div className="mt-1 text-slate-600">Ошибок: {mistakes}</div>
          </div>
        </div>}
      </div>
    </div>
  );
}
