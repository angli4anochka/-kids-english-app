/**
 * Типы для урока и активностей
 */

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  order: number;

  // Presentation
  imageUrl?: string;
  audioUrl?: string;
  presentationType?: 'auto-slideshow' | 'manual' | 'image-with-audio';
  slides?: Array<{ imageUrl: string; duration?: number }>;

  // Video
  videoUrl?: string;

  // Interactive (Wordwall, Genially, Umaigra)
  wordwallUrl?: string;
  geniallyUrl?: string;
  interactiveUrl?: string;

  // Games
  snakeWordConfig?: any;
  letterTraceConfig?: any;
  letterRaceConfig?: any;
  letterMazeConfig?: any;

  // Meta
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  islandId: number;
  lessonNumber: number;
  title: string;
  description?: string;
  activities: Activity[];
  teacherId?: string;
  groupId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonState {
  id: string | null;
  groupId: number | null;
  islandId: string;
  lessonNumber: string;
  title: string;
  activities: Activity[];
  selectedActivity: Activity | null;

  // UI state
  isViewMode: boolean;
  isSaving: boolean;
  showAddModal: boolean;
  showSession: boolean;
  isInteractiveEnabled: boolean;

  // Session
  sessionGroupId: number | null;
  liveSessionId: string | null;
  activeSession: { id: string; activityIndex: number } | null;

  // Drag and drop
  draggedActivity: Activity | null;
  dragOverIndex: number | null;

  // Animation
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right';
  showActivityOverlay: boolean;

  // Editing
  editingTitleId: string | null;
  editingTitleValue: string;
}
