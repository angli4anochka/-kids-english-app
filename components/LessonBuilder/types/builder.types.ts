/**
 * Типы для UI конструктора уроков
 */

import type { Activity } from './lesson.types';

export interface DragItem {
  activity: Activity;
  index: number;
}

export interface BuilderUIState {
  isViewMode: boolean;
  isSaving: boolean;
  showAddModal: boolean;
  draggedActivity: Activity | null;
  dragOverIndex: number | null;
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right';
}

export interface ActivityTemplate {
  id: string;
  icon: string;
  label: string;
  description?: string;
  type: string;
}

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  { id: 'meet-family', icon: '👨‍👩‍👧‍👦', label: 'Meet Characters', type: 'presentation' },
  { id: 'speaking', icon: '💬', label: 'Speaking Practice', type: 'presentation' },
  { id: 'sounds', icon: '🔊', label: 'Sounds Trainer', type: 'presentation' },
  { id: 'numbers', icon: '🔢', label: 'Numbers Practice', type: 'presentation' },
  { id: 'video', icon: '📹', label: 'Video Lesson', type: 'video' },
  { id: 'song', icon: '🎵', label: 'Song Activity', type: 'video' },
  { id: 'game', icon: '🎮', label: 'Interactive Game', type: 'wordwall' },
  { id: 'quiz', icon: '❓', label: 'Quiz', type: 'wordwall' },
];
