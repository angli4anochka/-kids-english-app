/**
 * Unit tests for useProgress hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from './useProgress';
import type { TeamName } from '../types';

const STORAGE_KEY = 'kids-english-progress';

describe('useProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default progress when localStorage is empty', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.progress).toEqual({
        userId: 'demo-user',
        userName: 'Ученик',
        team: 'lions',
        completedIslands: [],
        currentIsland: 'island-1',
        islandProgress: {},
        totalPoints: 0,
      });
    });

    it('should load progress from localStorage on initialization', () => {
      const savedProgress = {
        userId: 'user-123',
        userName: 'Test User',
        team: 'tigers' as TeamName,
        completedIslands: ['island-1'],
        currentIsland: 'island-2',
        islandProgress: {
          'island-1': {
            completedStages: ['stage-1'],
            earnedPoints: 100,
          },
        },
        totalPoints: 100,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));

      const { result } = renderHook(() => useProgress());

      expect(result.current.progress).toEqual(savedProgress);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json-{]');

      const { result } = renderHook(() => useProgress());

      expect(result.current.progress).toEqual({
        userId: 'demo-user',
        userName: 'Ученик',
        team: 'lions',
        completedIslands: [],
        currentIsland: 'island-1',
        islandProgress: {},
        totalPoints: 0,
      });
    });
  });

  describe('completeStage', () => {
    it('should complete a stage and award points', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      expect(result.current.progress.islandProgress['island-1']).toEqual({
        completedStages: ['stage-1'],
        earnedPoints: 50,
      });
      expect(result.current.progress.totalPoints).toBe(50);
    });

    it('should not award points for already completed stage', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      expect(result.current.progress.totalPoints).toBe(50);

      // Try to complete same stage again
      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      // Points should not be awarded again
      expect(result.current.progress.totalPoints).toBe(50);
      expect(result.current.progress.islandProgress['island-1'].completedStages).toEqual(['stage-1']);
    });

    it('should complete multiple stages and accumulate points', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 30);
      });

      act(() => {
        result.current.completeStage('island-1', 'stage-2', 40);
      });

      act(() => {
        result.current.completeStage('island-1', 'stage-3', 50);
      });

      expect(result.current.progress.islandProgress['island-1']).toEqual({
        completedStages: ['stage-1', 'stage-2', 'stage-3'],
        earnedPoints: 120,
      });
      expect(result.current.progress.totalPoints).toBe(120);
    });

    it('should track progress for multiple islands separately', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 30);
        result.current.completeStage('island-2', 'stage-1', 40);
      });

      expect(result.current.progress.islandProgress['island-1'].earnedPoints).toBe(30);
      expect(result.current.progress.islandProgress['island-2'].earnedPoints).toBe(40);
      expect(result.current.progress.totalPoints).toBe(70);
    });
  });

  describe('completeIsland', () => {
    it('should mark island as completed and clear current island', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.startIsland('island-1');
      });

      expect(result.current.progress.currentIsland).toBe('island-1');

      act(() => {
        result.current.completeIsland('island-1');
      });

      expect(result.current.progress.completedIslands).toContain('island-1');
      expect(result.current.progress.currentIsland).toBeUndefined();
    });

    it('should complete multiple islands', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeIsland('island-1');
        result.current.completeIsland('island-2');
      });

      expect(result.current.progress.completedIslands).toEqual(['island-1', 'island-2']);
    });
  });

  describe('startIsland', () => {
    it('should set current island', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.startIsland('island-2');
      });

      expect(result.current.progress.currentIsland).toBe('island-2');
    });

    it('should initialize island progress if not exists', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.startIsland('island-3');
      });

      expect(result.current.progress.islandProgress['island-3']).toEqual({
        completedStages: [],
        earnedPoints: 0,
      });
    });

    it('should preserve existing island progress', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      act(() => {
        result.current.startIsland('island-1');
      });

      expect(result.current.progress.islandProgress['island-1']).toEqual({
        completedStages: ['stage-1'],
        earnedPoints: 50,
      });
    });
  });

  describe('setTeam', () => {
    it('should change team', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.progress.team).toBe('lions');

      act(() => {
        result.current.setTeam('tigers');
      });

      expect(result.current.progress.team).toBe('tigers');
    });

    it('should accept all valid team names', () => {
      const { result } = renderHook(() => useProgress());

      const teams: TeamName[] = ['lions', 'tigers', 'bears', 'eagles'];

      teams.forEach((team) => {
        act(() => {
          result.current.setTeam(team);
        });
        expect(result.current.progress.team).toBe(team);
      });
    });
  });

  describe('resetProgress', () => {
    it('should reset to initial progress state', () => {
      const { result } = renderHook(() => useProgress());

      // Add some progress
      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
        result.current.setTeam('tigers');
        result.current.completeIsland('island-1');
      });

      expect(result.current.progress.totalPoints).toBe(50);

      // Reset
      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.progress).toEqual({
        userId: 'demo-user',
        userName: 'Ученик',
        team: 'lions',
        completedIslands: [],
        currentIsland: 'island-1',
        islandProgress: {},
        totalPoints: 0,
      });
    });
  });

  describe('getIslandProgress', () => {
    it('should return island progress if it exists', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      const progress = result.current.getIslandProgress('island-1');

      expect(progress).toEqual({
        completedStages: ['stage-1'],
        earnedPoints: 50,
      });
    });

    it('should return empty progress for non-existent island', () => {
      const { result } = renderHook(() => useProgress());

      const progress = result.current.getIslandProgress('non-existent');

      expect(progress).toEqual({
        completedStages: [],
        earnedPoints: 0,
      });
    });
  });

  describe('isStageCompleted', () => {
    it('should return true for completed stage', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      expect(result.current.isStageCompleted('island-1', 'stage-1')).toBe(true);
    });

    it('should return false for non-completed stage', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.isStageCompleted('island-1', 'stage-1')).toBe(false);
    });

    it('should return false for non-existent island', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.isStageCompleted('non-existent', 'stage-1')).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist progress to localStorage after each change', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeStage('island-1', 'stage-1', 50);
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.totalPoints).toBe(50);
      expect(parsed.islandProgress['island-1'].completedStages).toContain('stage-1');
    });

    it('should persist team changes to localStorage', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.setTeam('tigers');
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed.team).toBe('tigers');
    });

    it('should persist island completion to localStorage', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.completeIsland('island-1');
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed.completedIslands).toContain('island-1');
    });
  });
});
