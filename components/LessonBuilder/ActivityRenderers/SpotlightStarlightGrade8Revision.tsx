'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

type Attempt = {
  screen: number;
  kind: string;
  prompt: string;
  studentAnswer: string;
  correctAnswer?: string;
  isCorrect?: boolean | null;
  word?: string;
  ts: number;
};

type WordStat = { known: number; unknown: number };

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const SCREENS = [
  'Soft start',
  'Jobs',
  'Jobs speaking',
  'Extreme sports',
  'Associations',
  'Entertainment',
  'Entertainment speaking',
  'The internet',
  'Internet speaking',
  'Final mix',
];

const MOODS = ['relaxing', 'busy', 'fun', 'adventurous', 'a little boring', 'surprising'];
const ACTIVITIES = [
  { emoji: '📱', label: 'travelled' },
  { emoji: '👯', label: 'met friends' },
  { emoji: '🎮', label: 'played games' },
  { emoji: '🎬', label: 'watched films / series' },
  { emoji: '🏃', label: 'did sports' },
  { emoji: '📚', label: 'read books' },
  { emoji: '🌲', label: 'spent time outdoors' },
  { emoji: '💻', label: 'learnt something new' },
];

const JOB_PAIRS = [
  { key: 'tester', left: 'video game', right: 'tester' },
  { key: 'attendant', left: 'flight', right: 'attendant' },
  { key: 'shopper', left: 'secret', right: 'shopper' },
  { key: 'assistant', left: 'sales', right: 'assistant' },
  { key: 'counsellor', left: 'camp', right: 'counsellor' },
  { key: 'officer', left: 'police', right: 'officer' },
  { key: 'walker', left: 'dog', right: 'walker' },
  { key: 'chaser', left: 'storm', right: 'chaser' },
  { key: 'coach', left: 'sports', right: 'coach' },
];

const SPORTS = [
  { name: 'street luge', icon: '🛹', question: 'Would you try street luge? Why or why not?' },
  { name: 'windsurfing', icon: '🌊', question: 'Would you like to try windsurfing?' },
  { name: 'rock climbing', icon: '🧗', question: 'Is rock climbing exciting or scary?' },
  { name: 'speed skiing', icon: '⛷️', question: 'Which is harder: speed skiing or normal skiing?' },
  { name: 'paragliding', icon: '🪂', question: 'Would you feel brave enough for paragliding?' },
  { name: 'whitewater rafting', icon: '🚣', question: 'Would you go whitewater rafting with friends?' },
  { name: 'mountain biking', icon: '🚴', question: 'Would you prefer mountain biking or motocross?' },
  { name: 'motocross', icon: '🏍️', question: 'What skills do you need for motocross?' },
];

const ASSOC_WORDS = ['water', 'air / wind', 'height', 'land / road', 'speed', 'balance', 'strength', 'teamwork', 'danger', 'courage'];

const ENTERTAINMENT = [
  { sentence: 'Kylie Minogue is still a reigning ___ in the world of pop music.', answer: 'icon', options: ['icon', 'stage', 'audience'] },
  { sentence: 'He is in charge of painting the ___ for the play.', answer: 'scenery', options: ['scenery', 'series', 'fame'] },
  { sentence: 'The twist at the end of the play was a complete surprise for the ___.', answer: 'audience', options: ['audience', 'curtain', 'props'] },
  { sentence: 'The lead actor gave an excellent ___.', answer: 'performance', options: ['performance', 'series', 'lighting'] },
  { sentence: 'Actors often wait behind the ___ before appearing.', answer: 'curtain', options: ['curtain', 'stage', 'fame'] },
  { sentence: 'At the beginning of the play there were no actors on the ___.', answer: 'stage', options: ['stage', 'audience', 'scenery'] },
  { sentence: 'The drama is part of a new TV ___.', answer: 'series', options: ['series', 'props', 'icon'] },
  { sentence: 'For the film they used lots of different ___.', answer: 'props', options: ['props', 'fame', 'curtain'] },
  { sentence: 'The clever ___ made the scene look mysterious.', answer: 'lighting', options: ['lighting', 'audience', 'series'] },
  { sentence: 'The actor found ___ at a very young age.', answer: 'fame', options: ['fame', 'stage', 'scenery'] },
];

const INTERNET = [
  { sentence: 'Alex set up an email ___ so that we could keep in touch.', answer: 'account', options: ['account', 'engine', 'profile'] },
  { sentence: 'My favourite search ___ is Google.', answer: 'engine', options: ['engine', 'login', 'interface'] },
  { sentence: 'This social network seems to be a very tight-knit ___.', answer: 'community', options: ['community', 'account', 'browse'] },
  { sentence: 'You have to type in your ___ name to open your account.', answer: 'login', options: ['login', 'profile', 'engine'] },
  { sentence: 'You can personalise your ___ in a number of ways.', answer: 'profile', options: ['profile', 'community', 'interface'] },
  { sentence: 'You can ___ to get their e-newsletter.', answer: 'browse', options: ['browse', 'sign up', 'login'] },
  { sentence: 'This program has a much more user-friendly ___ than a lot of others I have used.', answer: 'interface', options: ['interface', 'engine', 'account'] },
  { sentence: 'You can ___ for new contacts by name or location.', answer: 'sign up', options: ['sign up', 'browse', 'profile'] },
];

const SPEAKING_TOPICS = [
  { title: 'Films & series', question: 'Do you prefer films or TV series? Why?', hint: 'Try to use: series, plot, characters', emoji: '🎬' },
  { title: 'Live performance', question: 'Have you ever seen a live performance? What was it like?', hint: 'Try to use: audience, stage, performance', emoji: '🎭' },
  { title: 'Visual atmosphere', question: 'How important are scenery and lighting in a film or play?', hint: 'Try to explain how they change the atmosphere.', emoji: '💡' },
  { title: 'Icons & fame', question: 'Who is a film or music icon for your generation, and why?', hint: 'Try to use: fame, icon', emoji: '⭐' },
];

const INTERNET_SPEAKING = [
  { title: 'Browsing', question: 'What do you usually browse online?', hint: 'Give 2-3 examples.', emoji: '🔎' },
  { title: 'Login', question: 'Have you ever forgotten your login or password? What did you do?', hint: 'Use Past Simple if possible.', emoji: '🔐' },
  { title: 'Profile', question: 'Is your social media profile public or private? Why?', hint: 'Try to give a reason with because.', emoji: '👤' },
  { title: 'Interface', question: 'Which app has the easiest interface?', hint: 'Compare it with another app.', emoji: '📱' },
  { title: 'Community', question: 'Are online communities useful or annoying? Why?', hint: 'Give one advantage and one disadvantage.', emoji: '💬' },
];

const TOTAL_GRADED = JOB_PAIRS.length + ENTERTAINMENT.length + INTERNET.length + SPORTS.length;
const LESSON_KEY = 'starlight-grade8-scrapbook-v5';

function toggleItem(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

function SectionTitle({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <div className="shrink-0">
      <div className="inline-flex items-center rounded-md bg-[#f4c43a] px-3 py-1 text-xs font-black tracking-[0.2em] text-[#1f3150] shadow-[4px_4px_0_rgba(0,0,0,0.12)]">
        {kicker}
      </div>
      <h2 className="mt-2 text-[clamp(24px,3vw,38px)] font-serif font-bold text-[#17355d]">{title}</h2>
      <p className="max-w-4xl text-[clamp(12px,1.25vw,16px)] text-slate-600">{subtitle}</p>
    </div>
  );
}

function StepButton({ index, active, label, onClick }: { index: number; active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[82px] rounded-xl border-2 px-3 py-2 text-left text-xs font-black transition ${
        active ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#d9c6ab] bg-white text-[#4b5563]'
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">{String(index + 1).padStart(2, '0')}</div>
      <div className="mt-0.5 leading-tight">{label}</div>
    </button>
  );
}

export default function SpotlightStarlightGrade8Revision({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const { user } = useAuth();
  const [screen, setScreen] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [wordStats, setWordStats] = useState<Record<string, WordStat>>({});
  const [summerMoods, setSummerMoods] = useState<string[]>([]);
  const [summerActivities, setSummerActivities] = useState<string[]>([]);
  const [selectedLeftJob, setSelectedLeftJob] = useState<string | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<Record<string, boolean>>({});
  const [jobMatches, setJobMatches] = useState(0);
  const [speakingText, setSpeakingText] = useState<Record<string, string>>({ jobs: '', entertainment: '', internet: '', final: '' });
  const [selectedSport, setSelectedSport] = useState(SPORTS[0].name);
  const [revealedSports, setRevealedSports] = useState<Record<string, boolean>>({});
  const [sportScore, setSportScore] = useState(0);
  const [sportScored, setSportScored] = useState<Record<string, boolean>>({});
  const [assocSport, setAssocSport] = useState(SPORTS[0].name);
  const [assocWords, setAssocWords] = useState<string[]>([]);
  const [entAnswers, setEntAnswers] = useState<string[]>(Array(ENTERTAINMENT.length).fill(''));
  const [netAnswers, setNetAnswers] = useState<string[]>(Array(INTERNET.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const recordAttempt = (entry: Omit<Attempt, 'ts'>) => {
    setAttempts(prev => [...prev, { ...entry, ts: Date.now() }]);
  };

  const recordWordStat = (word: string, isCorrect: boolean) => {
    setWordStats(prev => {
      const current = prev[word] || { known: 0, unknown: 0 };
      return {
        ...prev,
        [word]: {
          known: current.known + (isCorrect ? 1 : 0),
          unknown: current.unknown + (isCorrect ? 0 : 1),
        },
      };
    });
  };

  const correctEnt = useMemo(() => ENTERTAINMENT.filter((item, index) => entAnswers[index] === item.answer).length, [entAnswers]);
  const correctNet = useMemo(() => INTERNET.filter((item, index) => netAnswers[index] === item.answer).length, [netAnswers]);
  const totalKnown = useMemo(() => Object.values(wordStats).reduce((sum, item) => sum + item.known, 0), [wordStats]);
  const totalUnknown = useMemo(() => Object.values(wordStats).reduce((sum, item) => sum + item.unknown, 0), [wordStats]);

  const selectMood = (value: string) => {
    setSummerMoods(prev => toggleItem(prev, value));
    recordAttempt({ screen: 0, kind: 'mood', prompt: 'summer mood', studentAnswer: value, isCorrect: null });
  };

  const selectActivity = (value: string) => {
    setSummerActivities(prev => toggleItem(prev, value));
    recordAttempt({ screen: 0, kind: 'activity', prompt: 'summer activity', studentAnswer: value, isCorrect: null });
  };

  const matchJob = (right: string) => {
    if (!selectedLeftJob || matchedJobs[right]) return;
    const ok = JOB_PAIRS.find(item => item.key === right)?.left === selectedLeftJob;
    recordAttempt({
      screen: 1,
      kind: 'match',
      prompt: `${selectedLeftJob} / ${right}`,
      studentAnswer: right,
      correctAnswer: JOB_PAIRS.find(item => item.left === selectedLeftJob)?.right || '',
      isCorrect: ok,
      word: `${selectedLeftJob} ${right}`,
    });
    if (ok) {
      setMatchedJobs(prev => ({ ...prev, [right]: true }));
      setJobMatches(prev => prev + 1);
      recordWordStat(right, true);
      setSelectedLeftJob(null);
    } else {
      recordWordStat(right, false);
    }
  };

  const setWrittenAnswer = (key: string, value: string) => {
    setSpeakingText(prev => ({ ...prev, [key]: value }));
  };

  const pickSport = (name: string) => {
    setSelectedSport(name);
    setRevealedSports(prev => ({ ...prev, [name]: true }));
    recordAttempt({ screen: 3, kind: 'sport-card', prompt: name, studentAnswer: name, isCorrect: null, word: name });
  };

  const addSportPoint = () => {
    if (sportScored[selectedSport]) return;
    setSportScored(prev => ({ ...prev, [selectedSport]: true }));
    setSportScore(prev => prev + 1);
    recordAttempt({
      screen: 3,
      kind: 'sport-point',
      prompt: selectedSport,
      studentAnswer: 'answered orally',
      isCorrect: true,
      word: selectedSport,
    });
    recordWordStat(selectedSport, true);
  };

  const toggleAssocWord = (word: string) => {
    setAssocWords(prev => toggleItem(prev, word));
    recordAttempt({ screen: 4, kind: 'association-word', prompt: assocSport, studentAnswer: word, isCorrect: null, word });
  };

  const onEntSelect = (index: number, value: string) => {
    setEntAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    const ok = ENTERTAINMENT[index].answer === value;
    recordAttempt({
      screen: 5,
      kind: 'select',
      prompt: ENTERTAINMENT[index].sentence,
      studentAnswer: value,
      correctAnswer: ENTERTAINMENT[index].answer,
      isCorrect: ok,
      word: value,
    });
    recordWordStat(value, ok);
  };

  const onNetSelect = (index: number, value: string) => {
    setNetAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    const ok = INTERNET[index].answer === value;
    recordAttempt({
      screen: 7,
      kind: 'select',
      prompt: INTERNET[index].sentence,
      studentAnswer: value,
      correctAnswer: INTERNET[index].answer,
      isCorrect: ok,
      word: value,
    });
    recordWordStat(value, ok);
  };

  const finalDetails = useMemo(() => {
    const written = Object.entries(speakingText)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => ({
        prompt:
          key === 'jobs'
            ? 'Which job would you try?'
            : key === 'entertainment'
              ? 'What makes a film, series or performance memorable?'
              : key === 'internet'
                ? 'What do you usually browse online, and which app has the best interface?'
                : 'Final reflection',
        studentAnswer: value.trim(),
        correctAnswer: 'Write a complete English sentence with because, because of, or a comparison if possible.',
        isCorrect: false,
      }));

    return [
      ...attempts,
      ...written.map(item => ({
        screen: 10,
        kind: 'written',
        prompt: item.prompt,
        studentAnswer: item.studentAnswer,
        correctAnswer: item.correctAnswer,
        isCorrect: item.isCorrect,
        ts: Date.now(),
      })),
    ];
  }, [attempts, speakingText]);

  const score = jobMatches + correctEnt + correctNet + sportScore;
  const submitDisabled = isTeacher || !lessonId || saving || submitted;

  const handleSubmit = async () => {
    if (submitDisabled) return;
    setSaving(true);

    const payload = {
      source: LESSON_KEY,
      details: finalDetails,
      items: finalDetails,
      answers: finalDetails.filter(item => item.kind === 'written'),
      activityLog: attempts,
      wordStats,
      summary: {
        moods: summerMoods,
        activities: summerActivities,
        matchedJobs: jobMatches,
        entertainmentCorrect: correctEnt,
        internetCorrect: correctNet,
        sportScore,
        associations: { sport: assocSport, words: assocWords },
      },
    };

    try {
      await fetch('/kids-api/spotlight/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          activityId,
          sessionId: sessionId || null,
          studentId: user?.id,
          studentName: user?.displayName || 'Student',
          results: payload,
          score,
          total: TOTAL_GRADED,
        }),
      });

      if (sessionId) {
        await fetch('/kids-api/spotlight/grammar-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }

      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  const nav = (
    <div className="flex flex-wrap gap-2">
      {SCREENS.map((label, index) => (
        <StepButton key={label} index={index} label={label} active={screen === index} onClick={() => setScreen(index)} />
      ))}
    </div>
  );

  const shell = (children: React.ReactNode) => (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top left,rgba(255,219,165,0.55),transparent 26%),radial-gradient(circle at bottom right,rgba(191,225,239,0.55),transparent 30%),#f7f0e1',
        fontFamily: '"Trebuchet MS", Arial, sans-serif',
      }}
    >
      <div className="shrink-0 border-b border-[#d8c8ad] bg-white/55 px-4 py-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-black uppercase tracking-[0.2em] text-[#8d7357]">
            Stage {String(screen + 1).padStart(2, '0')} / {String(SCREENS.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold text-[#6b5a46]">
            {screen < SCREENS.length - 1 ? 'Work through the stage, then go next' : 'Finish and send for analysis'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{nav}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border-2 border-[#d8c8ad] bg-[rgba(255,252,245,0.95)] shadow-[0_16px_36px_rgba(66,54,38,0.15)]">
          <div className="min-h-0 flex-1 overflow-auto px-5 py-5">{children}</div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#d8c8ad] bg-[#efe7d8] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScreen(s => Math.max(0, s - 1))}
            disabled={screen === 0}
            className="rounded-xl border-2 border-[#d3c2a8] bg-white px-4 py-2 text-sm font-black text-[#17355d] disabled:opacity-35"
          >
            ← Prev
          </button>
          <div className="rounded-xl border-2 border-dashed border-[#c9b599] bg-[#fff8ea] px-3 py-2 text-sm font-black text-[#6b5a46]">
            {screen + 1} / {SCREENS.length}
          </div>
          <div className="flex items-center gap-2">
            {screen < SCREENS.length - 1 ? (
              <button
                type="button"
                onClick={() => setScreen(s => Math.min(SCREENS.length - 1, s + 1))}
                className="rounded-xl bg-[#17355d] px-4 py-2 text-sm font-black text-white"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="rounded-xl bg-[#2c8f5f] px-4 py-2 text-sm font-black text-white disabled:opacity-40"
              >
                {submitted ? 'Saved' : saving ? 'Saving…' : 'Finish & analyze'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (screen === 0) {
    return shell(
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex min-h-0 flex-col gap-4">
          <SectionTitle
            kicker="01 · SOFT START"
            title="How was your summer?"
            subtitle="Click a few options, then turn them into a real answer. The student gets speaking before the revision gets serious."
          />
          <div className="grid min-h-0 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4 shadow-[0_8px_18px_rgba(54,45,34,0.1)]">
              <h3 className="mb-3 text-xl font-bold text-[#17355d]">How would you describe it?</h3>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectMood(item)}
                    className={`rounded-2xl border-2 px-3 py-2 text-sm font-black ${
                      summerMoods.includes(item) ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-4 text-sm font-medium text-[#4a5568]">
                <div className="font-black text-[#17355d]">Answer idea</div>
                <div>My summer was {summerMoods.join(' and ') || '...'} because ...</div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4 shadow-[0_8px_18px_rgba(54,45,34,0.1)]">
              <h3 className="mb-3 text-xl font-bold text-[#17355d]">What did you do?</h3>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITIES.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => selectActivity(item.label)}
                    className={`rounded-2xl border-2 px-3 py-3 text-left font-black transition ${
                      summerActivities.includes(item.label) ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                    }`}
                  >
                    <div className="text-2xl">{item.emoji}</div>
                    <div className="mt-1 text-sm leading-tight">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-[#cddce6] bg-[#eaf4f7] p-4 shadow-[0_8px_18px_rgba(54,45,34,0.12)]">
          <div className="rounded-2xl border-2 border-[#bdd4df] bg-white/80 p-4">
            <div className="text-sm font-black uppercase tracking-[0.2em] text-[#6d7f8b]">Speaking ladder</div>
            <div className="mt-3 space-y-2 text-lg font-bold text-[#213b5e]">
              <div>My summer was ...</div>
              <div>I ...</div>
              <div>The best thing was ...</div>
              <div>Next summer, I’d like to ...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 1) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="02 · JOBS"
          title="Match the job words"
          subtitle="Click one left half, then its right half. Wrong taps stay in the log for the final review."
        />
        <div className="grid min-h-0 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
            <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Left side</div>
            <div className="grid grid-cols-2 gap-2">
              {JOB_PAIRS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedLeftJob(item.left)}
                  className={`rounded-2xl border-2 px-3 py-3 text-left text-sm font-black ${
                    selectedLeftJob === item.left ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                  } ${matchedJobs[item.key] ? 'opacity-55' : ''}`}
                >
                  {item.left}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
            <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Right side</div>
            <div className="grid grid-cols-2 gap-2">
              {JOB_PAIRS.map(item => (
                <button
                  key={item.right}
                  type="button"
                  onClick={() => matchJob(item.key)}
                  className={`rounded-2xl border-2 px-3 py-3 text-left text-sm font-black ${
                    matchedJobs[item.key] ? 'border-green-500 bg-green-50 text-green-700' : 'border-[#ddceb8] bg-white text-[#45516b]'
                  }`}
                >
                  {item.right}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-4 text-sm font-black text-[#17355d]">
          Matched: {jobMatches} / {JOB_PAIRS.length}
        </div>
      </div>
    );
  }

  if (screen === 2) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="03 · JOBS SPEAKING"
          title="Which job would you try?"
          subtitle="Choose one prompt, type a real sentence, then keep the grammar notes for the DeepSeek review."
        />
        <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_0.95fr]">
          <div className="grid gap-2">
            {[
              'Would you like to be a video game tester?',
              'Would you ever work as a storm chaser?',
              'Which is harder: flight attendant or sales assistant?',
              'Which job sounds the most relaxing?',
            ].map(prompt => (
              <div key={prompt} className="rounded-2xl border-2 border-[#dccdb4] bg-white p-3 text-sm font-black text-[#17355d]">
                {prompt}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border-2 border-[#dccdb4] bg-[#fef8e8] p-4">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Useful language</div>
            <div className="mt-2 space-y-2 text-sm font-bold text-slate-700">
              <div>I’d like to work as a ... because ...</div>
              <div>I wouldn’t like to be a ... because ...</div>
              <div>I think a ... has to be ...</div>
              <div>A ... is more dangerous than a ...</div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-black text-[#17355d]">Student answer</label>
              <textarea
                value={speakingText.jobs}
                onChange={e => {
                  setWrittenAnswer('jobs', e.target.value);
                  recordAttempt({
                    screen: 2,
                    kind: 'writing',
                    prompt: 'Jobs speaking',
                    studentAnswer: e.target.value,
                    correctAnswer: 'Use a complete sentence with because.',
                    isCorrect: false,
                  });
                }}
                className="min-h-[120px] w-full rounded-2xl border-2 border-[#d9cbb5] bg-white px-4 py-3 text-sm outline-none focus:border-[#7faac6]"
                placeholder="I’d like to work as a ..."
              />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-4 text-sm text-slate-600">
          This screen is about speaking, so the exact answer is open. The text still goes to the final grammar review.
        </div>
      </div>
    );
  }

  if (screen === 3) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="04 · EXTREME SPORTS"
          title="Click · reveal · speak"
          subtitle="Pick a sport, reveal it, and record one point only if the student actually answers."
        />
        <div className="grid min-h-0 gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SPORTS.map(item => {
              const revealed = revealedSports[item.name];
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => pickSport(item.name)}
                  className={`rounded-2xl border-2 p-3 text-left transition ${
                    selectedSport === item.name ? 'border-[#17355d] bg-white shadow-[0_8px_16px_rgba(54,45,34,0.14)]' : 'border-[#ddceb8] bg-white'
                  }`}
                >
                  <div className="text-4xl">{item.icon}</div>
                  <div className="mt-3 font-black text-[#17355d]">{revealed ? item.name : 'click to reveal'}</div>
                  <div className="mt-1 text-xs text-slate-500">{revealed ? item.question : 'click · reveal · speak'}</div>
                </button>
              );
            })}
          </div>
          <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Question</div>
            <div className="mt-2 text-lg font-bold text-[#17355d]">
              <div className="font-black">{selectedSport}</div>
              <div className="mt-2 text-base text-slate-700">{SPORTS.find(item => item.name === selectedSport)?.question}</div>
            </div>
            <button
              type="button"
              onClick={addSportPoint}
              className="mt-4 rounded-2xl bg-[#17355d] px-4 py-2 text-sm font-black text-white disabled:opacity-35"
              disabled={Boolean(sportScored[selectedSport])}
            >
              {sportScored[selectedSport] ? 'Point added ✓' : '+1 point'}
            </button>
            <div className="mt-3 rounded-2xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-3 text-sm font-black text-[#17355d]">
              Score: {sportScore} / {SPORTS.length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 4) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="05 · ASSOCIATIONS"
          title="Build the sport in your head"
          subtitle="Choose one sport and then add the ideas that go with it. There is no single correct category here."
        />
        <div className="grid min-h-0 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
            <div className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Sports</div>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(item => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setAssocSport(item.name)}
                  className={`rounded-2xl border-2 px-3 py-2 text-sm font-black ${
                    assocSport === item.name ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
            <div className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Choose associations</div>
            <div className="flex flex-wrap gap-2">
              {ASSOC_WORDS.map(word => (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggleAssocWord(word)}
                  className={`rounded-2xl border-2 px-3 py-2 text-sm font-black ${
                    assocWords.includes(word) ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-4 text-sm font-bold text-[#17355d]">
              I associate {assocSport || '...'} with {assocWords.join(', ') || '...'}.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 5) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="06 · ENTERTAINMENT"
          title="Complete the sentences"
          subtitle="Choose the word, see the instant check, and keep the wrong answers for the grammar analysis."
        />
        <div className="grid min-h-0 gap-3 lg:grid-cols-2">
          {ENTERTAINMENT.map((item, index) => {
            const chosen = entAnswers[index];
            const ok = chosen === item.answer;
            return (
              <div key={item.sentence} className={`rounded-2xl border-2 p-3 ${chosen ? (ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-[#dccdb4] bg-white'}`}>
                <div className="text-sm font-bold text-[#17355d]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f4c43a] text-xs font-black text-[#17355d]">{index + 1}</span>
                  {item.sentence}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.options.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onEntSelect(index, option)}
                      className={`rounded-2xl border-2 px-3 py-2 text-sm font-black ${
                        chosen === option ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  {chosen ? (ok ? 'Correct ✓' : `Wrong · correct: ${item.answer}`) : 'Choose an answer'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 6) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="07 · ENTERTAINMENT SPEAKING"
          title="Pick a topic"
          subtitle="These cards are for speaking first, then writing one short answer for DeepSeek."
        />
        <div className="grid min-h-0 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {SPEAKING_TOPICS.map(item => (
            <div key={item.title} className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
              <div className="text-4xl">{item.emoji}</div>
              <div className="mt-3 text-lg font-black text-[#17355d]">{item.title}</div>
              <div className="mt-2 text-sm font-bold text-slate-700">{item.question}</div>
              <div className="mt-3 rounded-xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-3 text-xs font-bold text-slate-600">{item.hint}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-[#fef8e8] p-4">
          <label className="mb-2 block text-sm font-black text-[#17355d]">Student answer</label>
          <textarea
            value={speakingText.entertainment}
            onChange={e => {
              setWrittenAnswer('entertainment', e.target.value);
              recordAttempt({
                screen: 6,
                kind: 'writing',
                prompt: 'Entertainment speaking',
                studentAnswer: e.target.value,
                correctAnswer: 'Use because and one comparison or example.',
                isCorrect: false,
              });
            }}
            className="min-h-[100px] w-full rounded-2xl border-2 border-[#d9cbb5] bg-white px-4 py-3 text-sm outline-none focus:border-[#7faac6]"
            placeholder="I prefer ..."
          />
        </div>
      </div>
    );
  }

  if (screen === 7) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="08 · THE INTERNET"
          title="Complete the sentences"
          subtitle="The word bank from the original page, now compact enough to fit the screen."
        />
        <div className="grid min-h-0 gap-3 lg:grid-cols-2">
          {INTERNET.map((item, index) => {
            const chosen = netAnswers[index];
            const ok = chosen === item.answer;
            return (
              <div key={item.sentence} className={`rounded-2xl border-2 p-3 ${chosen ? (ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-[#dccdb4] bg-white'}`}>
                <div className="text-sm font-bold text-[#17355d]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f4c43a] text-xs font-black text-[#17355d]">{index + 1}</span>
                  {item.sentence}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.options.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onNetSelect(index, option)}
                      className={`rounded-2xl border-2 px-3 py-2 text-sm font-black ${
                        chosen === option ? 'border-[#17355d] bg-[#17355d] text-white' : 'border-[#ddceb8] bg-white text-[#45516b]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  {chosen ? (ok ? 'Correct ✓' : `Wrong · correct: ${item.answer}`) : 'Choose an answer'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 8) {
    return shell(
      <div className="flex h-full min-h-0 flex-col gap-4">
        <SectionTitle
          kicker="09 · INTERNET SPEAKING"
          title="Your online life"
          subtitle="Choose a card, think out loud, then keep a written answer for the grammar pass."
        />
        <div className="grid min-h-0 gap-3 lg:grid-cols-2 xl:grid-cols-5">
          {INTERNET_SPEAKING.map(item => (
            <div key={item.title} className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
              <div className="text-4xl">{item.emoji}</div>
              <div className="mt-3 text-lg font-black text-[#17355d]">{item.title}</div>
              <div className="mt-2 text-sm font-bold text-slate-700">{item.question}</div>
              <div className="mt-3 rounded-xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-3 text-xs font-bold text-slate-600">{item.hint}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-[#fef8e8] p-4">
          <label className="mb-2 block text-sm font-black text-[#17355d]">Student answer</label>
          <textarea
            value={speakingText.internet}
            onChange={e => {
              setWrittenAnswer('internet', e.target.value);
              recordAttempt({
                screen: 8,
                kind: 'writing',
                prompt: 'Internet speaking',
                studentAnswer: e.target.value,
                correctAnswer: 'Use because and one comparison or example.',
                isCorrect: false,
              });
            }}
            className="min-h-[100px] w-full rounded-2xl border-2 border-[#d9cbb5] bg-white px-4 py-3 text-sm outline-none focus:border-[#7faac6]"
            placeholder="I usually browse ..."
          />
        </div>
      </div>
    );
  }

  return shell(
    <div className="flex h-full min-h-0 flex-col gap-4">
      <SectionTitle
        kicker="10 · FINAL MIX"
        title="Four quick questions"
        subtitle="This is the end of the lesson. The button sends the click log and the written answers for analysis."
      />
      <div className="grid min-h-0 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Job</div>
          <div className="mt-2 text-base font-bold text-[#17355d]">Would you rather be a storm chaser or a video game tester? Why?</div>
        </div>
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Sport</div>
          <div className="mt-2 text-base font-bold text-[#17355d]">Which extreme sport is the most dangerous in your opinion?</div>
        </div>
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Entertainment</div>
          <div className="mt-2 text-base font-bold text-[#17355d]">What makes a film, series or performance memorable?</div>
        </div>
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Internet</div>
          <div className="mt-2 text-base font-bold text-[#17355d]">What do you usually browse online, and which app has the best interface?</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-[#fff8ea] p-4">
          <label className="mb-2 block text-sm font-black text-[#17355d]">Final reflection</label>
          <textarea
            value={speakingText.final}
            onChange={e => {
              setWrittenAnswer('final', e.target.value);
              recordAttempt({
                screen: 9,
                kind: 'writing',
                prompt: 'Final reflection',
                studentAnswer: e.target.value,
                correctAnswer: 'Write one or two complete English sentences.',
                isCorrect: false,
              });
            }}
            className="min-h-[120px] w-full rounded-2xl border-2 border-[#d9cbb5] bg-white px-4 py-3 text-sm outline-none focus:border-[#7faac6]"
            placeholder="I found this lesson ..."
          />
          <div className="mt-3 text-xs font-bold text-slate-500">
            All written answers are sent to DeepSeek after saving so grammar mistakes can be extracted from the session.
          </div>
        </div>
        <div className="rounded-2xl border-2 border-[#dccdb4] bg-white p-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Current summary</div>
          <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
            <div>Moods: {summerMoods.join(', ') || '—'}</div>
            <div>Activities: {summerActivities.join(', ') || '—'}</div>
            <div>Job matches: {jobMatches} / {JOB_PAIRS.length}</div>
            <div>Entertainment: {correctEnt} / {ENTERTAINMENT.length}</div>
            <div>Internet: {correctNet} / {INTERNET.length}</div>
            <div>Sport points: {sportScore} / {SPORTS.length}</div>
            <div>Association words: {assocWords.join(', ') || '—'}</div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="mt-4 rounded-2xl bg-[#2c8f5f] px-4 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            {submitted ? 'Saved' : saving ? 'Saving…' : 'Finish & analyze'}
          </button>
          {!lessonId && <div className="mt-2 text-xs font-bold text-amber-700">No lessonId yet, so saving is disabled in preview mode.</div>}
          {isTeacher && <div className="mt-2 text-xs font-bold text-amber-700">Teacher preview mode: results are not submitted.</div>}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[#ccb99d] bg-[#fff8ea] p-4 text-sm font-black text-[#17355d]">
        Final score: {score} / {TOTAL_GRADED}
      </div>
    </div>
  );
}

