// Island types - centralized island-related interfaces

export type IslandStatus = 'locked' | 'available' | 'completed';

export type StageType = 'video' | 'quiz' | 'drag-drop' | 'practice';

export interface Island {
  id: string;
  title: string;
  description: string;
  status: IslandStatus;
  position: { x: number; y: number };
  stages: Stage[];
  totalPoints: number;
  emoji: string;
  scale?: number;
  // Database fields (from API)
  island_number?: number;
  name?: string;
  lesson_count?: number;
}

export interface Stage {
  id: string;
  title: string;
  type: StageType;
  content?: any;
  points: number;
  teacherNotes?: string;
}

export interface LeaderboardEntry {
  team: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    totalPoints: number;
    members: number;
  };
  rank: number;
}
