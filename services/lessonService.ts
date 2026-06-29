import { API_CONFIG } from '../config/api';
import type { Lesson as LessonType, CreateLessonData as CreateLessonDataType } from '../types';
export type { Lesson, CreateLessonData } from '../types';

// LessonActivity - database representation (different from Activity in types)
export interface LessonActivity {
  id: string;
  lessonId: string;
  type: 'image' | 'youtube' | 'wordwall' | 'text' | 'meet-family' | 'speaking' | 'sounds-trainer' | 'numbers-practice' | 'video-song' | 'song' | 'games';
  title: string;
  subtitle?: string;
  contentUrl?: string;
  contentData?: Record<string, any>;
  orderIndex: number;
  points: number;
  createdAt: Date;
}

export interface CreateActivityData {
  type: string;
  title: string;
  subtitle?: string;
  contentUrl?: string;
  contentData?: Record<string, any>;
  points?: number;
}

class LessonService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getLessons(groupId?: number): Promise<LessonType[]> {
    const url = new URL(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}`, window.location.origin);
    if (groupId) {
      url.searchParams.append('groupId', groupId.toString());
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch lessons');
    }

    // Transform snake_case to camelCase
    return data.data.map((lesson: any) => ({
      ...lesson,
      islandId: lesson.island_id || lesson.islandId,
      groupId: lesson.group_id || lesson.groupId,
      courseId: lesson.course_id || lesson.courseId,
      orderIndex: lesson.order_index || lesson.orderIndex,
      createdAt: lesson.created_at || lesson.createdAt,
      updatedAt: lesson.updated_at || lesson.updatedAt,
      teacherId: lesson.teacher_id || lesson.teacherId,
    }));
  }

  async getLesson(id: string): Promise<LessonType> {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${id}`, {
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch lesson');
    }

    // Transform snake_case to camelCase
    const lesson = data.data;
    return {
      ...lesson,
      islandId: lesson.island_id || lesson.islandId,
      groupId: lesson.group_id || lesson.groupId,
      orderIndex: lesson.order_index || lesson.orderIndex,
      createdAt: lesson.created_at || lesson.createdAt,
      updatedAt: lesson.updated_at || lesson.updatedAt,
      teacherId: lesson.teacher_id || lesson.teacherId,
    };
  }

  async createLesson(lessonData: CreateLessonDataType): Promise<LessonType> {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonData),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create lesson');
    }

    return data.data;
  }

  async updateLesson(id: string, lessonData: Partial<CreateLessonDataType>): Promise<LessonType> {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonData),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update lesson');
    }

    return data.data;
  }

  async deleteLesson(id: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete lesson');
    }
  }

  async getActivities(lessonId: string, slim = false): Promise<LessonActivity[]> {
    const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/activities${slim ? '?slim=1' : ''}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch activities');
    }

    return data.data;
  }

  async getActivity(lessonId: string, activityId: string): Promise<any> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/activities/${activityId}`,
      { headers: this.getHeaders() }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch activity');
    }

    return data.data;
  }

  async addActivity(lessonId: string, activityData: CreateActivityData): Promise<LessonActivity> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/activities`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(activityData),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add activity');
    }

    return data.data;
  }

  async updateActivity(
    lessonId: string,
    activityId: string,
    activityData: Partial<CreateActivityData>
  ): Promise<LessonActivity> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/activities/${activityId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(activityData),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update activity');
    }

    return data.data;
  }

  async deleteActivity(lessonId: string, activityId: string): Promise<void> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/activities/${activityId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete activity');
    }
  }

  async reorderActivities(lessonId: string, activityIds: string[]): Promise<void> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/activities/reorder`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ activityIds }),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to reorder activities');
    }
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const token = this.getAuthToken();
    const response = await fetch(`${API_CONFIG.baseURL}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.data.url;
  }

  // Lesson state management
  async getLessonState(lessonId: string): Promise<{ currentActivityIndex: number; isInteractiveEnabled: boolean }> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/state`,
      {
        headers: this.getHeaders(),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch lesson state');
    }

    return data.data;
  }

  async updateLessonState(
    lessonId: string,
    state: { currentActivityIndex?: number; isInteractiveEnabled?: boolean }
  ): Promise<{ currentActivityIndex: number; isInteractiveEnabled: boolean }> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lessons}/${lessonId}/state`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(state),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update lesson state');
    }

    return data.data;
  }
}

export const lessonService = new LessonService();
