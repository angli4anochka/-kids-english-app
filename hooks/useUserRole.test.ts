/**
 * Unit tests for useUserRole hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserRole } from './useUserRole';
import { AuthProvider } from '../contexts/AuthContext';
import type { User } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useUserRole', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should default to student role when no stored role and no authenticated user', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('student');
      });

      expect(result.current.isStudent).toBe(true);
      expect(result.current.isTeacher).toBe(false);
    });

    it('should load role from localStorage when no authenticated user', async () => {
      localStorage.setItem('user-role', 'teacher');

      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('teacher');
      });

      expect(result.current.isTeacher).toBe(true);
      expect(result.current.isStudent).toBe(false);
    });

    it('should use authenticated user role over localStorage', async () => {
      localStorage.setItem('user-role', 'student');
      localStorage.setItem('authToken', 'token-123');
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: 'user-123',
          email: 'teacher@example.com',
          displayName: 'Test Teacher',
          role: 'teacher',
        })
      );

      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('teacher');
      });

      expect(result.current.isTeacher).toBe(true);
      expect(result.current.isStudent).toBe(false);
    });
  });

  describe('Role switching', () => {
    it('should switch to teacher role', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('student');
      });

      act(() => {
        result.current.switchToTeacher();
      });

      expect(result.current.role).toBe('teacher');
      expect(result.current.isTeacher).toBe(true);
      expect(result.current.isStudent).toBe(false);
      expect(localStorage.getItem('user-role')).toBe('teacher');
    });

    it('should switch to student role', async () => {
      localStorage.setItem('user-role', 'teacher');

      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('teacher');
      });

      act(() => {
        result.current.switchToStudent();
      });

      expect(result.current.role).toBe('student');
      expect(result.current.isStudent).toBe(true);
      expect(result.current.isTeacher).toBe(false);
      expect(localStorage.getItem('user-role')).toBe('student');
    });

    it('should allow setting custom role', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('student');
      });

      act(() => {
        result.current.setRole('admin' as any);
      });

      expect(result.current.role).toBe('admin');
      expect(localStorage.getItem('user-role')).toBe('admin');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist role changes to localStorage', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('student');
      });

      act(() => {
        result.current.switchToTeacher();
      });

      expect(localStorage.getItem('user-role')).toBe('teacher');

      act(() => {
        result.current.switchToStudent();
      });

      expect(localStorage.getItem('user-role')).toBe('student');
    });
  });


  describe('Computed properties', () => {
    it('should correctly compute isTeacher property', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('student');
      });

      expect(result.current.isTeacher).toBe(false);

      act(() => {
        result.current.switchToTeacher();
      });

      expect(result.current.isTeacher).toBe(true);
    });

    it('should correctly compute isStudent property', async () => {
      localStorage.setItem('user-role', 'teacher');

      const { result } = renderHook(() => useUserRole(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.role).toBe('teacher');
      });

      expect(result.current.isStudent).toBe(false);

      act(() => {
        result.current.switchToStudent();
      });

      expect(result.current.isStudent).toBe(true);
    });
  });
});
