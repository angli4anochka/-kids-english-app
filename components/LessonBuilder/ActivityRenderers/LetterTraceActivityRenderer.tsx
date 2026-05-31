import LetterTraceBuilder from '../LetterTraceBuilder';
import LetterTraceGame from '../LetterTraceGame';
import type { Activity } from '../../../types';
import type { LetterTraceConfig } from '../LetterTraceGame';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface LetterTraceActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

const LetterTraceActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  sessionId,
  onEdit,
}: LetterTraceActivityRendererProps) => {
  const activityData = activity as any;
  const config: LetterTraceConfig = activityData.letterTraceConfig || {
    title: 'A words',
    subtitle: 'Follow the dots',
    rows: [
      { icon: '🔊', label: 'эй', text: 'A a', translation: 'letter A', desiredRepeats: 3, minRepeats: 2, scale: 1.0 },
    ],
  };

  const submit = useActivityResult({
    activityId: activity.id!,
    lessonId, groupId, sessionId, isTeacher,
  });

  if (isViewMode) {
    return (
      <LetterTraceGame
        config={config}
        onComplete={(result) => {
          console.log('Letter Trace finished:', result);
          submit({
            score: result.score,
            status: result.status,
            details: { completed: result.completed, total: result.total },
          });
        }}
      />
    );
  }

  return (
    <LetterTraceBuilder
      initialConfig={config}
      onSave={(newConfig: LetterTraceConfig) => {
        onEdit({ ...activity, letterTraceConfig: newConfig } as any);
      }}
    />
  );
};

export default LetterTraceActivityRenderer;
