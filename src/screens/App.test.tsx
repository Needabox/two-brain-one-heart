import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { createEngineState, extractPlayerAView, extractPlayerBView } from '../game-engine/engines';
import {
  createArcadeEngineState,
  extractArcadePlayerAView,
  extractArcadePlayerBView,
} from '../game-engine/arcadeEngines';
import { INITIAL_PROGRESSION_STATE } from '../game-engine/scoring';
import { BalloonRescueGame } from '../games/balloon-rescue/BalloonRescueGame';
import { BridgeBuilderGame } from '../games/bridge-builder/BridgeBuilderGame';
import { DontPressTogetherGame } from '../games/dont-press-together/DontPressTogetherGame';
import { DrawMyMindGame } from '../games/draw-my-mind/DrawMyMindGame';
import { LostTogetherGame } from '../games/lost-together/LostTogetherGame';
import { MemorySyncGame } from '../games/memory-sync/MemorySyncGame';
import { PotionLabGame } from '../games/potion-lab/PotionLabGame';
import { PowerConnectionGame } from '../games/power-connection/PowerConnectionGame';
import { SecretLanguageGame } from '../games/secret-language/SecretLanguageGame';
import { ShapeItGame } from '../games/shape-it/ShapeItGame';
import { ArcadeSelectScreen } from './ArcadeSelectScreen';
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

  it('renders ArcadeSelectScreen with category tabs and difficulty selector', () => {
    const onSelect = vi.fn();
    render(
      <ArcadeSelectScreen
        progression={INITIAL_PROGRESSION_STATE}
        selectedTarget={{ mode: 'arcade', gameId: 'rhythm-duo', difficulty: 'easy' }}
        inRoom
        isHost
        onSelectArcadeGame={onSelect}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/8 Co-op Mini-Games/i)).toBeInTheDocument();
    expect(screen.getByText('Rhythm Duo')).toBeInTheDocument();
    expect(screen.getByText('Balloon Rescue')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Memory' }));
    expect(screen.getByText('Potion Lab')).toBeInTheDocument();
    expect(screen.queryByText('Balloon Rescue')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hard' }));
    fireEvent.click(screen.getByRole('button', { name: /Select/i }));
    expect(onSelect).toHaveBeenCalledWith('potion-lab', 'hard');
  });

  it('enforces UI clue isolation across Don\'t Press Together, Potion Lab, Power Connection, Draw My Mind, Bridge Builder, and Balloon Rescue', () => {
    // 1. Don't Press Together: Goal values only on Host; Safety Manual only on Guest
    const dpState = createArcadeEngineState('dont-press-together', 'easy', 1000);
    const dpA = extractArcadePlayerAView(dpState);
    const dpB = extractArcadePlayerBView(dpState);
    const r1 = render(
      <DontPressTogetherGame
        role="host"
        playerAView={dpA.kind === 'dont-press-together' ? dpA : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Goal:/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Safety Manual/i)).not.toBeInTheDocument();
    r1.unmount();

    const r2 = render(
      <DontPressTogetherGame
        role="guest"
        playerAView={null}
        playerBView={dpB.kind === 'dont-press-together' ? dpB : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Safety Manual/i)).toBeInTheDocument();
    expect(screen.queryByText(/Goal:/i)).not.toBeInTheDocument();
    r2.unmount();

    // 2. Potion Lab: Secret Recipe only on Host; Brew button only on Guest
    const potState = createArcadeEngineState('potion-lab', 'easy', 1000);
    const potA = extractArcadePlayerAView(potState);
    const potB = extractArcadePlayerBView(potState);
    const r3 = render(
      <PotionLabGame
        role="host"
        playerAView={potA.kind === 'potion-lab' ? potA : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Secret Recipe/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Brew Potion!/i })).not.toBeInTheDocument();
    r3.unmount();

    const r4 = render(
      <PotionLabGame
        role="guest"
        playerAView={null}
        playerBView={potB.kind === 'potion-lab' ? potB : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Brew Potion!/i })).toBeInTheDocument();
    expect(screen.queryByText(/Secret Recipe/i)).not.toBeInTheDocument();
    r4.unmount();

    // 3. Power Connection & Bridge Builder: Blueprint vs Builder Grid
    const pcState = createArcadeEngineState('power-connection', 'easy', 1000);
    const pcA = extractArcadePlayerAView(pcState);
    const pcB = extractArcadePlayerBView(pcState);
    const r5 = render(
      <PowerConnectionGame
        role="host"
        playerAView={pcA.kind === 'power-connection' ? pcA : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Blueprint Only/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Test & Submit Circuit/i })).not.toBeInTheDocument();
    r5.unmount();

    const r6 = render(
      <PowerConnectionGame
        role="guest"
        playerAView={null}
        playerBView={pcB.kind === 'power-connection' ? pcB : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Test & Submit Circuit/i })).toBeInTheDocument();
    r6.unmount();

    const bbState = createArcadeEngineState('bridge-builder', 'easy', 1000);
    const bbA = extractArcadePlayerAView(bbState);
    const bbB = extractArcadePlayerBView(bbState);
    const r7 = render(
      <BridgeBuilderGame
        role="host"
        playerAView={bbA.kind === 'bridge-builder' ? bbA : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/Blueprint Only/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inspect & Cross Bridge!/i })).not.toBeInTheDocument();
    r7.unmount();

    const r8 = render(
      <BridgeBuilderGame
        role="guest"
        playerAView={null}
        playerBView={bbB.kind === 'bridge-builder' ? bbB : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Inspect & Cross Bridge!/i })).toBeInTheDocument();
    r8.unmount();

    // 4. Draw My Mind: drawer sees secretWord; guesser never sees secretWord
    const drawState = createArcadeEngineState('draw-my-mind', 'easy', 1000);
    const drawA = extractArcadePlayerAView(drawState);
    const drawB = extractArcadePlayerBView(drawState);
    const r9 = render(
      <DrawMyMindGame
        role="host"
        view={drawA.kind === 'draw-my-mind' ? drawA : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('SUN')).toBeInTheDocument();
    r9.unmount();

    const r10 = render(
      <DrawMyMindGame
        role="guest"
        view={drawB.kind === 'draw-my-mind' ? drawB : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByText('SUN')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Guess/i })).toBeInTheDocument();
    r10.unmount();

    // 5. Balloon Rescue: Host controls horizontal Left/Right, Guest controls vertical Rise/Sink
    const balState = createArcadeEngineState('balloon-rescue', 'easy', 1000);
    const balA = extractArcadePlayerAView(balState);
    const balB = extractArcadePlayerBView(balState);
    const r11 = render(
      <BalloonRescueGame
        role="host"
        playerAView={balA.kind === 'balloon-rescue' ? balA : null}
        playerBView={null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Left/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rise/i })).not.toBeInTheDocument();
    r11.unmount();

    const r12 = render(
      <BalloonRescueGame
        role="guest"
        playerAView={null}
        playerBView={balB.kind === 'balloon-rescue' ? balB : null}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Rise/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Left/i })).not.toBeInTheDocument();
    r12.unmount();
  });

  it('renders Arcade score and More Arcade Games action on LevelResultScreen', () => {
    render(
      <LevelResultScreen
        outcome={{
          completionId: 'arc-res-1',
          levelId: 1,
          arcade: { gameId: 'rhythm-duo', difficulty: 'hard', score: 1420 },
          stars: 3,
          xpAwarded: 245,
          elapsedMs: 36_000,
          mistakes: 0,
          hintsUsed: 0,
          unlockedNextLevel: null,
        }}
        progression={{ ...INITIAL_PROGRESSION_STATE, xp: 595 }}
        role="host"
        localCharacter="boy"
        localCosmetic="none"
        partnerCharacter="girl"
        partnerCosmetic="none"
        onNextLevel={vi.fn()}
        onReplay={vi.fn()}
        onOpenArcade={vi.fn()}
        onBackToLobby={vi.fn()}
      />,
    );
    expect(screen.getByText(/Arcade Cleared!/i)).toBeInTheDocument();
    expect(screen.getByText(/Arcade • Rhythm Duo \(HARD\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1420/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /More Arcade Games/i })).toBeInTheDocument();
  });
});
