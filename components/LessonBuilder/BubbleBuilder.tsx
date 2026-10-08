'use client';

import { useMemo, useState } from 'react';
import type { BubbleConfig } from './BubbleGame';

interface Props { initialConfig?: BubbleConfig; onSave: (config: BubbleConfig) => void; }

const DEFAULT_ITEMS = ['cat', 'dog', 'book', 'pen', 'ruler', 'desk'];

export default function BubbleBuilder({ initialConfig, onSave }: Props) {
  const [title, setTitle] = useState(initialConfig?.title || 'Bubble');
  const [instruction, setInstruction] = useState(initialConfig?.instruction || 'Найди слово или букву');
  const [rawItems, setRawItems] = useState((initialConfig?.items || DEFAULT_ITEMS).join('\n'));
  const [rounds, setRounds] = useState(initialConfig?.rounds || 10);
  const items = useMemo(() => [...new Set(rawItems.split(/[\n,;]/).map(v => v.trim()).filter(Boolean))], [rawItems]);
  const valid = items.length >= 6;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-cyan-50 to-violet-100 p-4">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-3xl font-black text-slate-800">🫧 Конструктор Bubble</h2>
        <p className="mt-1 text-sm text-slate-500">Введите минимум 6 разных слов или букв. В каждом раунде будет 1 правильный и 5 неверных пузырей.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="font-bold text-slate-700">Название<input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-blue-500" /></label>
          <label className="font-bold text-slate-700">Инструкция<input value={instruction} onChange={e => setInstruction(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-blue-500" /></label>
        </div>
        <label className="mt-4 block font-bold text-slate-700">Слова или буквы<textarea value={rawItems} onChange={e => setRawItems(e.target.value)} rows={9} placeholder={'A\nB\nC\nD\nE\nF'} className="mt-1 w-full resize-y rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-blue-500" /></label>
        <div className="mt-2 flex items-center justify-between text-sm"><span className={valid ? 'font-bold text-emerald-600' : 'font-bold text-red-600'}>Уникальных вариантов: {items.length} {valid ? '✓' : '(нужно минимум 6)'}</span><span className="text-slate-400">Разделители: новая строка, запятая, ;</span></div>
        <label className="mt-4 block font-bold text-slate-700">Количество раундов: {rounds}<input type="range" min={1} max={30} value={rounds} onChange={e => setRounds(Number(e.target.value))} className="mt-2 w-full" /></label>
        <button disabled={!valid} onClick={() => onSave({ title: title.trim() || 'Bubble', instruction: instruction.trim(), items, rounds })} className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-lg font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">Сохранить Bubble</button>
      </div>
    </div>
  );
}
