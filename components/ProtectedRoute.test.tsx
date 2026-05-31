/**
 * Unit tests for ProtectedRoute component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from '@/utils/routing-adapter';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';
import type { User } from '../types';

// Mock Navigate component from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
      mockNavigate(to, replace);
      return <div data-testid="navigate">Navigate to {to}</div>;
    },
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Loading state', () => {
    it('should show loading spinner then redirect when not authenticated', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </BrowserRouter>
      );

      // Should eventually redirect to login after loading completes
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', true);
      });
    });
  });

  describe('Unauthenticated user', () => {
    it('should redirect to login when user is not authenticated', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div data-testid="protected-content">Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', true);
      });
    });
  });

  describe('Authenticated user', () => {
    it('should render children when user is authenticated as student', async () => {
      const mockUser: User = {
        id: 'student-123',
        login: 'STUDENT001',
        displayName: 'Test Student',
        role: 'student',
        groupId: 'group-123',
      };
      const mockToken = 'student-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div data-testid="protected-content">Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when user is authenticated as teacher', async () => {
      const mockUser: User = {
        id: 'teacher-123',
        email: 'teacher@example.com',
        displayName: 'Test Teacher',
        role: 'teacher',
      };
      const mockToken = 'teacher-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div data-testid="protected-content">Teacher Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(screen.getByText('Teacher Content')).toBeInTheDocument();
    });
  });

  describe('Teacher-only routes', () => {
    it('should render children when teacher accesses teacher-only route', async () => {
      const mockUser: User = {
        id: 'teacher-123',
        email: 'teacher@example.com',
        displayName: 'Test Teacher',
        role: 'teacher',
      };
      const mockToken = 'teacher-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requireTeacher={true}>
                    <div data-testid="teacher-content">Teacher Only Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('teacher-content')).toBeInTheDocument();
      });

      expect(screen.getByText('Teacher Only Content')).toBeInTheDocument();
    });

    it('should redirect student to /map when accessing teacher-only route', async () => {
      const mockUser: User = {
        id: 'student-123',
        login: 'STUDENT001',
        displayName: 'Test Student',
        role: 'student',
        groupId: 'group-123',
      };
      const mockToken = 'student-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requireTeacher={true}>
                    <div data-testid="teacher-content">Teacher Only Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/map', true);
      });
    });

    it('should redirect admin to /map when accessing teacher-only route', async () => {
      const mockUser: User = {
        id: 'admin-123',
        email: 'admin@example.com',
        displayName: 'Test Admin',
        role: 'admin',
      };
      const mockToken = 'admin-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requireTeacher={true}>
                    <div data-testid="teacher-content">Teacher Only Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/map', true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle requireTeacher=false for all authenticated users', async () => {
      const mockUser: User = {
        id: 'student-123',
        login: 'STUDENT001',
        displayName: 'Test Student',
        role: 'student',
        groupId: 'group-123',
      };
      const mockToken = 'student-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requireTeacher={false}>
                    <div data-testid="content">Open Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });

      expect(screen.getByText('Open Content')).toBeInTheDocument();
    });

    it('should not show loading after authentication completes', async () => {
      const mockUser: User = {
        id: 'student-123',
        login: 'STUDENT001',
        displayName: 'Test Student',
        role: 'student',
        groupId: 'group-123',
      };
      const mockToken = 'student-token-123';

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div data-testid="content">Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });
  });
});
