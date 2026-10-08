'use client';

import { useEffect, useState } from 'react';

type Student = { id: number | string; student_name: string };

type Props = {
  groupId: number;
  topic: string;
  onDone: () => Promise<void>;
  onCancel: () => void;
};

export default function TutorDeskCompletionModal({ groupId, topic, onDone, onCancel }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [homework, setHomework] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('tutorsdesk_token') || '');
    fetch(`/kids-api/groups/${groupId}`).then(r => r.json()).then(data => {
      const list = data?.data?.students || [];
      setStudents(list);
      setPresent(Object.fromEntries(list.map((student: Student) => [String(student.id), true])));
    }).catch(() => setError('Не удалось загрузить учеников группы'));
  }, [groupId]);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      let accessToken = token;
      if (!accessToken) {
        const loginResponse = await fetch('/kids-api/tutorsdesk/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok || !loginData.success) throw new Error(loginData.error || 'Не удалось подключить TutorDesk');
        accessToken = loginData.token;
        localStorage.setItem('tutorsdesk_token', accessToken);
        setToken(accessToken);
      }

      const response = await fetch('/kids-api/tutorsdesk/lesson-completion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          groupId,
          topic,
          homework,
          attendance: students.map(student => ({
            name: student.student_name,
            status: present[String(student.id)] ? 'PRESENT' : 'ABSENT',
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 401) {
          localStorage.removeItem('tutorsdesk_token');
          setToken('');
        }
        throw new Error(data.error || 'Ошибка синхронизации TutorDesk');
      }
      if (data.unmatched?.length) {
        alert(`Урок сохранён. Не найдены в TutorDesk: ${data.unmatched.join(', ')}`);
      }
      await onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ошибка TutorDesk');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Завершение урока · TutorDesk</h2>
          <button onClick={onCancel} className="text-2xl text-slate-400">×</button>
        </div>
        {!token && <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <div className="mb-2 font-semibold text-blue-900">Подключить tutorsdesk.ru</div>
          <input className="mb-2 w-full rounded-lg border p-2" type="email" placeholder="Email TutorDesk" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border p-2" type="password" placeholder="Пароль TutorDesk" value={password} onChange={e => setPassword(e.target.value)} />
        </div>}
        {token && <div className="mt-4 flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><span>✓ TutorDesk подключён</span><button onClick={() => { localStorage.removeItem('tutorsdesk_token'); setToken(''); }} className="underline">Сменить аккаунт</button></div>}
        <div className="mt-5 font-semibold">Кто присутствовал</div>
        <div className="mt-2 space-y-2">
          {students.map(student => <label key={student.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <input type="checkbox" checked={present[String(student.id)] ?? true} onChange={e => setPresent(old => ({ ...old, [String(student.id)]: e.target.checked }))} />
            <span>{student.student_name}</span>
          </label>)}
        </div>
        <label className="mt-5 block font-semibold">Домашнее задание</label>
        <textarea className="mt-2 min-h-28 w-full rounded-xl border p-3" value={homework} onChange={e => setHomework(e.target.value)} placeholder="Что сделать к следующему уроку" />
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={saving || (!token && (!email || !password))} onClick={submit} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-40">{saving ? 'Сохраняю…' : 'Сохранить в TutorDesk и завершить'}</button>
          <button disabled={saving} onClick={onDone} className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700">Пропустить TutorDesk</button>
        </div>
      </div>
    </div>
  );
}