import LetterMazeBuilder from '../LetterMazeBuilder';
import LetterMazeGame from '../LetterMazeGame';
import type { Activity } from '../../../types';
import type { LetterMazeConfig } from '../LetterMazeGame';
import { useActivityResult } from '../../../hooks/useActivityResult';

interface LetterMazeActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

const LetterMazeActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  sessionId,
  onEdit,
}: LetterMazeActivityRendererProps) => {
  const activityData = activity as any;
  const config: LetterMazeConfig = activityData.letterMazeConfig || {
    title: 'Letter Maze',
    subtitle: 'Control: arrows, WASD or screen buttons. Correct letter: +1. Wrong letter: -1 and minus life.',
    targetLetters: ['A', 'B', 'C', 'D'],
    lives: 3,
  };

  const submit = useActivityResult({
    activityId: activity.id!,
    lessonId, groupId, sessionId, isTeacher,
  });

  if (isViewMode) {
    return (
      <LetterMazeGame
        config={config}
        onComplete={(result) => {
          console.log('Letter Maze finished:', result);
          submit({
            score: result.score,
            status: result.status,
            details: {
              livesLeft: result.livesLeft,
              totalLetters: result.totalLetters,
            },
          });
        }}
      />
    );
  }

  return (
    <LetterMazeBuilder
      initialConfig={config}
      onSave={(newConfig: LetterMazeConfig) => {
        onEdit({ ...activity, letterMazeConfig: newConfig } as any);
      }}
    />
  );
};

export default LetterMazeActivityRenderer;
