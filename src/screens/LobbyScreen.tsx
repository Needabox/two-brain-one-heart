import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Lock,
  LogOut,
  Map,
  Play,
  Settings,
  Star,
} from 'lucide-react';
import { AssetImage } from '../components/AssetImage';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { ConnectionPill } from '../components/ConnectionPill';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { getLevelMeta } from '../game-engine/puzzles';
import {
  COSMETIC_CATALOG,
  getTotalStars,
  isCosmeticUnlocked,
  type ProgressionState,
} from '../game-engine/scoring';
import type { CharacterId, CosmeticId, LevelId } from '../game-engine/types';
import type { PlayerProfilePayload } from '../multiplayer/protocol';
import type { SignalingModeInfo } from '../multiplayer/signaling/SignalingProvider';
import type { TransportStatus } from '../multiplayer/webrtc/WebRTCTransport';

interface LobbyScreenProps {
  roomCode: string;
  role: 'host' | 'guest';
  localPlayer: PlayerProfilePayload;
  remotePlayer: PlayerProfilePayload | null;
  ready: boolean;
  selectedLevelId: LevelId;
  progression: ProgressionState;
  transportStatus: TransportStatus;
  transportDetail: string | null;
  signalingInfo: SignalingModeInfo | null;
  roomError: string | null;
  noticeBanner: string | null;
  onToggleReady: () => void;
  onSelectCharacter: (c: CharacterId) => void;
  onSelectCosmetic: (c: CosmeticId) => void;
  onOpenWorldSelect: () => void;
  onStartLevel: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export function LobbyScreen({
  roomCode,
  role,
  localPlayer,
  remotePlayer,
  ready,
  selectedLevelId,
  progression,
  transportStatus,
  transportDetail,
  signalingInfo,
  roomError,
  noticeBanner,
  onToggleReady,
  onSelectCharacter,
  onSelectCosmetic,
  onOpenWorldSelect,
  onStartLevel,
  onOpenSettings,
  onLeaveRoom,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const levelMeta = getLevelMeta(selectedLevelId);
  const totalStars = getTotalStars(progression.levelStars);

  const canStart =
    role === 'host' &&
    transportStatus === 'connected' &&
    Boolean(remotePlayer?.connected) &&
    ready &&
    Boolean(remotePlayer?.ready);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-1">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copyCode()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-[3px] border-[#9B8CFF] bg-[#FFFDF9] px-4 py-1.5 text-sm font-extrabold text-[#4A355A] shadow-xs"
            title="Copy room code"
          >
            <span>Room: {roomCode}</span>
            {copied ? (
              <Check className="h-4 w-4 text-[#1A6347]" />
            ) : (
              <Copy className="h-4 w-4 text-[#6D5880]" />
            )}
          </button>
          <ConnectionPill status={transportStatus} signalingInfo={signalingInfo} />
        </div>

        <div className="flex items-center gap-2">
          <CuteButton
            variant="cream"
            size="sm"
            onClick={onOpenSettings}
            aria-label="Settings and How to Play"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </CuteButton>
          <CuteButton variant="cream" size="sm" onClick={onLeaveRoom}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Leave
          </CuteButton>
        </div>
      </div>

      {noticeBanner && (
        <PastelCard tone="mint" className="!py-3 text-center text-sm font-bold text-[#1A6347]">
          {noticeBanner}
        </PastelCard>
      )}

      {transportDetail && transportStatus !== 'connected' && (
        <PastelCard tone="cream" className="!py-2.5 text-center text-xs font-bold text-[#6D5880]">
          {transportDetail}
        </PastelCard>
      )}

      {roomError && (
        <PastelCard tone="pink" className="!py-3 text-center text-sm font-bold text-[#9A214B]">
          {roomError}
        </PastelCard>
      )}

      {/* Two Player Slots */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Local Player Card */}
        <PastelCard tone="pink" className="flex flex-col items-center gap-3 text-center">
          <div className="flex w-full items-center justify-between text-xs font-extrabold">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[#4A355A]">
              You • {role === 'host' ? 'Player A (Host)' : 'Player B (Partner)'}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                ready
                  ? 'bg-[#DCF9ED] text-[#1A6347]'
                  : 'bg-[#FFF2C4] text-[#7D5200]'
              }`}
            >
              {ready ? 'Ready ✓' : 'Not Ready'}
            </span>
          </div>

          <CharacterAvatar
            character={localPlayer.character}
            cosmetic={localPlayer.cosmetic}
            mood={ready ? 'happy' : 'idle'}
            size="md"
          />

          <div>
            <p className="font-display text-lg font-bold text-[#4A355A]">
              {localPlayer.name}
            </p>
            <div className="mt-1 flex justify-center gap-1.5">
              {(['boy', 'girl'] as CharacterId[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSelectCharacter(c)}
                  className={`min-h-[44px] rounded-full border-2 px-4 text-xs font-bold ${
                    localPlayer.character === c
                      ? 'border-[#4A355A] bg-[#FFFDF9] text-[#4A355A]'
                      : 'border-transparent bg-white/50 text-[#6D5880]'
                  }`}
                >
                  {c === 'boy' ? 'Boy' : 'Girl'}
                </button>
              ))}
            </div>
          </div>

          {/* Cosmetics */}
          <div className="w-full space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6D5880]">
              Cosmetic ({totalStars}★ earned)
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {COSMETIC_CATALOG.map((item) => {
                const unlocked = isCosmeticUnlocked(item.id, progression.levelStars);
                const active = localPlayer.cosmetic === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onSelectCosmetic(item.id)}
                    title={
                      unlocked
                        ? item.label
                        : `Unlock at ${item.requiredStars} total stars`
                    }
                    className={`min-h-[44px] rounded-full border-2 px-3 text-[11px] font-bold ${
                      active
                        ? 'border-[#4A355A] bg-[#FFF2C4] text-[#4A355A]'
                        : unlocked
                          ? 'border-[#4A355A]/15 bg-[#FFFDF9] text-[#4A355A]'
                          : 'border-[#4A355A]/10 bg-white/40 text-[#9B8AA9] opacity-65'
                    }`}
                  >
                    {!unlocked && <Lock className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <CuteButton
            variant={ready ? 'mint' : 'pink'}
            size="md"
            fullWidth
            onClick={onToggleReady}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {ready ? 'Ready! (Tap to Unready)' : 'Tap When Ready'}
          </CuteButton>
        </PastelCard>

        {/* Remote Partner Card */}
        <PastelCard tone="sky" className="flex flex-col items-center justify-between gap-3 text-center">
          <div className="flex w-full items-center justify-between text-xs font-extrabold">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[#4A355A]">
              Partner • {role === 'host' ? 'Player B' : 'Player A (Host)'}
            </span>
            {remotePlayer ? (
              <span
                className={`rounded-full px-2.5 py-1 ${
                  remotePlayer.ready
                    ? 'bg-[#DCF9ED] text-[#1A6347]'
                    : 'bg-[#FFF2C4] text-[#7D5200]'
                }`}
              >
                {remotePlayer.ready ? 'Ready ✓' : 'Choosing…'}
              </span>
            ) : (
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-[#6D5880]">
                Waiting…
              </span>
            )}
          </div>

          {remotePlayer ? (
            <>
              <CharacterAvatar
                character={remotePlayer.character}
                cosmetic={remotePlayer.cosmetic}
                mood={remotePlayer.ready ? 'happy' : 'idle'}
                size="md"
              />
              <div>
                <p className="font-display text-lg font-bold text-[#4A355A]">
                  {remotePlayer.name}
                </p>
                <p className="text-xs font-bold text-[#2B5D8A]">
                  {remotePlayer.connected ? 'Connected live' : 'Reconnecting…'}
                </p>
              </div>
              <div className="w-full rounded-2xl bg-[#FFFDF9]/80 px-3 py-2.5 text-xs font-semibold text-[#4A355A]">
                {remotePlayer.ready
                  ? 'Your partner is ready to play!'
                  : 'Waiting for your partner to tap Ready.'}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-dashed border-[#4A355A]/25 bg-white/60 text-2xl text-[#6D5880]">
                ?
              </div>
              <p className="text-sm font-bold text-[#4A355A]">
                Share code <span className="font-display tracking-wider">{roomCode}</span>
              </p>
              <p className="text-xs text-[#6D5880]">
                Waiting for partner to connect…
              </p>
            </div>
          )}
        </PastelCard>
      </div>

      {/* Selected Level + Launch Controls */}
      <PastelCard tone="lavender" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AssetImage
              src={levelMeta.iconAsset}
              alt={levelMeta.name}
              className="h-14 w-14 shrink-0 rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFDF9] p-1 object-contain"
            />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                World 1: The Cozy Room • Level {levelMeta.id}
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                {levelMeta.name}
              </h2>
              <p className="text-xs font-semibold text-[#6D5880]">
                {levelMeta.difficulty} • Best: {progression.levelStars[levelMeta.id]} / 3{' '}
                <Star className="inline h-3.5 w-3.5 fill-[#FFC94D] text-[#4A355A]" />
              </p>
            </div>
          </div>

          <CuteButton variant="cream" size="sm" onClick={onOpenWorldSelect}>
            <Map className="h-4 w-4" aria-hidden="true" />
            All 5 Levels
          </CuteButton>
        </div>

        {role === 'host' ? (
          <div className="space-y-2">
            <CuteButton
              variant="pink"
              size="lg"
              fullWidth
              disabled={!canStart}
              onClick={onStartLevel}
            >
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
              Start Level {levelMeta.id}: {levelMeta.name}
            </CuteButton>
            {!canStart && (
              <p className="text-center text-xs font-bold text-[#6D5880]">
                {!remotePlayer?.connected
                  ? 'Partner must connect before starting.'
                  : !ready || !remotePlayer?.ready
                    ? 'Both players must tap Ready to start.'
                    : 'Ready!'}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#FFFDF9]/85 px-4 py-3 text-center text-sm font-bold text-[#6D5880]">
            {ready
              ? 'Ready! Waiting for Host to start the selected level…'
              : 'Tap "Tap When Ready" above so Host can start!'}
          </div>
        )}
      </PastelCard>
    </div>
  );
}
