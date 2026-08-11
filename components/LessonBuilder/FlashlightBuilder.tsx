'use client';

import { useState } from 'react';
import type { FlashlightConfig, FlashlightItem } from './FlashlightGame';

interface Props { initialConfig: FlashlightConfig; onSave: (config: FlashlightConfig) => void }
const toText = (items: FlashlightItem[]) => items.map(item => `${item.word}${item.icon ? ` | ${item.icon}` : ''}`).join('\n');
const parse = (text: string) => text.split('\n').map(line => { const [word, icon] = line.split('|'); return { word: word?.trim() || '', icon: icon?.trim() || undefined }; }).filter(item => item.word);

export default function FlashlightBuilder({ initialConfig, onSave }: Props) {
  const [title, setTitle] = useState(initialConfig.title);
  const [instruction, setInstruction] = useState(initialConfig.instruction);
  const [targets, setTargets] = useState(toText(initialConfig.targets));
  const [decoys, setDecoys] = useState(toText(initialConfig.decoys));
  const [error, setError] = useState('');
  const save = () => {
    const targetItems = parse(targets); const decoyItems = parse(decoys);
    if (targetItems.length < 2) return setError('Добавьте минимум 2 правильных слова.');
    if (decoyItems.length < 2) return setError('Добавьте минимум 2 отвлекающих варианта.');
    setError(''); onSave({ title: title.trim() || 'Flashlight', instruction: instruction.trim(), targets: targetItems, decoys: decoyItems });
  };
  return <div className="h-full overflow-y-auto bg-slate-50 p-5 text-slate-900">
    <div className="mx-auto max-w-3xl space-y-4">
      <div><h2 className="text-2xl font-black">🔦 Конструктор Flashlight</h2><p className="text-sm text-slate-500">Ученик водит фонариком и ищет только правильные слова.</p></div>
      <label className="block font-bold">Название<input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
      <label className="block font-bold">Инструкция<input value={instruction} onChange={e => setInstruction(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block font-bold">Правильные слова<textarea value={targets} onChange={e => setTargets(e.target.value)} rows={9} className="mt-1 w-full rounded-xl border border-emerald-300 p-3 font-normal" /><span className="text-xs text-slate-500">Одно на строке. Можно: English | 📘</span></label>
        <label className="block font-bold">Отвлекающие варианты<textarea value={decoys} onChange={e => setDecoys(e.target.value)} rows={9} className="mt-1 w-full rounded-xl border border-rose-300 p-3 font-normal" /><span className="text-xs text-slate-500">Неверные слова, по одному на строке.</span></label>
      </div>
      {error && <div className="rounded-xl bg-rose-100 p-3 font-bold text-rose-700">{error}</div>}
      <button onClick={save} className="rounded-xl bg-violet-600 px-7 py-3 font-bold text-white hover:bg-violet-700">Сохранить игру</button>
    </div>
  </div>;
}
