'use client';
import { useState } from 'react';

const slides = [
  {
    key: 'title',
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
        <div
          className="bg-[#fffdf8] border-4 border-[#dc9a54] rounded-3xl px-10 py-7 shadow-xl"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <h1
            className="m-0 text-[#00bfa6] font-bold leading-none tracking-wide"
            style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif', fontSize: 'clamp(48px,7vw,80px)' }}
          >
            the verb "be"
          </h1>
        </div>
        <div
          className="text-4xl font-extrabold"
          style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}
        >
          <span className="text-[#ef233c]">am</span> /{' '}
          <span className="text-[#ef233c]">is</span> /{' '}
          <span className="text-[#ef233c]">are</span> / was / were
        </div>
        <div
          className="bg-white border-l-8 border-[#00bfa6] rounded-2xl px-7 py-5 shadow-lg text-[#6b5b4c] max-w-xl text-xl leading-relaxed"
        >
          The verb <b>be</b> is one of the most important verbs in English. We use it to describe people and things, talk about places, and build other grammar structures.
        </div>
      </div>
    ),
  },
  {
    key: 'rule1',
    content: (
      <div className="flex flex-col h-full px-6 py-4 gap-4">
        <div className="flex gap-4 items-start bg-gradient-to-r from-orange-100 to-transparent rounded-2xl px-6 py-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00bfa6] text-white text-2xl font-bold grid place-items-center shadow-md">1</div>
          <p className="text-2xl font-bold leading-snug m-0" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>
            We can use adjectives, nouns or expressions of place after <span className="text-[#ef233c]">be</span>.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[
            { text: <>She <span className="text-[#ef233c]">is</span> late.</>, sub: 'be + adjective' },
            { text: <>I<span className="text-[#ef233c]">'m</span> hungry.</>, sub: 'be + adjective' },
            { text: <><span className="text-[#ef233c]">Are</span> you a doctor?</>, sub: 'be + noun' },
            { text: <><span className="text-[#ef233c]">Is</span> everybody here?</>, sub: 'be + place' },
          ].map((ex, i) => (
            <div key={i} className="bg-white border-2 border-dashed border-[#dc9a54] rounded-2xl px-5 py-4 shadow-sm flex flex-col justify-between">
              <span className="text-2xl font-bold" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>{ex.text}</span>
              <span className="text-sm text-[#6b5b4c] mt-2">{ex.sub}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'rule2',
    content: (
      <div className="flex flex-col h-full px-6 py-4 gap-4">
        <div className="flex gap-4 items-start bg-gradient-to-r from-orange-100 to-transparent rounded-2xl px-6 py-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00bfa6] text-white text-2xl font-bold grid place-items-center shadow-md">2</div>
          <p className="text-2xl font-bold leading-snug m-0" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>
            We use <span className="text-[#3b82f6]">there is</span> / <span className="text-[#3b82f6]">there are</span> to introduce things and say that they exist.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[
            { text: <><span className="text-[#3b82f6]">There's</span> a strange woman at the door.</>, sub: 'one thing / one person' },
            { text: <><span className="text-[#3b82f6]">There are</span> some letters for you.</>, sub: 'more than one thing' },
          ].map((ex, i) => (
            <div key={i} className="bg-white border-2 border-dashed border-[#dc9a54] rounded-2xl px-5 py-4 shadow-sm flex flex-col justify-between">
              <span className="text-2xl font-bold" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>{ex.text}</span>
              <span className="text-sm text-[#6b5b4c] mt-2">{ex.sub}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'rule3',
    content: (
      <div className="flex flex-col h-full px-6 py-4 gap-4">
        <div className="flex gap-4 items-start bg-gradient-to-r from-orange-100 to-transparent rounded-2xl px-6 py-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00bfa6] text-white text-2xl font-bold grid place-items-center shadow-md">3</div>
          <p className="text-2xl font-bold leading-snug m-0" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>
            <span className="text-[#ef233c]">Be</span> can be an auxiliary verb in progressive tenses and passives.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[
            { text: <>She <span className="text-[#ef233c]">is</span> working.</>, sub: 'be + verb-ing' },
            { text: <>It <span className="text-[#ef233c]">was</span> made in Hong Kong.</>, sub: 'be + past participle' },
          ].map((ex, i) => (
            <div key={i} className="bg-white border-2 border-dashed border-[#dc9a54] rounded-2xl px-5 py-4 shadow-sm flex flex-col justify-between">
              <span className="text-2xl font-bold" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>{ex.text}</span>
              <span className="text-sm text-[#6b5b4c] mt-2">{ex.sub}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'remember',
    content: (
      <div className="flex items-center justify-center h-full px-6">
        <div className="bg-[#102a2a] text-white rounded-3xl px-10 py-10 shadow-2xl max-w-lg text-center">
          <h2 className="text-[#ffe76a] text-4xl font-bold mb-4 m-0">Remember</h2>
          <p className="text-2xl leading-relaxed m-0" style={{ fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif' }}>
            In many sentences, <b>be</b> does not show an action. It connects the subject with information about it.
          </p>
        </div>
      </div>
    ),
  },
];

export default function SpotlightVerbBeSlides() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  const go = (next: number, direction: 'left' | 'right') => {
    if (animating || next === current) return;
    setDir(direction);
    setAnimating(true);
    setCurrent(next);
    setTimeout(() => setAnimating(false), 380);
  };

  const prev = () => current > 0 && go(current - 1, 'left');
  const next = () => current < slides.length - 1 && go(current + 1, 'right');

  // During transition we show a strip of all slides shifted by translateX
  // The strip is: [0, 1, 2, ...] each 100% wide, total width = slides.length * 100%
  // We shift by -current * 100% to show the right one
  const offset = current * 100;

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        background: 'radial-gradient(circle at top left, rgba(255,219,165,0.55), transparent 32%), radial-gradient(circle at bottom right, rgba(0,191,166,0.12), transparent 34%), #fff8ef',
        fontFamily: '"Comic Sans MS", Trebuchet MS, Arial, sans-serif',
      }}
    >
      {/* Slide viewport */}
      <div className="flex-1 relative overflow-hidden">
        {/* Inner strip — all slides side by side, moves smoothly */}
        <div
          className="absolute inset-y-0 left-0 flex"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${offset / slides.length}%)`,
            transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              className="relative h-full"
              style={{ width: `${100 / slides.length}%` }}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/70 border-t border-orange-200">
        <button
          onClick={prev}
          disabled={current === 0 || animating}
          className="px-5 py-2 rounded-xl font-bold text-lg bg-[#dc9a54] text-white disabled:opacity-30 hover:bg-[#c4873f] transition"
        >
          ← Назад
        </button>

        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? 'right' : 'left')}
              className="w-3 h-3 rounded-full transition-all duration-300"
              style={{ background: i === current ? '#00bfa6' : '#dc9a54', opacity: i === current ? 1 : 0.4 }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1 || animating}
          className="px-5 py-2 rounded-xl font-bold text-lg bg-[#00bfa6] text-white disabled:opacity-30 hover:bg-[#009a88] transition"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}
