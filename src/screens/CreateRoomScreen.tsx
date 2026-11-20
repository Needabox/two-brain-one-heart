import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Laptop,
  Link2,
  Loader2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { ConnectionPill } from '../components/ConnectionPill';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import type { CharacterId, CosmeticId } from '../game-engine/types';
import type { StaticConnectionPreference } from '../multiplayer/signaling/createSignalingProvider';
import type { SignalingModeInfo } from '../multiplayer/signaling/SignalingProvider';
import type { TransportStatus } from '../multiplayer/webrtc/WebRTCTransport';

interface CreateRoomScreenProps {
  initialName: string;
  preferredCharacter: CharacterId;
  selectedCosmetic: CosmeticId;
  roomCode: string | null;
  manualInviteCode: string | null;
  localRelayAvailable: boolean;
  staticPreference: StaticConnectionPreference;
  roomBusy: boolean;
  roomError: string | null;
  transportStatus: TransportStatus;
  transportDetail: string | null;
  signalingInfo: SignalingModeInfo | null;
  onChangeStaticPreference: (mode: StaticConnectionPreference) => void;
  onSelectCharacter: (char: CharacterId) => void;
  onCreateRoom: (name: string) => Promise<void>;
  onAcceptManualReply: (replyCode: string) => Promise<void>;
  onEnterLobby: () => void;
  onBack: () => void;
}

export function CreateRoomScreen({
  initialName,
  preferredCharacter,
  selectedCosmetic,
  roomCode,
  manualInviteCode,
  localRelayAvailable,
  staticPreference,
  roomBusy,
  roomError,
  transportStatus,
  transportDetail,
  signalingInfo,
  onChangeStaticPreference,
  onSelectCharacter,
  onCreateRoom,
  onAcceptManualReply,
  onEnterLobby,
  onBack,
}: CreateRoomScreenProps) {
  const [name, setName] = useState(initialName);
  const [copied, setCopied] = useState(false);
  const [replyInput, setReplyInput] = useState('');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleShare = async (text: string) => {
    if (typeof navigator.share !== 'function') return;
    try {
      await navigator.share({
        title: 'Two Brains, One Heart',
        text,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <CuteButton variant="cream" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </CuteButton>
        {roomCode && (
          <ConnectionPill status={transportStatus} signalingInfo={signalingInfo} />
        )}
      </div>

      <PastelCard tone="cream" className="space-y-5">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[#4A355A]">
            {roomCode ? 'Your Cozy Room is Ready!' : 'Host a Private Room'}
          </h1>
          <p className="mt-1 text-sm text-[#6D5880]">
            {manualInviteCode
              ? 'Zero-server P2P: send the Invite Code to your partner, then paste their Reply Code below.'
              : roomCode
                ? 'Share this room code with your partner while on a call or nearby.'
                : 'Pick your nickname and character, then start a room.'}
          </p>
        </div>

        {!roomCode ? (
          <>
            {!localRelayAvailable && (
              <div className="space-y-1.5">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                  Connection Mode (Pure Frontend)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeStaticPreference('manual-p2p')}
                    className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 text-xs font-extrabold transition-all ${
                      staticPreference === 'manual-p2p'
                        ? 'border-[#4A355A] bg-[#DFF3FF] text-[#1D5587]'
                        : 'border-[#4A355A]/15 bg-[#F7F3FF] text-[#6D5880]'
                    }`}
                  >
                    <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>2 Devices (Direct P2P)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeStaticPreference('broadcast-channel')}
                    className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 text-xs font-extrabold transition-all ${
                      staticPreference === 'broadcast-channel'
                        ? 'border-[#4A355A] bg-[#EDE5FF] text-[#4A355A]'
                        : 'border-[#4A355A]/15 bg-[#F7F3FF] text-[#6D5880]'
                    }`}
                  >
                    <Laptop className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>1 Browser (2 Tabs)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="host-name-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]"
              >
                Your Nickname (Optional)
              </label>
              <input
                id="host-name-input"
                type="text"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Player A"
                className="min-h-[48px] w-full rounded-2xl border-[3px] border-[#4A355A]/20 bg-[#FFFDF9] px-4 text-base font-bold text-[#4A355A] placeholder:text-[#B4A3C7]"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                Choose Your Character
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(['boy', 'girl'] as CharacterId[]).map((charId) => {
                  const active = preferredCharacter === charId;
                  return (
                    <button
                      key={charId}
                      type="button"
                      onClick={() => onSelectCharacter(charId)}
                      className={`flex min-h-[124px] flex-col items-center justify-center gap-1 rounded-3xl border-[3px] p-3 transition-all ${
                        active
                          ? 'border-[#4A355A] bg-[#FFE3EC] shadow-[0_4px_0_rgba(74,53,90,0.18)]'
                          : 'border-[#4A355A]/15 bg-[#F7F3FF]'
                      }`}
                    >
                      <CharacterAvatar
                        character={charId}
                        cosmetic={selectedCosmetic}
                        size="sm"
                      />
                      <span className="text-xs font-extrabold text-[#4A355A]">
                        {charId === 'boy' ? 'Character A' : 'Character B'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {roomError && (
              <div
                role="alert"
                className="rounded-2xl border-2 border-[#F0527F] bg-[#FFE3EC] px-4 py-3 text-sm font-bold text-[#9A214B]"
              >
                {roomError}
              </div>
            )}

            <CuteButton
              variant="pink"
              size="lg"
              fullWidth
              disabled={roomBusy}
              onClick={() => void onCreateRoom(name)}
            >
              {roomBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Creating Room…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  {!localRelayAvailable && staticPreference === 'manual-p2p'
                    ? 'Generate P2P Invite Code'
                    : 'Generate Room Code'}
                </>
              )}
            </CuteButton>
          </>
        ) : manualInviteCode ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-3xl border-[3px] border-[#9B8CFF]/50 bg-[#F7F3FF] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                  Step 1 • Send Invite Code ({roomCode})
                </span>
              </div>
              <textarea
                readOnly
                aria-label="Generated P2P invite code"
                value={manualInviteCode}
                rows={3}
                onClick={(e) => e.currentTarget.select()}
                className="w-full resize-none rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFDF9] p-2.5 font-mono text-xs text-[#4A355A]"
              />
              {transportDetail && transportDetail.startsWith('Warning:') && (
                <div className="rounded-2xl border-2 border-[#FFC94D] bg-[#FFF2C4] px-3 py-2 text-xs font-bold text-[#7D5200]">
                  {transportDetail}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <CuteButton
                  variant="sky"
                  size="sm"
                  className="flex-1"
                  onClick={() => void handleCopy(manualInviteCode)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied Invite!' : 'Copy Invite Code'}
                </CuteButton>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <CuteButton
                    variant="lavender"
                    size="sm"
                    onClick={() => void handleShare(manualInviteCode)}
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    Share
                  </CuteButton>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-3xl border-[3px] border-[#76BDFB]/55 bg-[#ECF7FF] p-4">
              <label
                htmlFor="host-reply-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#1D5587]"
              >
                Step 2 • Paste Partner&apos;s Reply Code
              </label>
              <textarea
                id="host-reply-input"
                rows={3}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Paste TBOH1:... reply code from your partner"
                className="w-full resize-none rounded-2xl border-2 border-[#4A355A]/20 bg-[#FFFDF9] p-2.5 font-mono text-xs text-[#4A355A] placeholder:font-sans placeholder:text-[#9CB6CC]"
              />

              {(roomError || (transportStatus === 'error' && transportDetail)) && (
                <div
                  role="alert"
                  className="rounded-2xl border-2 border-[#F0527F] bg-[#FFE3EC] px-3 py-2 text-xs font-bold text-[#9A214B]"
                >
                  {roomError ?? transportDetail}
                </div>
              )}

              {transportStatus === 'connecting' && transportDetail && !roomError && (
                <div className="rounded-2xl bg-[#FFF2C4]/80 px-3 py-2 text-xs font-bold text-[#7D5200]">
                  {transportDetail}
                </div>
              )}

              <CuteButton
                variant="pink"
                size="md"
                fullWidth
                disabled={roomBusy || !replyInput.trim()}
                onClick={() => void onAcceptManualReply(replyInput)}
              >
                {roomBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Connecting…
                  </>
                ) : (
                  'Connect Partner'
                )}
              </CuteButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border-[3px] border-dashed border-[#9B8CFF] bg-[#F7F3FF] p-5 text-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#6D5880]">
                Private Room Code
              </span>
              <p
                data-testid="room-code-display"
                className="font-display mt-1 text-4xl font-extrabold tracking-[0.18em] text-[#4A355A]"
              >
                {roomCode}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <CuteButton
                variant="sky"
                size="md"
                className="flex-1"
                onClick={() => void handleCopy(roomCode)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </CuteButton>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <CuteButton
                  variant="lavender"
                  size="md"
                  onClick={() =>
                    void handleShare(`Join my cozy co-op puzzle room! Code: ${roomCode}`)
                  }
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share
                </CuteButton>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFF2C4]/70 px-4 py-3 text-sm font-bold text-[#7D5200]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Waiting for your partner to join…
            </div>

            <CuteButton variant="pink" size="md" fullWidth onClick={onEnterLobby}>
              Enter Lobby While Waiting
            </CuteButton>
          </div>
        )}
      </PastelCard>
    </div>
  );
}
