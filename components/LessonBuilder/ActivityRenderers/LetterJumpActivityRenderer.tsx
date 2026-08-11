import LetterJumpBuilder from '../LetterJumpBuilder';
import LetterJumpGame, { type LetterJumpConfig } from '../LetterJumpGame';
import type { Activity } from '../../../types';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface Props { activity: Activity; isViewMode: boolean; isTeacher: boolean; lessonId?: string; groupId?: number; sessionId?: string; onEdit: (activity: Activity) => void; }
const DEFAULT_CONFIG: LetterJumpConfig = { title: 'Letter Jump', instruction: 'Прыгни на правильную букву или слово', items: ['A', 'B', 'C', 'D', 'E', 'F'], rounds: 10, lives: 3 };

export default function LetterJumpActivityRenderer({ activity, isViewMode, isTeacher, lessonId, groupId, sessionId, onEdit }: Props) {
  const data = activity as any;
  const config: LetterJumpConfig = data.letterJumpConfig || data.contentData?.letterJumpConfig || DEFAULT_CONFIG;
  const submit = useActivityResult({ activityId: activity.id!, lessonId, groupId, sessionId, isTeacher });
  if (isViewMode) return <LetterJumpGame config={config} onComplete={result => submit({ score: result.score, status: result.status, details: { total: result.total, mistakes: result.mistakes, livesLeft: result.livesLeft } })} />;
  return <LetterJumpBuilder initialConfig={config} onSave={letterJumpConfig => onEdit({ ...activity, title: letterJumpConfig.title, letterJumpConfig } as any)} />;
}
