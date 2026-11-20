import { useState, type FormEvent } from 'react';
import { ArrowLeft, Globe, Laptop, Loader2, LogIn } from 'lucide-react';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CuteButton } from '../components/CuteButton';
import { PastelCard } from '../components/PastelCard';
import { normalizeRoomCode } from '../features/room/roomCode';
import type { CharacterId, CosmeticId } from '../game-engine/types';
import type { ConnectionModePreference } from '../multiplayer/signaling/createSignalingProvider';

interface JoinRoomScreenProps {
  initialName: string;
  preferredCharacter: CharacterId;
  selectedCosmetic: CosmeticId;
  localRelayAvailable: boolean;
  connectionPreference: ConnectionModePreference;
  roomBusy: boolean;
  roomError: string | null;
  onChangeConnectionPreference: (mode: ConnectionModePreference) => void;
  onSelectCharacter: (char: CharacterId) => void;
  onJoinRoom: (roomCode: string, name: string) => Promise<void>;
  onBack: () => void;
}

export function JoinRoomScreen({
  initialName,
  preferredCharacter,
  selectedCosmetic,
  localRelayAvailable,
  connectionPreference,
  roomBusy,
  roomError,
  onChangeConnectionPreference,
  onSelectCharacter,
  onJoinRoom,
  onBack,
}: JoinRoomScreenProps) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState('');

  const activeModeLabel =
    connectionPreference === 'auto'
      ? localRelayAvailable
        ? 'local-dev-relay'
        : 'peerjs'
      : connectionPreference;

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    void onJoinRoom(code, name);
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-2">
      <div>
        <CuteButton variant="cream" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </CuteButton>
      </div>

      <PastelCard tone="cream" className="space-y-5">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[#4A355A]">
            Join Partner&apos;s Room
          </h1>
          <p className="mt-1 text-sm text-[#6D5880]">
            Enter the 6-character room code your partner created!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
              Connection Network
            </span>
            <div className="grid grid-cols-2 gap-2">
              {localRelayAvailable ? (
                <button
                  type="button"
                  onClick={() => onChangeConnectionPreference('local-dev-relay')}
                  className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 text-xs font-extrabold transition-all ${
                    activeModeLabel === 'local-dev-relay'
                      ? 'border-[#4A355A] bg-[#EDE5FF] text-[#4A355A]'
                      : 'border-[#4A355A]/15 bg-[#F7F3FF] text-[#6D5880]'
                  }`}
                >
                  <Laptop className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Local Dev Relay</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeConnectionPreference('broadcast-channel')}
                  className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 text-xs font-extrabold transition-all ${
                    activeModeLabel === 'broadcast-channel'
                      ? 'border-[#4A355A] bg-[#EDE5FF] text-[#4A355A]'
                      : 'border-[#4A355A]/15 bg-[#F7F3FF] text-[#6D5880]'
                  }`}
                >
                  <Laptop className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>1 Browser (2 Tabs)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onChangeConnectionPreference('peerjs')}
                className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 text-xs font-extrabold transition-all ${
                  activeModeLabel === 'peerjs'
                    ? 'border-[#4A355A] bg-[#DFF3FF] text-[#1D5587]'
                    : 'border-[#4A355A]/15 bg-[#F7F3FF] text-[#6D5880]'
                }`}
              >
                <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Online 2 Devices (PeerJS)</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="join-code-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#6D5880]"
            >
              Room Code
            </label>
            <input
              id="join-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              placeholder="e.g. HRT429"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={8}
              className="font-display min-h-[54px] w-full rounded-2xl border-[3px] border-[#9B8CFF] bg-[#F7F3FF] px-4 text-center text-2xl font-extrabold tracking-[0.2em] text-[#4A355A] placeholder:text-base placeholder:tracking-normal placeholder:text-[#B4A3C7]"
            />
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
                Connecting to Partner…
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Join Cozy Room
              </>
            )}
          </CuteButton>
        </form>
      </PastelCard>
    </div>
  );
}
