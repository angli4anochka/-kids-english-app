import type { Activity } from '../types';
import { getTemplateName, getActivityTypeFromTemplate, getTemplateTags } from './activityUtils';

/**
 * Create a new activity from template ID
 */
export const createActivityFromTemplate = (templateId: string): Activity => {
  const activityType = getActivityTypeFromTemplate(templateId);
  const tags = getTemplateTags(templateId);

  const baseActivity: Activity = {
    id: Date.now().toString(),
    type: activityType,
    title: getTemplateName(templateId),
    subtitle: '',
    isCompleted: false,
    points: 10,
    tags,
  };

  // Add template-specific configurations
  switch (templateId) {
    case 'snake-word':
      return {
        ...baseActivity,
        snakeWordConfig: {
          words: [],
          speedMs: 390,
          lives: 3,
          collectMode: 'letters-in-order' as const,
          wrongLetterPenalty: 'lose-life' as const,
          showHint: true,
        },
      };

    case 'letter-trace':
      return {
        ...baseActivity,
        letterTraceConfig: {
          title: 'A words',
          subtitle: 'Follow the dots',
          rows: [
            {
              icon: '🔊',
              label: 'эй',
              text: 'A a',
              translation: 'letter A',
              desiredRepeats: 3,
              minRepeats: 2,
              scale: 1.0,
            },
          ],
        },
      };

    case 'letter-race':
      return {
        ...baseActivity,
        letterRaceConfig: {
          title: 'Гонки B / D',
          subtitle: 'Рули машинкой и собирай только правильную букву',
          letterA: 'B',
          letterB: 'D',
          targetGoal: 10,
        },
      };

    case 'letter-maze':
      return {
        ...baseActivity,
        letterMazeConfig: {
          title: 'Letter Maze',
          subtitle: 'Control: arrows, WASD or screen buttons. Correct letter: +1. Wrong letter: -1 and minus life.',
          targetLetters: ['A', 'B', 'C', 'D'],
          lives: 3,
        },
      };

    default:
      return baseActivity;
  }
};
