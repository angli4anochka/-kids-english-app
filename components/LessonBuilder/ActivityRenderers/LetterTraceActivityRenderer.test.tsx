/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const submitSpy = vi.fn();
vi.mock('../../../hooks/useActivityResult', () => ({
  useActivityResult: () => submitSpy,
}));

vi.mock('../LetterTraceGame', () => ({
  default: ({ onComplete }: any) => (
    <button data-testid="finish" onClick={() => onComplete({ score: 30, status: 'completed', completed: 3, total: 3 })}>
      finish trace
    </button>
  ),
}));
vi.mock('../LetterTraceBuilder', () => ({
  default: () => <div data-testid="trace-builder" />,
}));

import LetterTraceActivityRenderer from './LetterTraceActivityRenderer';

beforeEach(() => { submitSpy.mockReset(); });

const activity = {
  id: 'act-1', type: 'letter-trace' as const, title: 'Trace',
  letterTraceConfig: { title: 'T', subtitle: '', rows: [] },
} as any;

describe('LetterTraceActivityRenderer', () => {
  it('shows the Builder when editing', () => {
    render(<LetterTraceActivityRenderer activity={activity} isViewMode={false} isTeacher={true} onEdit={() => {}} />);
    expect(screen.getByTestId('trace-builder')).toBeInTheDocument();
  });

  it('submits when all letters are traced', () => {
    render(
      <LetterTraceActivityRenderer
        activity={activity}
        isViewMode={true}
        isTeacher={false}
        sessionId="s-1"
        lessonId="l-1"
        groupId={4}
        onEdit={() => {}}
      />
    );
    screen.getByTestId('finish').click();
    expect(submitSpy).toHaveBeenCalledWith({
      score: 30,
      status: 'completed',
      details: { completed: 3, total: 3 },
    });
  });
});
