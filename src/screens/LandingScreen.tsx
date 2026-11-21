import { HelpCircle, Play, Sparkles, Star, Users } from 'lucide-react';
import { AssetImage } from '../components/AssetImage';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { getPlayerLevelFromXp, getTotalStars, type ProgressionState } from '../game-engine/scoring';

interface LandingScreenProps {
  progression: ProgressionState;
  noticeBanner: string | null;
  onDismissNotice: () => void;
  onGoCreate: () => void;
  onGoJoin: () => void;
  onOpenWorldPreview: () => void;
  onOpenArcadePreview: () => void;
  onOpenSettings: () => void;
}

export function LandingScreen({
  progression,
  noticeBanner,
  onDismissNotice,
  onGoCreate,
  onGoJoin,
  onOpenWorldPreview,
  onOpenArcadePreview,
  onOpenSettings,
}: LandingScreenProps) {
  const totalStars = getTotalStars(progression.levelStars);
  const duoLevel = getPlayerLevelFromXp(progression.xp);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 py-2">
      {noticeBanner && (
        <PastelCard tone="pink" className="flex w-full items-center justify-between gap-3 !py-3">
          <span className="text-sm font-bold text-[#4A355A]">{noticeBanner}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            className="min-h-[44px] rounded-full px-3.5 text-xs font-extrabold text-[#6D5880] hover:bg-white/60"
          >
            Dismiss
          </button>
        </PastelCard>
      )}

      {/* Title & Hero Emblem */}
      <div className="relative flex w-full flex-col items-center text-center">
        <div className="tboh-float mb-2 flex items-center justify-center gap-2">
          <AssetImage
            src="/assets/icons/logo-heart-emblem.svg"
            alt="Two Brains One Heart emblem"
            className="h-16 w-16 object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="font-display tboh-title-stroke text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
          <span className="block text-[#9AD5FF]">Two Brains,</span>
          <span className="block text-[#FF9AB8]">One Heart</span>
        </h1>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-[#4A355A]/15 bg-[#FFFDF9]/90 px-4 py-1 text-sm font-bold text-[#6D5880] shadow-xs">
          <Sparkles className="h-4 w-4 text-[#F5A524]" aria-hidden="true" />
          Two minds. Different clues. One mission.
        </p>
      </div>

      {/* Cozy Room Hero Card with Canonical Duo */}
      <PastelCard tone="cream" className="relative w-full overflow-hidden !p-0">
        <div className="relative h-44 w-full overflow-hidden border-b-[3px] border-[#4A355A]/12 bg-[#FFF5EC]">
          <AssetImage
            src="/assets/backgrounds/cozy-room-backdrop.svg"
            alt="World 1 The Cozy Room"
            className="h-full w-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF9]/90 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-1 flex items-end justify-center gap-6 px-4">
            <CharacterAvatar character="boy" cosmetic={progression.selectedCosmetic} size="md" />
            <CharacterAvatar character="girl" size="md" />
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F7F3FF] px-3.5 py-2.5 text-xs font-bold text-[#4A355A]">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-[#FFC94D] text-[#4A355A]" aria-hidden="true" />
              {totalStars} / 15 Stars
            </span>
            <span>Duo Lv. {duoLevel} ({progression.xp} XP)</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenWorldPreview}
                className="min-h-[44px] rounded-full px-2.5 underline decoration-[#9B8CFF] decoration-2 underline-offset-2 hover:text-[#6D5880]"
              >
                Campaign (5)
              </button>
              <button
                type="button"
                onClick={onOpenArcadePreview}
                className="min-h-[44px] rounded-full px-2.5 underline decoration-[#FF6B93] decoration-2 underline-offset-2 hover:text-[#6D5880]"
              >
                Arcade (8)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <CuteButton variant="pink" size="lg" fullWidth onClick={onGoCreate}>
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
              Play • Create Room
            </CuteButton>
            <CuteButton variant="sky" size="lg" fullWidth onClick={onGoJoin}>
              <Users className="h-5 w-5" aria-hidden="true" />
              Join Partner&apos;s Room
            </CuteButton>
            <CuteButton variant="cream" size="md" fullWidth onClick={onOpenSettings}>
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              How to Play &amp; Settings
            </CuteButton>
          </div>
        </div>
      </PastelCard>
    </div>
  );
}
