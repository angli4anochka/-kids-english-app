/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const submitSpy = vi.fn();
vi.mock('../../../hooks/useActivityResult', () => ({
  useActivityResult: () => submitSpy,
}));

// Game stub
vi.mock('../LetterMazeGame', () => ({
  default: ({ onComplete }: any) => (
    <div>
      <button
        data-testid="win"
        onClick={() => onComplete({ score: 10, status: 'completed', livesLeft: 2, totalLetters: 4 })}
      >
        win
      </button>
      <button
        data-testid="lose"
        onClick={() => onComplete({ score: 3, status: 'failed', livesLeft: 0, totalLetters: 4 })}
      >
        lose
      </button>
    </div>
  ),
}));

vi.mock('../LetterMazeBuilder', () => ({
  default: () => <div data-testid="maze-builder" />,
}));

import LetterMazeActivityRenderer from './LetterMazeActivityRenderer';

beforeEach(() => { submitSpy.mockReset(); });

const activity = {
  id: 'act-1', type: 'letter-maze' as const, title: 'Maze',
  letterMazeConfig: { title: 'M', subtitle: '', targetLetters: ['A'], lives: 3 },
} as any;

describe('LetterMazeActivityRenderer', () => {
  it('renders the Builder in edit mode', () => {
    render(
      <LetterMazeActivityRenderer
        activity={activity}
        isViewMode={false}
        isTeacher={true}
        onEdit={() => {}}
      />
    );
    expect(screen.getByTestId('maze-builder')).toBeInTheDocument();
  });

  it('renders the Game in view mode and submits "completed" result on win', () => {
    render(
      <LetterMazeActivityRenderer
        activity={activity}
        isViewMode={true}
        isTeacher={false}
        sessionId="s-1"
        lessonId="l-1"
        groupId={4}
        onEdit={() => {}}
      />
    );
    screen.getByTestId('win').click();
    expect(submitSpy).toHaveBeenCalledWith({
      score: 10,
      status: 'completed',
      details: { livesLeft: 2, totalLetters: 4 },
    });
  });

  it('submits "failed" status when student loses', () => {
    render(
      <LetterMazeActivityRenderer
        activity={activity}
        isViewMode={true}
        isTeacher={false}
        sessionId="s-1"
        lessonId="l-1"
        groupId={4}
        onEdit={() => {}}
      />
    );
    screen.getByTestId('lose').click();
    expect(submitSpy).toHaveBeenCalledWith(expect.objectContaining({
      score: 3,
      status: 'failed',
    }));
  });
});
