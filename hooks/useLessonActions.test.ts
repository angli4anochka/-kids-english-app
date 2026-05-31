import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLessonActions } from './useLessonActions';
import type { Activity } from '../types';

const setActivities = vi.fn();
const setSelectedActivity = vi.fn();
const setIsSaving = vi.fn();

function makeProps(overrides: any = {}) {
  return {
    currentLessonId: 'lesson-uuid-1',
    activities: [] as Activity[],
    setActivities,
    setSelectedActivity,
    setIsSaving,
    setCurrentLessonId: vi.fn(),
    title: 'Test lesson',
    setTitle: vi.fn(),
    islandId: '1',
    lessonNumber: '1',
    ...overrides,
  };
}

beforeEach(() => {
  setActivities.mockReset();
  setSelectedActivity.mockReset();
  setIsSaving.mockReset();
  (global as any).fetch = vi.fn();
});

describe('useLessonActions.handleEditActivity', () => {
  it('PUTs to update when activity.id is a UUID', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const uuid = '12345678-1234-1234-1234-123456789012';
    const activity: any = { id: uuid, type: 'snake-word', title: 'X', points: 10 };
    const { result } = renderHook(() => useLessonActions(makeProps({ activities: [activity] })));

    await act(async () => { await result.current.handleEditActivity(activity); });

    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global as any).fetch.mock.calls[0];
    expect(url).toBe(`/kids-api/lessons/lesson-uuid-1/activities/${uuid}`);
    expect(init.method).toBe('PUT');
  });

  it('POSTs to create when activity.id is a timestamp (temp id)', async () => {
    const newUuid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: newUuid, type: 'snake-word', title: 'X' }),
    });
    const tempId = String(Date.now());
    const activity: any = { id: tempId, type: 'snake-word', title: 'X', points: 10 };
    const { result } = renderHook(() => useLessonActions(makeProps({ activities: [activity] })));

    await act(async () => { await result.current.handleEditActivity(activity); });

    const [url, init] = (global as any).fetch.mock.calls[0];
    expect(url).toBe('/kids-api/lessons/lesson-uuid-1/activities');
    expect(init.method).toBe('POST');
    // Replaces local temp id with the returned UUID
    expect(setActivities).toHaveBeenCalled();
    const lastCall = setActivities.mock.calls[setActivities.mock.calls.length - 1][0];
    expect(lastCall[0].id).toBe(newUuid);
  });

  it('sends body with contentUrl/contentData keys (camelCase) — backend expects these names', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const uuid = '12345678-1234-1234-1234-123456789012';
    const activity: any = {
      id: uuid, type: 'image', title: 'T', points: 5,
      imageUrl: 'https://example.com/a.png',
      contentData: { foo: 'bar' },
      snakeWordConfig: { words: ['CAT'] },
    };
    const { result } = renderHook(() => useLessonActions(makeProps({ activities: [activity] })));
    await act(async () => { await result.current.handleEditActivity(activity); });

    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    expect(body).toHaveProperty('contentUrl', 'https://example.com/a.png');
    expect(body.contentData).toMatchObject({ foo: 'bar', snakeWordConfig: { words: ['CAT'] } });
    // Should not use snake_case
    expect(body).not.toHaveProperty('content_url');
    expect(body).not.toHaveProperty('content_data');
  });

  it('does nothing when no currentLessonId', async () => {
    (global as any).fetch = vi.fn();
    const activity: any = { id: 'x', type: 'snake-word', title: 'Y' };
    const { result } = renderHook(() => useLessonActions(makeProps({ currentLessonId: null, activities: [activity] })));
    await act(async () => { await result.current.handleEditActivity(activity); });
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('logs but does not throw when fetch fails on POST', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => ({ error: 'boom' }),
    });
    const tempId = String(Date.now());
    const activity: any = { id: tempId, type: 'snake-word' };
    const { result } = renderHook(() => useLessonActions(makeProps({ activities: [activity] })));
    await expect(act(async () => { await result.current.handleEditActivity(activity); }))
      .resolves.not.toThrow();
  });
});
