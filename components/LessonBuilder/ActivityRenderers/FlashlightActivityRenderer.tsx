import FlashlightBuilder from '../FlashlightBuilder';
import FlashlightGame, { type FlashlightConfig } from '../FlashlightGame';
import type { Activity } from '../../../types';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface Props { activity: Activity; isViewMode: boolean; isTeacher: boolean; lessonId?: string; groupId?: number; sessionId?: string; onEdit: (activity: Activity) => void }
const DEFAULT_CONFIG: FlashlightConfig = {
  title: 'School Subjects', instruction: 'Посвети фонариком и найди все школьные предметы',
  targets: ['English', 'Maths', 'Science', 'History', 'Art', 'Geography', 'Music', 'IT', 'PE'].map(word => ({ word })),
  decoys: ['cat', 'train', 'sun', 'car', 'pizza', 'apple'].map(word => ({ word })),
};

export default function FlashlightActivityRenderer({ activity, isViewMode, isTeacher, lessonId, groupId, sessionId, onEdit }: Props) {
  const data = activity as any;
  const config: FlashlightConfig = data.flashlightConfig || data.contentData?.flashlightConfig || DEFAULT_CONFIG;
  const submit = useActivityResult({ activityId: activity.id!, lessonId, groupId, sessionId, isTeacher });
  if (isViewMode) return <FlashlightGame config={config} onComplete={result => submit({ score: result.score, status: 'completed', details: { total: result.total, mistakes: result.mistakes, found: result.found } })} />;
  return <FlashlightBuilder initialConfig={config} onSave={flashlightConfig => onEdit({ ...activity, title: flashlightConfig.title, flashlightConfig } as any)} />;
}
