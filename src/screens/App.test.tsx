import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { createEngineState, extractPlayerAView, extractPlayerBView } from '../game-engine/engines';
import { INITIAL_PROGRESSION_STATE } from '../game-engine/scoring';
import { LostTogetherGame } from '../games/lost-together/LostTogetherGame';
import { MemorySyncGame } from '../games/memory-sync/MemorySyncGame';
import { SecretLanguageGame } from '../games/secret-language/SecretLanguageGame';
import { ShapeItGame } from '../games/shape-it/ShapeItGame';
import { LevelResultScreen } from './LevelResultScreen';

describe('UI Integration & Clue Isolation Checks', () => {
  it('renders Landing screen with Play, Join, and How to Play controls', () => {
    render(<App />);
    expect(screen.getByText(/Two Brains,/i)).toBeInTheDocument();
    expect(screen.getByText(/Two minds\. Different clues\. One mission\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play • Create Room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Partner's Room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How to Play & Settings/i })).toBeInTheDocument();
  });

  it('validates invalid room code cleanly on Join Room screen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Join Partner's Room/i }));
    const codeInput = await screen.findByLabelText(/Room Code/i);
    fireEvent.change(codeInput, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Join Cozy Room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter a valid 4–8 character room code/i);
  });

  it('isolates Memory Sync controls so Player A never sees Player B answer buttons', () => {
    const state = createEngineState(1, Date.now());
    const aView = extractPlayerAView(1, state);
    const bView = extractPlayerBView(1, state);

    const { unmount } = render(
      <MemorySyncGame
        role="host"
        playerAView={aView.kind === 'memory-sync' ? aView : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Describe this sequence aloud/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit Sequence/i })).not.toBeInTheDocument();
    unmount();

    render(
      <MemorySyncGame
        role="guest"
        playerAView={null}
        playerBView={bView.kind === 'memory-sync' ? bView : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Submit Sequence/i })).toBeInTheDocument();
    expect(screen.queryByText(/Describe this sequence aloud/i)).not.toBeInTheDocument();
  });

  it('isolates Secret Language coded tablet vs decoder key', () => {
    const state = createEngineState(2, Date.now());
    const aView = extractPlayerAView(2, state);
    const bView = extractPlayerBView(2, state);

    const { unmount } = render(
      <SecretLanguageGame
        role="host"
        playerAView={aView.kind === 'secret-language' ? aView : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Describe these secret symbols in order/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Symbol decoder key/i)).not.toBeInTheDocument();
    unmount();

    render(
      <SecretLanguageGame
        role="guest"
        playerAView={null}
        playerBView={bView.kind === 'secret-language' ? bView : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/Symbol decoder key/i)).toBeInTheDocument();
    expect(screen.queryByText(/Describe these secret symbols in order/i)).not.toBeInTheDocument();
  });

  it('isolates Lost Together full maze map vs 3x3 fog D-pad', () => {
    const state = createEngineState(3, Date.now());
    const aView = extractPlayerAView(3, state);
    const bView = extractPlayerBView(3, state);

    const { unmount } = render(
      <LostTogetherGame
        role="host"
        playerAView={aView.kind === 'lost-together' ? aView : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('grid', { name: /Cozy Room maze map/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Move Up/i })).not.toBeInTheDocument();
    unmount();

    render(
      <LostTogetherGame
        role="guest"
        playerAView={null}
        playerBView={bView.kind === 'lost-together' ? bView : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Move Up/i })).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: /Cozy Room maze map/i })).not.toBeInTheDocument();
  });

  it('isolates Shape It target blueprint vs builder board', () => {
    const state = createEngineState(4, Date.now());
    const aView = extractPlayerAView(4, state);
    const bView = extractPlayerBView(4, state);

    const { unmount } = render(
      <ShapeItGame
        role="host"
        playerAView={aView.kind === 'shape-it' ? aView : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Target Blueprint/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Check Blueprint/i })).not.toBeInTheDocument();
    unmount();

    render(
      <ShapeItGame
        role="guest"
        playerAView={null}
        playerBView={bView.kind === 'shape-it' ? bView : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Check Blueprint/i })).toBeInTheDocument();
    expect(screen.queryByText(/Target Blueprint/i)).not.toBeInTheDocument();
  });

  it('renders identical shared outcome stats on LevelResultScreen', () => {
    render(
      <LevelResultScreen
        outcome={{
          completionId: 'c1',
          levelId: 2,
          stars: 3,
          xpAwarded: 175,
          elapsedMs: 42_000,
          mistakes: 0,
          hintsUsed: 0,
          unlockedNextLevel: 3,
        }}
        progression={{ ...INITIAL_PROGRESSION_STATE, xp: 350, unlockedLevelId: 3 }}
        role="guest"
        localCharacter="girl"
        localCosmetic="none"
        partnerCharacter="boy"
        partnerCosmetic="none"
        onNextLevel={vi.fn()}
        onReplay={vi.fn()}
        onBackToLobby={vi.fn()}
      />,
    );
    expect(screen.getByText(/Level Complete!/i)).toBeInTheDocument();
    expect(screen.getByText(/\+175 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/00:42/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 3 Unlocked!/i)).toBeInTheDocument();
  });
});
