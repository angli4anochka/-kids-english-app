import LetterRaceBuilder from '../LetterRaceBuilder';
import LetterRaceGame from '../LetterRaceGame';
import type { Activity } from '../../../types';
import type { LetterRaceConfig } from '../LetterRaceGame';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface LetterRaceActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

const LetterRaceActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  sessionId,
  onEdit,
}: LetterRaceActivityRendererProps) => {
  const activityData = activity as any;
  const config: LetterRaceConfig = activityData.letterRaceConfig || {
    title: 'Гонки B / D',
    subtitle: 'Рули машинкой и собирай только правильную букву',
    letterA: 'B',
    letterB: 'D',
    targetGoal: 10,
  };

  const submit = useActivityResult({
    activityId: activity.id!,
    lessonId, groupId, sessionId, isTeacher,
  });

  if (isViewMode) {
    return (
      <LetterRaceGame
        config={config}
        onComplete={(result: any) => {
          console.log('Letter Race finished:', result);
          submit({
            score: result?.score ?? 0,
            status: 'completed',
            details: { mistakes: result?.mistakes },
          });
        }}
      />
    );
  }

  return (
    <LetterRaceBuilder
      initialConfig={config}
      onSave={(newConfig: LetterRaceConfig) => {
        onEdit({ ...activity, letterRaceConfig: newConfig } as any);
      }}
    />
  );
};

export default LetterRaceActivityRenderer;
