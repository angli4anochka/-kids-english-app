// Import game-specific configs
import type { SnakeWordConfig } from '../components/LessonBuilder/SnakeWordBuilder';
import type { LetterTraceConfig } from '../components/LessonBuilder/LetterTraceGame';
import type { LetterRaceConfig } from '../components/LessonBuilder/LetterRaceGame';
import type { LetterMazeConfig } from '../components/LessonBuilder/LetterMazeGame';

// Common activity types and interfaces
export type ActivityType =
  | 'image'
  | 'video'
  | 'presentation'
  | 'wordwall'
  | 'interactive'
  | 'genially'
  | 'complete'
  | 'drag-words'
  | 'snake-word'
  | 'letter-trace'
  | 'letter-race'
  | 'letter-maze'
  | 'secret-key-quest'
  | 'abc-quest'
  | 'letter-jump'
  | 'bubble-grammar'
  | 'flashlight'
  // Legacy types for backward compatibility
  | 'meet-family'
  | 'speaking'
  | 'sounds-trainer'
  | 'numbers-practice'
  | 'video-song'
  | 'song'
  | 'games'
  | string; // Allow any string for flexibility

export interface BaseActivity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  orderIndex?: number; // Make optional for flexibility
  contentData?: any;
  audioUrl?: string;
  contentUrl?: string;
  isCompleted?: boolean;
  points?: number;
  tags?: string[];
  content?: any;
  // Legacy fields for compatibility
  imageUrl?: string;
  videoUrl?: string;
  wordwallUrl?: string;
  geniallyUrl?: string;
  externalUrl?: string;
  // UI-specific fields
  icon?: string;
  status?: string;
  badges?: string[];
  subtasks?: Array<{ id: string; title: string; icon?: string }>;
  // Game-specific configs
  dragTextData?: { text: string };
  snakeWordConfig?: SnakeWordConfig;
  letterTraceConfig?: LetterTraceConfig;
  letterRaceConfig?: LetterRaceConfig;
  letterMazeConfig?: LetterMazeConfig;
}

export interface ImageActivity extends BaseActivity {
  type: 'image';
  contentUrl: string;
  audioUrl?: string;
}

export interface VideoActivity extends BaseActivity {
  type: 'video';
  contentUrl: string;
}

export interface PresentationActivity extends BaseActivity {
  type: 'presentation';
  presentationType?: 'auto-slideshow' | 'manual';
  presentationUrl?: string;
  slides?: Array<{
    imageUrl: string;
    audioUrl?: string;
    title?: string;
    duration?: number;
  }>;
  currentSlide?: number;
}

export interface WordwallActivity extends BaseActivity {
  type: 'wordwall';
  embedHtml: string;
}

export interface InteractiveActivity extends BaseActivity {
  type: 'interactive';
  embedUrl: string;
}

export interface GeniallyActivity extends BaseActivity {
  type: 'genially';
  embedHtml: string;
}

export interface DragWordsActivity extends BaseActivity {
  type: 'drag-words';
  contentData: {
    prompt?: string;
    words: string[];
    correctOrder: number[];
  };
}

export interface SnakeWordActivity extends BaseActivity {
  type: 'snake-word';
  contentData: {
    targetWord: string;
  };
}

export interface LetterTraceActivity extends BaseActivity {
  type: 'letter-trace';
  contentData: {
    letters: string[];
  };
}

export interface LetterRaceActivity extends BaseActivity {
  type: 'letter-race';
  contentData: {
    letters: string[];
    speed?: number;
  };
}

export interface LetterMazeActivity extends BaseActivity {
  type: 'letter-maze';
  contentData: {
    letters: string[];
  };
}

export interface GameActivity extends BaseActivity {
  type: 'secret-key-quest' | 'abc-quest' | 'letter-jump' | 'bubble-grammar' | 'flashlight';
  gameUrl?: string;
}

export interface CompleteActivity extends BaseActivity {
  type: 'complete';
}

// Use BaseActivity as main Activity type for maximum flexibility
export type Activity = BaseActivity;

// Specialized activity types still available for specific use cases
export type SpecializedActivity =
  | ImageActivity
  | VideoActivity
  | PresentationActivity
  | WordwallActivity
  | InteractiveActivity
  | GeniallyActivity
  | DragWordsActivity
  | SnakeWordActivity
  | LetterTraceActivity
  | LetterRaceActivity
  | LetterMazeActivity
  | GameActivity
  | CompleteActivity;

// Props for activity components
export interface ActivityComponentProps {
  activity: Activity;
  isStudent: boolean;
  isInteractive: boolean;
  onComplete?: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
}

// Lesson state types
export interface LessonState {
  currentActivityIndex: number;
  isInteractiveEnabled: boolean;
  completedActivities: string[];
}

// WebSocket event types
export interface NavigateEvent {
  lessonId: string;
  groupId: number;
  url: string;
}

export interface ActivityChangeEvent {
  lessonId: string;
  groupId: number;
  newIndex: number;
}

export interface InteractiveToggleEvent {
  lessonId: string;
  groupId: number;
  isEnabled: boolean;
}