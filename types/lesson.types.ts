// Lesson types - centralized lesson-related interfaces

export interface Lesson {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  islandId?: number;
  emoji: string;
  status: 'draft' | 'published' | 'archived';
  groupId?: number;
  courseId?: string;
  orderIndex?: number;
  order_index?: number;
  unit_number?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  islandId?: number;
  emoji?: string;
  groupId?: number;
}

export interface LessonState {
  lessonId: string;
  currentActivity: string | null;
  completedActivities: string[];
  earnedPoints: number;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  emoji: string;
  status: string;
}

export interface Group {
  id: number;
  name: string;
  teacher_id: string;
  completed_lessons?: number;
  total_lessons?: number;
  current_lesson_title?: string;
  currentLessonTitle?: string;
  current_lesson_id?: string;
}
