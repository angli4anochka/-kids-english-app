import SnakeWordBuilder from '../SnakeWordBuilder';
import type { Activity } from '../../../types';
import type { SnakeWordConfig } from '../SnakeWordBuilder';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface SnakeWordActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

const SnakeWordActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  sessionId,
  onEdit,
}: SnakeWordActivityRendererProps) => {
  const activityData = activity as any;
  const config: SnakeWordConfig = activityData.snakeWordConfig || {
    words: [],
    speedMs: 390,
    lives: 3,
    collectMode: 'letters-in-order',
    wrongLetterPenalty: 'lose-life',
    showHint: true,
  };

  const submit = useActivityResult({
    activityId: activity.id!,
    lessonId, groupId, sessionId, isTeacher,
  });

  return (
    <SnakeWordBuilder
      value={config}
      onChange={(newConfig: SnakeWordConfig) => {
        onEdit({ ...activity, snakeWordConfig: newConfig } as any);
      }}
      isViewMode={isViewMode}
      onFinish={(result: any) => {
        console.log('Snake Word game finished:', result);
        submit({
          score: result.score,
          status: result.status === 'finished' ? 'completed' : 'failed',
          timeSeconds: result.timeSpentSec,
          details: {
            mistakes: result.mistakes,
            completedWords: result.completedWords,
            totalWords: result.totalWords,
          },
        });
      }}
    />
  );
};

export default SnakeWordActivityRenderer;
