import { PastelCard } from '../../components/PastelCard';
import type {
  GameActionInput,
  MixedChallengePlayerAView,
  MixedChallengePlayerBView,
} from '../../game-engine/types';
import { LostTogetherGame } from '../lost-together/LostTogetherGame';
import { SecretLanguageGame } from '../secret-language/SecretLanguageGame';

interface MixedChallengeGameProps {
  role: 'host' | 'guest';
  playerAView: MixedChallengePlayerAView | null;
  playerBView: MixedChallengePlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

export function MixedChallengeGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: MixedChallengeGameProps) {
  const activeStage =
    role === 'host' ? (playerAView?.stage ?? 1) : (playerBView?.stage ?? 1);

  return (
    <div className="space-y-3">
      <PastelCard tone="mint" className="flex flex-wrap items-center justify-between gap-2 !py-3">
        <span className="font-display text-sm font-bold text-[#1A6347]">
          Finale Stage {activeStage} of 2:{' '}
          {activeStage === 1 ? 'Crack the Whisper Lock' : 'Guide to the Heart Chest'}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2.5 w-7 rounded-full ${
              activeStage >= 1 ? 'bg-[#5CD0A5]' : 'bg-[#4A355A]/15'
            }`}
          />
          <span
            className={`h-2.5 w-7 rounded-full ${
              activeStage === 2 ? 'bg-[#5CD0A5]' : 'bg-[#4A355A]/15'
            }`}
          />
        </div>
      </PastelCard>

      {activeStage === 1 ? (
        <SecretLanguageGame
          role={role}
          playerAView={playerAView?.stage1View ?? null}
          playerBView={playerBView?.stage1View ?? null}
          onAction={onAction}
        />
      ) : (
        <LostTogetherGame
          role={role}
          playerAView={playerAView?.stage2View ?? null}
          playerBView={playerBView?.stage2View ?? null}
          onAction={onAction}
        />
      )}
    </div>
  );
}
