/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const submitSpy = vi.fn();
vi.mock('../../../hooks/useActivityResult', () => ({
  useActivityResult: () => submitSpy,
}));

vi.mock('../LetterRaceGame', () => ({
  default: ({ onComplete }: any) => (
    <button data-testid="finish" onClick={() => onComplete({ score: 42, mistakes: 3 })}>
      finish race
    </button>
  ),
}));
vi.mock('../LetterRaceBuilder', () => ({
  default: () => <div data-testid="race-builder" />,
}));

import LetterRaceActivityRenderer from './LetterRaceActivityRenderer';

beforeEach(() => { submitSpy.mockReset(); });

const activity = {
  id: 'act-1', type: 'letter-race' as const, title: 'Race',
  letterRaceConfig: { title: 'R', subtitle: '', letterA: 'B', letterB: 'D', targetGoal: 10 },
} as any;

describe('LetterRaceActivityRenderer', () => {
  it('shows the Builder in edit mode', () => {
    render(<LetterRaceActivityRenderer activity={activity} isViewMode={false} isTeacher={true} onEdit={() => {}} />);
    expect(screen.getByTestId('race-builder')).toBeInTheDocument();
  });

  it('submits result on game completion in view mode', () => {
    render(
      <LetterRaceActivityRenderer
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
      score: 42,
      status: 'completed',
      details: { mistakes: 3 },
    });
  });
});
