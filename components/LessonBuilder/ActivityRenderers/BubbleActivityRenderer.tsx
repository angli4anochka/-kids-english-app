import BubbleBuilder from '../BubbleBuilder';
import BubbleGame, { type BubbleConfig } from '../BubbleGame';
import type { Activity } from '../../../types';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface Props {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

const DEFAULT_CONFIG: BubbleConfig = {
  title: 'Bubble',
  instruction: 'Найди правильное слово или букву',
  items: ['cat', 'dog', 'book', 'pen', 'ruler', 'desk'],
  rounds: 10,
};

export default function BubbleActivityRenderer({ activity, isViewMode, isTeacher, lessonId, groupId, sessionId, onEdit }: Props) {
  const data = activity as any;
  const config: BubbleConfig = data.bubbleConfig || data.contentData?.bubbleConfig || DEFAULT_CONFIG;
  const configKey = JSON.stringify({ title: config.title, instruction: config.instruction, items: config.items, rounds: config.rounds });
  const submit = useActivityResult({ activityId: activity.id!, lessonId, groupId, sessionId, isTeacher });

  if (isViewMode) {
    return <BubbleGame key={configKey} config={config} onComplete={result => submit({ score: result.score, status: 'completed', details: { total: result.total, mistakes: result.mistakes } })} />;
  }

  return <BubbleBuilder key={configKey} initialConfig={config} onSave={bubbleConfig => onEdit({ ...activity, title: bubbleConfig.title, contentData: { ...(activity as any).contentData, bubbleConfig }, bubbleConfig } as any)} />;
}
