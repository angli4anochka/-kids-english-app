// Centralized type exports - single source of truth for all types

// Re-export user types
export type { User, UserRole, UserProgress, Team, TeamName } from './user.types';

// Re-export lesson types
export type { Lesson, CreateLessonData, LessonState, Course, Group } from './lesson.types';

// Re-export island types
export type { Island, IslandStatus, Stage, StageType, LeaderboardEntry } from './island.types';

// Re-export activity types
export type {
  Activity,
  ActivityType,
  BaseActivity,
  ImageActivity,
  VideoActivity,
  PresentationActivity,
  WordwallActivity,
  InteractiveActivity,
  GeniallyActivity,
  DragWordsActivity,
  SnakeWordActivity,
  LetterTraceActivity,
  LetterRaceActivity,
  LetterMazeActivity,
  GameActivity,
  CompleteActivity,
  ActivityComponentProps,
  NavigateEvent,
  ActivityChangeEvent,
  InteractiveToggleEvent,
} from './activity.types';

// Legacy type for backward compatibility
export type LegacyActivityType = 'meet-family' | 'speaking' | 'sounds-trainer' | 'numbers-practice' | 'video-song' | 'song' | 'games';
