'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';
import ActivityRenderer from '../components/LessonBuilder/ActivityRenderer';
import HskDictionary from '../components/HskDictionary';
import { HSK_LESSON_NUMBER } from '../data/hskVocabulary';
import type { Activity } from '../types';

interface Props { lessonId: string }

type StageAnswer = { prompt: string; studentAnswer: string; correctAnswer?: string; isCorrect: boolean | null; answerType?: string };
type StageResult = { version?: number; stage: number; title: string; answers: StageAnswer[]; score: number; total: number; writtenCount: number };

const transformActivities = (items: any[]): Activity[] => items
  .map((activity: any) => {
    const contentData = activity.content_data || {};
    return {
      ...activity,
      ...contentData,
      wordwallUrl: activity.type === 'wordwall' ? activity.content_url : contentData.wordwallUrl,
      presentationUrl: activity.type === 'presentation' ? activity.content_url : contentData.presentationUrl,
      geniallyUrl: activity.type === 'genially' ? activity.content_url : contentData.geniallyUrl,
      videoUrl: (activity.type === 'video' || activity.type === 'internal-video') ? activity.content_url : contentData.videoUrl,
      imageUrl: contentData.imageUrl || (activity.type === 'image' ? activity.content_url : undefined),
    };
  })
  .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

export default function HskSelfStudyScreen({ lessonId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lessonTitle, setLessonTitle] = useState('HSK 3');
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Record<number, StageResult>>({});
  const [showReport, setShowReport] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [showDictionary, setShowDictionary] = useState(false);
  const [showInitialReview, setShowInitialReview] = useState(false);
  const storageKey = `hsk-self-study:${lessonId}:stage`;
  const resultsKey = `hsk-self-study:${lessonId}:results`;
  const isLesson2 = lessonId === '49a8746c-9112-4977-a75b-b010ed7aa38c';
  const isLesson3 = lessonId === '16337e33-6d3f-41f1-8b79-d8d2b730eb32';
  const sharedResultsKey = isLesson3 ? 'hsk3-l3-stage-results' : isLesson2 ? 'hsk3-l2-stage-results' : 'hsk3-l1-stage-results';

  useEffect(() => {
    if (!user || (HSK_LESSON_NUMBER[lessonId] || 1) <= 1) return;
    const key = `hsk-review-opened:${(user as any).id}:${lessonId}`;
    if (!sessionStorage.getItem(key)) setShowInitialReview(true);
  }, [lessonId, user]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(resultsKey) || '{}');
      if (saved?.[38]?.version !== 2) delete saved[38];
      if (saved && typeof saved === 'object') setResults(saved);
    } catch {}
    const receiveResult = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'hsk-stage-result') return;
      const item = event.data as StageResult;
      setResults(previous => {
        const next = { ...previous, [item.stage]: item };
        localStorage.setItem(resultsKey, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener('message', receiveResult);
    const syncStoredResults = () => {
      try {
        const shared = JSON.parse(localStorage.getItem(sharedResultsKey) || '{}');
        if (shared?.[38]?.version !== 2) delete shared[38];
        if (!shared || typeof shared !== 'object' || !Object.keys(shared).length) return;
        setResults(previous => {
          const next = { ...previous, ...shared };
          localStorage.setItem(resultsKey, JSON.stringify(next));
          return next;
        });
      } catch {}
    };
    syncStoredResults();
    const syncTimer = window.setInterval(syncStoredResults, 800);
    return () => {
      window.removeEventListener('message', receiveResult);
      window.clearInterval(syncTimer);
    };
  }, [resultsKey, sharedResultsKey]);

  useEffect(() => {
    if (!user) return;
    const role = String((user as any).role || '').toLowerCase();
    if (role && role !== 'teacher' && role !== 'admin') {
      setError('Режим самообучения доступен только учителю.');
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`/kids-api/lessons/${lessonId}`),
      fetch(`/kids-api/lessons/${lessonId}/activities`),
    ]).then(async ([lessonResponse, activitiesResponse]) => {
      const lessonData = await lessonResponse.json();
      const activitiesData = await activitiesResponse.json();
      if (!activitiesData.success) throw new Error('Не удалось загрузить этапы урока');
      if (lessonData.success) setLessonTitle(lessonData.data?.title || 'HSK 3');
      const next = transformActivities(activitiesData.data || []);
      setActivities(next);
      const saved = Number(localStorage.getItem(storageKey) || 0);
      setIndex(Math.max(0, Math.min(next.length - 1, saved)));
    }).catch((reason) => {
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить урок');
    }).finally(() => setLoading(false));
  }, [lessonId, storageKey, user]);

  const current = activities[index];
  const progress = useMemo(() => activities.length ? ((index + 1) / activities.length) * 100 : 0, [activities.length, index]);
  const allAnswers = useMemo(() => Object.values(results).flatMap(item => item.answers || []), [results]);
  const gradedAnswers = useMemo(() => allAnswers.filter(item => item.isCorrect !== null), [allAnswers]);
  const wrongAnswers = useMemo(() => gradedAnswers.filter(item => item.isCorrect === false), [gradedAnswers]);
  const writtenAnswers = useMemo(() => allAnswers.filter(item => item.isCorrect === null && item.studentAnswer), [allAnswers]);
  const correctCount = gradedAnswers.length - wrongAnswers.length;
  const workbookSections = useMemo(() => {
    const collect = (from: number, to: number) => {
      const items = Object.values(results).filter(item => item.stage >= from && item.stage <= to);
      return {
        score: items.reduce((sum, item) => sum + (item.score || 0), 0),
        total: items.reduce((sum, item) => sum + (item.total || 0), 0),
        answered: items.reduce((sum, item) => sum + (item.answers || []).filter(answer => answer.studentAnswer).length, 0),
      };
    };
    let listening = isLesson3 ? collect(43, 46) : isLesson2 ? collect(35, 38) : collect(29, 32);
    if (!isLesson2 && !isLesson3 && typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('hsk3-listening-split') || '{}');
        const values = [...(saved.pics || []), ...(saved.q1 || []), ...(saved.q2 || []), ...(saved.q3 || [])];
        const keys = ['F','A','E','B','C', '0','1','1','0','1', '0','2','1','1','2', '1','2','0','2','0'];
        const answered = values.filter(value => value !== '').length;
        if (answered > 0) {
          listening = {
            score: values.reduce((sum, value, index) => sum + (value === keys[index] ? 1 : 0), 0),
            total: 20,
            answered,
          };
        }
      } catch {}
    }
    return isLesson3 ? [
      { label: 'Аудирование', ...listening },
      { label: 'Чтение', ...collect(47, 50) },
      { label: 'Письмо', ...collect(51, 54) },
      { label: 'Общий тест', ...collect(61, 61) },
    ] : isLesson2 ? [
      { label: 'Аудирование', ...listening },
      { label: 'Чтение', ...collect(39, 42) },
      { label: 'Письмо', ...collect(43, 45) },
      { label: 'Итоговые задания', ...collect(47, 48) },
    ] : [
      { label: 'Аудирование', ...listening },
      { label: 'Чтение', ...collect(33, 35) },
      { label: 'Письмо', ...collect(36, 37), total: 20 },
      { label: 'Смешанный тест', ...collect(39, 39) },
    ];
  }, [isLesson2, isLesson3, results]);
  const sectionComment = (score: number, total: number) => {
    if (!total) return 'Ответы сохранены';
    const percent = score / total;
    if (percent >= 0.8) return 'Молодец!';
    if (percent >= 0.5) return 'Хорошая работа';
    return 'Нужно повторить';
  };

  const finishLesson = async (force = false) => {
    setShowReport(true);
    if ((!force && analysis) || analysing) return;
    setAnalysing(true);
    const evidence = [
      ...wrongAnswers.map((item, i) => `${i + 1}. Задание: ${item.prompt}\nОтвет: ${item.studentAnswer || 'нет ответа'}`),
      ...writtenAnswers.map((item, i) => `Письменный ответ ${i + 1}: ${item.prompt}\nТекст: ${item.studentAnswer}`),
    ].slice(0, 80).join('\n\n');
    if (!evidence) {
      setAnalysis('Проверенных ошибок не найдено. Нажимай «Проверить» в заданиях — тогда ответы попадут в итоговый анализ.');
      setAnalysing(false);
      return;
    }
    try {
      const response = await fetch('/kids-api/hsk/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Проанализируй результаты урока HSK 3. Не перечисляй готовые правильные ответы. Определи повторяющиеся ошибки и кратко объясни, что нужно отработать. Обращайся к ученику на «ты».\n\n${evidence}`,
          history: [], context: `Урок: ${lessonTitle}. Правильно ${correctCount} из ${gradedAnswers.length}.`,
          instructions: ['Отвечай по-русски.','Используй разделы: Результат, Ошибки, Что нужно отработать.','Пиши конкретно и кратко, только по переданным ответам.','Не показывай готовые правильные ответы к заданиям.']
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAnalysis(data.reply || data.message || data.content || 'Анализ не получен.');
    } catch {
      setAnalysis('Не удалось получить анализ ИИ. Результаты и ошибки сохранены — попробуй повторить анализ.');
    } finally { setAnalysing(false); }
  };
  const go = (next: number) => {
    if (next < 0 || next >= activities.length) return;
    setIndex(next);
    localStorage.setItem(storageKey, String(next));
  };

  if (loading) return <div className="h-screen grid place-items-center bg-slate-950 text-white">Загрузка самообучения…</div>;
  if (error) return <div className="h-screen grid place-items-center bg-slate-950 text-white"><div className="text-center"><p>{error}</p><button className="mt-4 rounded-lg bg-white px-4 py-2 text-slate-900" onClick={() => router.back()}>Назад</button></div></div>;

  return (
    <main className="h-screen min-h-0 overflow-hidden bg-slate-950 text-white flex flex-col">
      <header className="shrink-0 border-b border-white/10 bg-slate-900 px-3 py-2">
        <div className="flex items-center gap-3">
          <button title="Выйти" onClick={() => router.back()} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20">←</button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-200">Самообучение</span><strong className="truncate text-sm">{lessonTitle}</strong></div>
            <div className="mt-1 h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
          <span className="text-xs text-white/70">{index + 1} / {activities.length}</span>
          <button onClick={() => setShowDictionary(true)} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950">📖 Словарь</button>
        </div>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden bg-white text-slate-900">
        {current ? (
          <ActivityRenderer
            key={current.id}
            activity={current}
            isViewMode={true}
            isTeacher={true}
            lessonId={lessonId}
            socket={null}
            isConnected={false}
            onEdit={() => {}}
          />
        ) : <div className="grid h-full place-items-center">В уроке нет этапов</div>}
      </section>

      <footer className="shrink-0 flex items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-3 py-2">
        <button disabled={index === 0} onClick={() => go(index - 1)} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold disabled:opacity-30">← Назад</button>
        <span className="max-w-[55%] truncate text-xs text-white/65">{current?.title || ''}</span>
        {index >= activities.length - 1 ? (
          <button onClick={() => void finishLesson()} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950">Завершить и посмотреть результат</button>
        ) : (
          <button onClick={() => go(index + 1)} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">Дальше →</button>
        )}
      </footer>

      {(showDictionary || showInitialReview) && user && <HskDictionary lessonId={lessonId} userId={(user as any).id || (user as any).email || 'teacher'} review={showInitialReview} onClose={() => { sessionStorage.setItem(`hsk-review-opened:${(user as any).id}:${lessonId}`, '1'); setShowInitialReview(false); setShowDictionary(false); }} />}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3">
          <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div><h2 className="text-xl font-black">Результат урока</h2><p className="text-sm text-slate-500">Итоги рабочей тетради</p></div>
              <button onClick={() => setShowReport(false)} className="h-8 w-8 rounded-lg bg-slate-100 text-xl">×</button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {workbookSections.map(section => (
                  <div key={section.label} className="rounded-xl bg-cyan-50 p-4 text-center">
                    <div className="font-bold text-cyan-900">{section.label}</div>
                    <div className="mt-1 text-2xl font-black text-slate-900">{section.total ? `${section.score} / ${section.total}` : `Сохранено: ${section.answered}`}</div>
                    <div className="mt-1 text-xs font-semibold text-cyan-700">{sectionComment(section.score, section.total)}</div>
                  </div>
                ))}
              </div>
              <h3 className="mb-2 font-bold text-indigo-700">Анализ выполнения</h3>
              {analysing ? <div className="rounded-xl bg-indigo-50 p-4">DeepSeek анализирует ответы…</div> : <div className="whitespace-pre-wrap rounded-xl bg-indigo-50 p-4 text-sm leading-6">{analysis}</div>}
              {!analysing && analysis.startsWith('Не удалось') && <button onClick={() => { setAnalysis(''); void finishLesson(true); }} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Повторить анализ</button>}
            </div>
            <div className="flex shrink-0 justify-end border-t bg-slate-50 px-5 py-3">
              <button
                onClick={() => { localStorage.removeItem(storageKey); router.back(); }}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white shadow hover:bg-emerald-600"
              >
                Закончить урок
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
