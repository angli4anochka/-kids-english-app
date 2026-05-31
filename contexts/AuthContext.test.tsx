/**
 * Unit tests for AuthContext
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { User } from './AuthContext';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('AuthProvider initialization', () => {
    it('should load valid user and token from localStorage', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'teacher',
      };
      const mockToken = 'valid-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
    });

    it('should clear invalid user data from localStorage (missing id)', async () => {
      const invalidUser = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'teacher',
        // Missing 'id' field
      };
      const mockToken = 'valid-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(invalidUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
    });

    it('should clear invalid user data from localStorage (missing role)', async () => {
      const invalidUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        // Missing 'role' field
      };
      const mockToken = 'valid-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(invalidUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
    });

    it('should handle JSON parse errors gracefully', async () => {
      const mockToken = 'valid-token-123';
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', 'invalid-json-{]');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
    });

    it('should start with no user when localStorage is empty', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('login function (teacher/admin)', () => {
    it('should successfully login teacher with email and password', async () => {
      const mockUser: User = {
        id: 'teacher-123',
        email: 'teacher@example.com',
        displayName: 'Test Teacher',
        role: 'teacher',
      };
      const mockToken = 'teacher-token-123';

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { token: mockToken, user: mockUser },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let returnedUser: User | undefined;
      await act(async () => {
        returnedUser = await result.current.login('teacher@example.com', 'password123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/kids-api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teacher@example.com', password: 'password123' }),
      });

      expect(returnedUser).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(localStorage.getItem('authToken')).toBe(mockToken);
      expect(localStorage.getItem('authUser')).toBe(JSON.stringify(mockUser));
    });

    it('should throw error on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should throw generic error when error message is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'password');
        })
      ).rejects.toThrow('Login failed');
    });
  });

  describe('loginStudent function', () => {
    it('should successfully login student with login ID and password', async () => {
      const mockStudent: User = {
        id: 'student-123',
        login: 'STUDENT001',
        displayName: 'Test Student',
        role: 'student',
        groupId: 'group-123',
      };
      const mockToken = 'student-token-123';

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { token: mockToken, user: mockStudent },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let returnedUser: User | undefined;
      await act(async () => {
        returnedUser = await result.current.loginStudent('STUDENT001', 'password123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/kids-api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'STUDENT001', password: 'password123' }),
      });

      expect(returnedUser).toEqual(mockStudent);
      expect(result.current.user).toEqual(mockStudent);
      expect(result.current.token).toBe(mockToken);
      expect(localStorage.getItem('authToken')).toBe(mockToken);
      expect(localStorage.getItem('authUser')).toBe(JSON.stringify(mockStudent));
    });

    it('should throw error on failed student login', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Invalid student credentials',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.loginStudent('WRONGID', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid student credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('loginWithGoogle function', () => {
    it('should successfully login with Google OAuth code', async () => {
      const mockUser: User = {
        id: 'google-user-123',
        email: 'google@example.com',
        displayName: 'Google User',
        role: 'teacher',
      };
      const mockToken = 'google-token-123';

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { token: mockToken, user: mockUser },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithGoogle('google-auth-code-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/kids-api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'google-auth-code-123',
          redirectUri: 'https://tutorsdesk.ru/kids-app/auth/google/callback'
        }),
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(localStorage.getItem('authToken')).toBe(mockToken);
      expect(localStorage.getItem('authUser')).toBe(JSON.stringify(mockUser));
    });

    it('should throw error on failed Google login', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Google authentication failed',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.loginWithGoogle('invalid-code');
        })
      ).rejects.toThrow('Google authentication failed');

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('register function', () => {
    it('should successfully register new user', async () => {
      const mockUser: User = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'New User',
        role: 'teacher',
      };
      const mockToken = 'new-user-token-123';

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { token: mockToken, user: mockUser },
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register(
          'newuser@example.com',
          'password123',
          'New User'
        );
      });

      expect(mockFetch).toHaveBeenCalledWith('/kids-api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          displayName: 'New User',
        }),
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(localStorage.getItem('authToken')).toBe(mockToken);
      expect(localStorage.getItem('authUser')).toBe(JSON.stringify(mockUser));
    });

    it('should throw error on failed registration', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Email already exists',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'password', 'User');
        })
      ).rejects.toThrow('Email already exists');

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('logout function', () => {
    it('should clear user state and localStorage', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'teacher',
      };
      const mockToken = 'token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify user is loaded
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);

      // Logout
      act(() => {
        result.current.logout();
      });

      // Verify everything is cleared
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
    });

    it('should handle logout when already logged out', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      // Should not throw error
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should return context when used inside AuthProvider', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('token');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('loginStudent');
      expect(result.current).toHaveProperty('loginWithGoogle');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
    });
  });

  describe('AuthProvider component rendering', () => {
    it('should render children when loading is complete', async () => {
      render(
        <AuthProvider>
          <div data-testid="child-component">Child Content</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should provide context value to children', async () => {
      const TestComponent = () => {
        const { user, isLoading } = useAuth();
        return (
          <div>
            <div data-testid="loading">{isLoading ? 'Loading' : 'Ready'}</div>
            <div data-testid="user">{user ? user.displayName : 'No user'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });
});
