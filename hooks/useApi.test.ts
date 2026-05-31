/**
 * Unit tests for useApi hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi, useLessonApi } from './useApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useApi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with null data, not loading, and no error', () => {
      const { result } = renderHook(() => useApi());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Authentication', () => {
    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('authToken', 'test-token-123');

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: { message: 'Success' } }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should not include Authorization header when token does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.get('/test');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should include custom headers from options', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() =>
        useApi({
          headers: {
            'X-Custom-Header': 'custom-value',
          },
        })
      );

      await result.current.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('GET requests', () => {
    it('should perform GET request and update state', async () => {
      const mockData = { id: 1, name: 'Test' };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useApi());

      const data = await result.current.get('/api/test');

      expect(data).toEqual(mockData);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should append query parameters to URL', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.get('/api/test', { page: '1', limit: '10' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?page=1&limit=10'),
        expect.any(Object)
      );
    });

    it('should set loading to true during request', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ json: async () => ({ success: true, data: {} }) });
            }, 100);
          })
      );

      const { result } = renderHook(() => useApi());

      const promise = result.current.get('/test');

      // Check loading state immediately
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await promise;

      expect(result.current.loading).toBe(false);
    });

    it('should handle full URL (starting with http)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.get('https://external-api.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/data',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should perform POST request with body', async () => {
      const mockBody = { title: 'New Item', content: 'Content' };
      const mockResponse = { id: 123, ...mockBody };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockResponse }),
      });

      const { result } = renderHook(() => useApi());

      const data = await result.current.post('/api/items', mockBody);

      expect(data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockBody),
        })
      );
    });

    it('should perform POST request without body', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.post('/api/action');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: 'null',
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should perform PUT request with body', async () => {
      const mockBody = { title: 'Updated Title' };
      const mockResponse = { id: 123, ...mockBody };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockResponse }),
      });

      const { result } = renderHook(() => useApi());

      const data = await result.current.put('/api/items/123', mockBody);

      expect(data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockBody),
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should perform DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: null }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.delete('/api/items/123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Not found' }),
      });

      const { result } = renderHook(() => useApi());

      const data = await result.current.get('/api/test');

      expect(data).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Not found');
      expect(result.current.loading).toBe(false);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useApi());

      const data = await result.current.get('/api/test');

      expect(data).toBeNull();
      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });

    it('should handle unknown error type', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useApi());

      const data = await result.current.get('/api/test');

      expect(data).toBeNull();
      expect(result.current.error).toBe('Unknown error');
    });

    it('should handle API response without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false }),
      });

      const { result } = renderHook(() => useApi());

      const data = await result.current.get('/api/test');

      expect(result.current.error).toBe('Request failed');
    });
  });

  describe('Transform response', () => {
    it('should transform response data using custom transformer', async () => {
      const mockData = { name: 'test' };
      const transformedData = { name: 'TEST' };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() =>
        useApi({
          transformResponse: (data) => ({
            ...data,
            name: data.name.toUpperCase(),
          }),
        })
      );

      const data = await result.current.get('/test');

      expect(data).toEqual(transformedData);
      expect(result.current.data).toEqual(transformedData);
    });

    it('should not transform if transformResponse is not provided', async () => {
      const mockData = { name: 'test' };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useApi());

      const data = await result.current.get('/test');

      expect(data).toEqual(mockData);
    });
  });

  describe('Base URL configuration', () => {
    it('should use custom base URL from options', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() =>
        useApi({
          baseURL: 'https://custom-api.com',
        })
      );

      await result.current.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.com/test',
        expect.any(Object)
      );
    });

    it('should use default API_CONFIG.baseURL when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.any(Object)
      );
    });
  });

  describe('Reset functionality', () => {
    it('should reset state to initial values', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      const { result } = renderHook(() => useApi());

      await result.current.get('/test');

      expect(result.current.data).toEqual({ id: 1 });

      result.current.reset();

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});

describe('useLessonApi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Snake case to camelCase transformation', () => {
    it('should transform single object from snake_case to camelCase', async () => {
      const mockData = {
        id: 'lesson-1',
        title: 'Test Lesson',
        island_id: 'island-1',
        group_id: 1,
        course_id: 'course-1',
        order_index: 5,
        created_at: '2023-01-01',
        updated_at: '2023-01-02',
        teacher_id: 'teacher-1',
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useLessonApi());

      const data = await result.current.get('/api/lessons/1');

      expect(data).toMatchObject({
        id: 'lesson-1',
        islandId: 'island-1',
        groupId: 1,
        courseId: 'course-1',
        orderIndex: 5,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
        teacherId: 'teacher-1',
      });
    });

    it('should transform array of objects', async () => {
      const mockData = [
        {
          id: 'lesson-1',
          island_id: 'island-1',
          group_id: 1,
        },
        {
          id: 'lesson-2',
          island_id: 'island-2',
          group_id: 2,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useLessonApi());

      const data = await result.current.get('/api/lessons');

      expect(data).toEqual([
        {
          id: 'lesson-1',
          island_id: 'island-1',
          islandId: 'island-1',
          group_id: 1,
          groupId: 1,
          courseId: undefined,
          orderIndex: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          teacherId: undefined,
        },
        {
          id: 'lesson-2',
          island_id: 'island-2',
          islandId: 'island-2',
          group_id: 2,
          groupId: 2,
          courseId: undefined,
          orderIndex: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          teacherId: undefined,
        },
      ]);
    });

    it('should preserve existing camelCase fields', async () => {
      const mockData = {
        id: 'lesson-1',
        islandId: 'island-existing',
        group_id: 1,
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useLessonApi());

      const data = await result.current.get('/api/lessons/1');

      expect(data).toMatchObject({
        islandId: 'island-existing', // Prefers existing camelCase
        groupId: 1,
      });
    });

    it('should return data as-is if not object or array', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: 'string-data' }),
      });

      const { result } = renderHook(() => useLessonApi());

      const data = await result.current.get('/test');

      expect(data).toBe('string-data');
    });

    it('should handle null data gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: null }),
      });

      const { result } = renderHook(() => useLessonApi());

      const data = await result.current.get('/test');

      expect(data).toBeNull();
    });
  });
});
