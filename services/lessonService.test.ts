/**
 * Unit tests for lessonService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lessonService } from './lessonService';
import type { Lesson, CreateLessonData } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('lessonService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('authToken', 'test-token-123');

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      await lessonService.getLessons();

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
        json: async () => ({ success: true, data: [] }),
      });

      await lessonService.getLessons();

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });
  });

  describe('getLessons', () => {
    it('should fetch all lessons without groupId', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          island_id: 'island-1',
          group_id: 1,
          order_index: 0,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLessons }),
      });

      const lessons = await lessonService.getLessons();

      expect(lessons).toHaveLength(1);
      expect(lessons[0].islandId).toBe('island-1');
      expect(lessons[0].groupId).toBe(1);
      expect(lessons[0].orderIndex).toBe(0);
    });

    it('should fetch lessons with groupId filter', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      await lessonService.getLessons(123);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('groupId=123'),
        expect.any(Object)
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Database error' }),
      });

      await expect(lessonService.getLessons()).rejects.toThrow('Database error');
    });

    it('should transform snake_case to camelCase', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Test',
        island_id: 'island-1',
        group_id: 2,
        course_id: 'course-1',
        order_index: 5,
        created_at: '2023-01-01',
        updated_at: '2023-01-02',
        teacher_id: 'teacher-1',
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockLesson] }),
      });

      const lessons = await lessonService.getLessons();

      expect(lessons[0]).toMatchObject({
        islandId: 'island-1',
        groupId: 2,
        courseId: 'course-1',
        orderIndex: 5,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
        teacherId: 'teacher-1',
      });
    });
  });

  describe('getLesson', () => {
    it('should fetch a single lesson by id', async () => {
      const mockLesson = {
        id: 'lesson-123',
        title: 'Test Lesson',
        island_id: 'island-1',
        group_id: 1,
        order_index: 0,
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLesson }),
      });

      const lesson = await lessonService.getLesson('lesson-123');

      expect(lesson.id).toBe('lesson-123');
      expect(lesson.islandId).toBe('island-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123'),
        expect.any(Object)
      );
    });

    it('should throw error when lesson not found', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Lesson not found' }),
      });

      await expect(lessonService.getLesson('invalid-id')).rejects.toThrow('Lesson not found');
    });
  });

  describe('createLesson', () => {
    it('should create a new lesson', async () => {
      const newLesson: CreateLessonData = {
        title: 'New Lesson',
        islandId: 'island-1',
        groupId: 1,
        orderIndex: 0,
      };

      const mockResponse = {
        id: 'lesson-new',
        ...newLesson,
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockResponse }),
      });

      const lesson = await lessonService.createLesson(newLesson);

      expect(lesson.id).toBe('lesson-new');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newLesson),
        })
      );
    });

    it('should throw error when creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Creation failed' }),
      });

      await expect(
        lessonService.createLesson({ title: 'Test', islandId: 'island-1', groupId: 1, orderIndex: 0 })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('updateLesson', () => {
    it('should update an existing lesson', async () => {
      const updateData = { title: 'Updated Title' };
      const mockResponse = {
        id: 'lesson-123',
        title: 'Updated Title',
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockResponse }),
      });

      const lesson = await lessonService.updateLesson('lesson-123', updateData);

      expect(lesson.title).toBe('Updated Title');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should throw error when update fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Update failed' }),
      });

      await expect(lessonService.updateLesson('lesson-123', {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteLesson', () => {
    it('should delete a lesson', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

      await lessonService.deleteLesson('lesson-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error when deletion fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Deletion failed' }),
      });

      await expect(lessonService.deleteLesson('lesson-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('getActivities', () => {
    it('should fetch activities for a lesson', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          lessonId: 'lesson-123',
          type: 'image',
          title: 'Activity 1',
          orderIndex: 0,
          points: 10,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockActivities }),
      });

      const activities = await lessonService.getActivities('lesson-123');

      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe('activity-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/activities'),
        expect.any(Object)
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to fetch activities' }),
      });

      await expect(lessonService.getActivities('lesson-123')).rejects.toThrow(
        'Failed to fetch activities'
      );
    });
  });

  describe('addActivity', () => {
    it('should add a new activity to a lesson', async () => {
      const activityData = {
        type: 'image',
        title: 'New Activity',
        points: 10,
      };

      const mockResponse = {
        id: 'activity-new',
        lessonId: 'lesson-123',
        ...activityData,
        orderIndex: 0,
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockResponse }),
      });

      const activity = await lessonService.addActivity('lesson-123', activityData);

      expect(activity.id).toBe('activity-new');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/activities'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(activityData),
        })
      );
    });

    it('should throw error when adding activity fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to add activity' }),
      });

      await expect(
        lessonService.addActivity('lesson-123', { type: 'image', title: 'Test' })
      ).rejects.toThrow('Failed to add activity');
    });
  });

  describe('updateActivity', () => {
    it('should update an existing activity', async () => {
      const updateData = { title: 'Updated Activity' };
      const mockResponse = {
        id: 'activity-123',
        title: 'Updated Activity',
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockResponse }),
      });

      const activity = await lessonService.updateActivity('lesson-123', 'activity-123', updateData);

      expect(activity.title).toBe('Updated Activity');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/activities/activity-123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should throw error when update fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to update activity' }),
      });

      await expect(
        lessonService.updateActivity('lesson-123', 'activity-123', {})
      ).rejects.toThrow('Failed to update activity');
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

      await lessonService.deleteActivity('lesson-123', 'activity-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/activities/activity-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error when deletion fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to delete activity' }),
      });

      await expect(
        lessonService.deleteActivity('lesson-123', 'activity-123')
      ).rejects.toThrow('Failed to delete activity');
    });
  });

  describe('reorderActivities', () => {
    it('should reorder activities', async () => {
      const activityIds = ['activity-3', 'activity-1', 'activity-2'];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

      await lessonService.reorderActivities('lesson-123', activityIds);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/activities/reorder'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ activityIds }),
        })
      );
    });

    it('should throw error when reordering fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to reorder activities' }),
      });

      await expect(
        lessonService.reorderActivities('lesson-123', [])
      ).rejects.toThrow('Failed to reorder activities');
    });
  });

  describe('uploadImage', () => {
    it('should upload an image file', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockUrl = 'https://example.com/images/test.png';

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: { url: mockUrl } }),
      });

      const url = await lessonService.uploadImage(mockFile);

      expect(url).toBe(mockUrl);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/upload/image'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      // Verify FormData was used
      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toBeInstanceOf(FormData);
    });

    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('authToken', 'upload-token');
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: { url: 'test.png' } }),
      });

      await lessonService.uploadImage(mockFile);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer upload-token',
          }),
        })
      );
    });

    it('should throw error when upload fails', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Upload failed' }),
      });

      await expect(lessonService.uploadImage(mockFile)).rejects.toThrow('Upload failed');
    });
  });

  describe('getLessonState', () => {
    it('should fetch lesson state', async () => {
      const mockState = {
        currentActivityIndex: 2,
        isInteractiveEnabled: true,
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockState }),
      });

      const state = await lessonService.getLessonState('lesson-123');

      expect(state.currentActivityIndex).toBe(2);
      expect(state.isInteractiveEnabled).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/state'),
        expect.any(Object)
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to fetch lesson state' }),
      });

      await expect(lessonService.getLessonState('lesson-123')).rejects.toThrow(
        'Failed to fetch lesson state'
      );
    });
  });

  describe('updateLessonState', () => {
    it('should update lesson state', async () => {
      const stateUpdate = {
        currentActivityIndex: 3,
        isInteractiveEnabled: false,
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: stateUpdate }),
      });

      const state = await lessonService.updateLessonState('lesson-123', stateUpdate);

      expect(state.currentActivityIndex).toBe(3);
      expect(state.isInteractiveEnabled).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/lesson-123/state'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(stateUpdate),
        })
      );
    });

    it('should update only currentActivityIndex', async () => {
      const stateUpdate = { currentActivityIndex: 5 };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { currentActivityIndex: 5, isInteractiveEnabled: true },
        }),
      });

      await lessonService.updateLessonState('lesson-123', stateUpdate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(stateUpdate),
        })
      );
    });

    it('should throw error when update fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to update lesson state' }),
      });

      await expect(
        lessonService.updateLessonState('lesson-123', { currentActivityIndex: 1 })
      ).rejects.toThrow('Failed to update lesson state');
    });
  });
});
