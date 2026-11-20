import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Laptop,
  Link2,
  Loader2,
  LogIn,
  Share2,
} from 'lucide-react';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { ConnectionPill } from '../components/ConnectionPill';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { normalizeRoomCode } from '../features/room/roomCode';
import type { CharacterId, CosmeticId } from '../game-engine/types';
import type { StaticConnectionPreference } from '../multiplayer/signaling/createSignalingProvider';
import type { SignalingModeInfo } from '../multiplayer/signaling/SignalingProvider';
import type { TransportStatus } from '../multiplayer/webrtc/WebRTCTransport';

interface JoinRoomScreenProps {
  initialName: string;
  preferredCharacter: CharacterId;
  selectedCosmetic: CosmeticId;
  localRelayAvailable: boolean;
  staticPreference: StaticConnectionPreference;
  manualReplyCode: string | null;
  transportStatus: TransportStatus;
  transportDetail: string | null;
  signalingInfo: SignalingModeInfo | null;
  roomBusy: boolean;
  roomError: string | null;
  onChangeStaticPreference: (mode: StaticConnectionPreference) => void;
  onSelectCharacter: (char: CharacterId) => void;
  onJoinRoom: (roomCodeOrInvite: string, name: string) => Promise<void>;
  onBack: () => void;
}

export function JoinRoomScreen({
  initialName,
  preferredCharacter,
  selectedCosmetic,
  localRelayAvailable,
  staticPreference,
  manualReplyCode,
  transportStatus,
  transportDetail,
  signalingInfo,
  roomBusy,
  roomError,
  onChangeStaticPreference,
  onSelectCharacter,
  onJoinRoom,
  onBack,
}: JoinRoomScreenProps) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const isManualUi = !localRelayAvailable && staticPreference === 'manual-p2p';

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    void onJoinRoom(code, name);
  };

  const handleCopyReply = async () => {
    if (!manualReplyCode) return;
    try {
      await navigator.clipboard.writeText(manualReplyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleShareReply = async () => {
    if (!manualReplyCode || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({
        title: 'Two Brains, One Heart — Reply Code',
        text: manualReplyCode,
      });
    } catch {
      // Cancelled
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <CuteButton variant="cream" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </CuteButton>
        {manualReplyCode && (
          <ConnectionPill status={transportStatus} signalingInfo={signalingInfo} />
        )}
      </div>

      <PastelCard tone="cream" className="space-y-5">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[#4A355A]">
            {manualReplyCode ? 'Send Reply Code to Host!' : "Join Partner's Room"}
          </h1>
          <p className="mt-1 text-sm text-[#6D5880]">
            {manualReplyCode
              ? 'Send this Reply Code back to Host. You will enter the Lobby automatically as soon as they paste it!'
              : isManualUi
                ? 'Paste the P2P Invite Code from Host to create your Reply Code.'
                : 'Enter the room code your partner created to link up!'}
          </p>
        </div>

        {manualReplyCode ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-3xl border-[3px] border-[#76BDFB]/60 bg-[#ECF7FF] p-4">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-[#1D5587]">
                Your P2P Reply Code
              </span>
              <textarea
                readOnly
                aria-label="Generated P2P reply code"
                value={manualReplyCode}
                rows={3}
                onClick={(e) => e.currentTarget.select()}
                className="w-full resize-none rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFDF9] p-2.5 font-mono text-xs text-[#4A355A]"
              />
              <div className="flex flex-wrap gap-2">
                <CuteButton
                  variant="pink"
                  size="md"
                  className="flex-1"
                  onClick={() => void handleCopyReply()}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied Reply!' : 'Copy Reply Code'}
                </CuteButton>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <CuteButton
                    variant="lavender"
                    size="md"
                    onClick={() => void handleShareReply()}
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    Share
                  </CuteButton>
                )}
              </div>
            </div>

            {transportStatus === 'error' && transportDetail ? (
              <div
                role="alert"
                className="rounded-2xl border-2 border-[#F0527F] bg-[#FFE3EC] px-4 py-3 text-xs font-bold text-[#9A214B]"
              >
                {transportDetail}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFF2C4]/75 px-4 py-3 text-sm font-bold text-[#7D5200]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Waiting for Host to connect your Reply Code…
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                htmlFor="join-code-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]"
              >
                {isManualUi ? 'Host Invite Code' : 'Room Code'}
              </label>
              {isManualUi ? (
                <textarea
                  id="join-code-input"
                  rows={3}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste TBOH1:... invite code from your partner"
                  className="w-full resize-none rounded-2xl border-[3px] border-[#9B8CFF] bg-[#F7F3FF] p-3 font-mono text-xs text-[#4A355A] placeholder:font-sans placeholder:text-sm placeholder:text-[#B4A3C7]"
                />
              ) : (
                <input
                  id="join-code-input"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.trim().startsWith('TBOH')) {
                      setCode(val);
                    } else {
                      setCode(normalizeRoomCode(val));
                    }
                  }}
                  placeholder="e.g. HRT429"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="font-display min-h-[54px] w-full rounded-2xl border-[3px] border-[#9B8CFF] bg-[#F7F3FF] px-4 text-center text-2xl font-extrabold tracking-[0.2em] text-[#4A355A] placeholder:text-base placeholder:tracking-normal placeholder:text-[#B4A3C7]"
                />
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="guest-name-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]"
              >
                Your Nickname (Optional)
              </label>
              <input
                id="guest-name-input"
                type="text"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Player B"
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
                      className={`flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-3xl border-[3px] p-3 transition-all ${
                        active
                          ? 'border-[#4A355A] bg-[#DFF3FF] shadow-[0_4px_0_rgba(74,53,90,0.18)]'
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

            <CuteButton type="submit" variant="sky" size="lg" fullWidth disabled={roomBusy}>
              {roomBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Connecting…
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  {isManualUi ? 'Generate Reply Code' : 'Join Cozy Room'}
                </>
              )}
            </CuteButton>
          </form>
        )}
      </PastelCard>
    </div>
  );
}
