import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivityResult } from './useActivityResult';

const mockEmit = vi.fn();
const mockSocket = { emit: mockEmit } as any;
const mockUser = { id: 'student-1', displayName: 'Alice', username: 'alice' };

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('./useSocket', () => ({
  useSocket: () => ({ socket: mockSocket, isConnected: true }),
}));

describe('useActivityResult', () => {
  beforeEach(() => {
    mockEmit.mockReset();
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it('posts to /kids-api/live-sessions/:sessionId/results with normalized payload', async () => {
    const { result } = renderHook(() => useActivityResult({
      activityId: 'act-1',
      lessonId: 'lesson-1',
      groupId: 4,
      sessionId: 'sess-1',
      isTeacher: false,
    }));

    await act(async () => {
      await result.current({ score: 90, status: 'completed', timeSeconds: 60, details: { mistakes: 2 } });
    });

    const fetchMock = (global as any).fetch as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/kids-api/live-sessions/sess-1/results');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      activityId: 'act-1',
      lessonId: 'lesson-1',
      studentId: 'student-1',
      studentName: 'Alice',
      score: 90,
      status: 'completed',
      timeSeconds: 60,
      groupId: 4,
    });
  });

  it('emits "activity-result" via socket when groupId is set and socket connected', async () => {
    const { result } = renderHook(() => useActivityResult({
      activityId: 'act-1', groupId: 4, sessionId: 'sess-1', isTeacher: false,
    }));
    await act(async () => { await result.current({ score: 10 }); });
    expect(mockEmit).toHaveBeenCalledWith('activity-result', expect.objectContaining({
      activityId: 'act-1',
      score: 10,
      status: 'completed',
      groupId: 4,
    }));
  });

  it('does not submit if user is teacher', async () => {
    const { result } = renderHook(() => useActivityResult({
      activityId: 'act-1', sessionId: 'sess-1', groupId: 4, isTeacher: true,
    }));
    await act(async () => { await result.current({ score: 50 }); });
    expect((global as any).fetch).toHaveBeenCalledWith(
      '/kids-api/live-sessions/none/results',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('stores self-study results when sessionId is missing and still emits via socket', async () => {
    const { result } = renderHook(() => useActivityResult({
      activityId: 'act-1', groupId: 4, isTeacher: false,
    }));
    await act(async () => { await result.current({ score: 30 }); });
    expect((global as any).fetch).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalled();
  });

  it('defaults status to "completed" and score to 0 when not provided', async () => {
    const { result } = renderHook(() => useActivityResult({
      activityId: 'act-1', sessionId: 'sess-1', groupId: 4, isTeacher: false,
    }));
    await act(async () => { await result.current({}); });
    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    expect(body.status).toBe('completed');
    expect(body.score).toBe(0);
  });

  it('does not crash when fetch rejects (network failure)', async () => {
    (global as any).fetch = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useActivityResult({
      activityId: 'act-1', sessionId: 'sess-1', groupId: 4, isTeacher: false,
    }));
    await expect(act(async () => { await result.current({ score: 5 }); })).resolves.not.toThrow();
    // Socket emit still happens
    expect(mockEmit).toHaveBeenCalled();
  });
});
