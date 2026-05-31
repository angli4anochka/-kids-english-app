// User types - centralized user-related interfaces

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email?: string;
  displayName: string;
  role: UserRole;
  avatarColor: string;
  groupId?: number;
  groupName?: string;
  points?: number;
}

export interface UserProgress {
  userId: string;
  userName: string;
  team: TeamName;
  completedIslands: string[];
  currentIsland?: string;
  islandProgress: {
    [islandId: string]: {
      completedStages: string[];
      currentStage?: string;
      earnedPoints: number;
    };
  };
  totalPoints: number;
}

export type TeamName = 'lions' | 'tigers' | 'bears';

export interface Team {
  id: TeamName;
  name: string;
  emoji: string;
  color: string;
  totalPoints: number;
  members: number;
}
