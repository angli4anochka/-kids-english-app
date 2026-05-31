import { useState, useCallback } from 'react';
import { API_CONFIG } from '../config/api';

interface UseApiOptions {
  baseURL?: string;
  headers?: HeadersInit;
  transformResponse?: (data: any) => any;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const getAuthToken = useCallback((): string | null => {
    return localStorage.getItem('authToken');
  }, []);

  const getHeaders = useCallback((): HeadersInit => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, [options.headers, getAuthToken]);

  const request = useCallback(
    async (
      endpoint: string,
      config: RequestInit = {}
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const baseURL = options.baseURL || API_CONFIG.baseURL;
        const url = endpoint.startsWith('http')
          ? endpoint
          : `${baseURL}${endpoint}`;

        const response = await fetch(url, {
          ...config,
          headers: getHeaders(),
        });

        const data: ApiResponse<T> = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Request failed');
        }

        const transformedData = options.transformResponse
          ? options.transformResponse(data.data)
          : data.data;

        setState({
          data: transformedData as T,
          loading: false,
          error: null,
        });

        return transformedData as T;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        return null;
      }
    },
    [options.baseURL, options.transformResponse, getHeaders]
  );

  const get = useCallback(
    async (endpoint: string, params?: Record<string, string>): Promise<T | null> => {
      let url = endpoint;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url = `${endpoint}?${searchParams.toString()}`;
      }
      return request(url);
    },
    [request]
  );

  const post = useCallback(
    async (endpoint: string, body?: any): Promise<T | null> => {
      return request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    [request]
  );

  const put = useCallback(
    async (endpoint: string, body?: any): Promise<T | null> => {
      return request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    [request]
  );

  const del = useCallback(
    async (endpoint: string): Promise<T | null> => {
      return request(endpoint, {
        method: 'DELETE',
      });
    },
    [request]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    request,
    get,
    post,
    put,
    delete: del,
    reset,
  };
}

// Specialized hook for lesson API with snake_case to camelCase transformation
export function useLessonApi<T = any>() {
  return useApi<T>({
    transformResponse: (data) => {
      // Transform single object
      if (data && !Array.isArray(data)) {
        return {
          ...data,
          islandId: data.island_id || data.islandId,
          groupId: data.group_id || data.groupId,
          courseId: data.course_id || data.courseId,
          orderIndex: data.order_index || data.orderIndex,
          createdAt: data.created_at || data.createdAt,
          updatedAt: data.updated_at || data.updatedAt,
          teacherId: data.teacher_id || data.teacherId,
        };
      }

      // Transform array
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          ...item,
          islandId: item.island_id || item.islandId,
          groupId: item.group_id || item.groupId,
          courseId: item.course_id || item.courseId,
          orderIndex: item.order_index || item.orderIndex,
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          teacherId: item.teacher_id || item.teacherId,
        }));
      }

      return data;
    },
  });
}
