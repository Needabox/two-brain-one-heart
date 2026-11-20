import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyGameAction,
  buildSanitizedSnapshot,
  createEngineState,
  extractPlayerAView,
} from '../../game-engine/engines';
import { getLevelMeta } from '../../game-engine/puzzles';
import {
  applyLevelCompletion,
  calculateStars,
  calculateXpAward,
  getNextUnlockLevel,
  isCosmeticUnlocked,
  reconcileProgressionStates,
  type ProgressionState,
} from '../../game-engine/scoring';
import type {
  CharacterId,
  CosmeticId,
  GameActionInput,
  GameEngineState,
  LevelId,
  LevelOutcome,
  PlayerAView,
  SanitizedSnapshotPayload,
} from '../../game-engine/types';
import {
  clearRoomSessionBackup,
  loadProgressionState,
  loadRoomSessionBackup,
  loadSettings,
  resetProgressionStorage,
  saveProgressionState,
  saveRoomSessionBackup,
  saveSettings,
  type AppSettings,
} from '../progression/persistence';
import { playCozySound } from '../settings/sound';
import { createPeerId, generateRoomCode, isValidRoomCodeFormat, normalizeRoomCode } from './roomCode';
import {
  createEventId,
  type MultiplayerEnvelope,
  type PlayerProfilePayload,
} from '../../multiplayer/protocol';
import {
  createSignalingProvider,
  detectLocalDevRelayAvailable,
  type StaticConnectionPreference,
} from '../../multiplayer/signaling/createSignalingProvider';
import type { SignalingModeInfo, SignalingProvider } from '../../multiplayer/signaling/SignalingProvider';
import { decodeManualSignalBundle } from '../../multiplayer/webrtc/manualCodec';
import { WebRTCTransport, type TransportStatus } from '../../multiplayer/webrtc/WebRTCTransport';

export type ScreenId =
  | 'landing'
  | 'create-room'
  | 'join-room'
  | 'lobby'
  | 'world-select'
  | 'minigame'
  | 'result'
  | 'settings';

export function useMultiplayerRoom() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [progression, setProgression] = useState<ProgressionState>(() => loadProgressionState());
  const [screen, setScreen] = useState<ScreenId>('landing');
  const [settingsReturnScreen, setSettingsReturnScreen] = useState<ScreenId>('landing');

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [peerId, setPeerId] = useState<string>(() => createPeerId());
  const [ready, setReady] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<LevelId>(1);
  const [remotePlayer, setRemotePlayer] = useState<PlayerProfilePayload | null>(null);

  const [transportStatus, setTransportStatus] = useState<TransportStatus>('idle');
  const [transportDetail, setTransportDetail] = useState<string | null>(null);
  const [signalingInfo, setSignalingInfo] = useState<SignalingModeInfo | null>(null);
  const [localRelayAvailable, setLocalRelayAvailable] = useState(false);
  const [staticPreference, setStaticPreference] =
    useState<StaticConnectionPreference>('manual-p2p');
  const [manualInviteCode, setManualInviteCode] = useState<string | null>(null);
  const [manualReplyCode, setManualReplyCode] = useState<string | null>(null);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  const [playerAView, setPlayerAView] = useState<PlayerAView | null>(null);
  const [snapshot, setSnapshot] = useState<SanitizedSnapshotPayload | null>(null);
  const [lastOutcome, setLastOutcome] = useState<LevelOutcome | null>(null);

  // Refs for stable event-handler closures
  const signalingRef = useRef<SignalingProvider | null>(null);
  const transportRef = useRef<WebRTCTransport | null>(null);
  const roleRef = useRef<'host' | 'guest' | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const peerIdRef = useRef<string>(peerId);
  const settingsRef = useRef<AppSettings>(settings);
  const progressionRef = useRef<ProgressionState>(progression);
  const readyRef = useRef<boolean>(ready);
  const selectedLevelRef = useRef<LevelId>(selectedLevelId);
  const screenRef = useRef<ScreenId>(screen);
  const hostEngineRef = useRef<GameEngineState | null>(null);
  const stateVersionRef = useRef<number>(0);
  const lastOutcomeRef = useRef<LevelOutcome | null>(null);
  const isRecoveringRef = useRef<boolean>(false);

  useEffect(() => {
    settingsRef.current = settings;
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    progressionRef.current = progression;
    saveProgressionState(progression);
  }, [progression]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    selectedLevelRef.current = selectedLevelId;
  }, [selectedLevelId]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    lastOutcomeRef.current = lastOutcome;
  }, [lastOutcome]);

  const buildLocalProfile = useCallback(
    (overrideReady?: boolean): PlayerProfilePayload => {
      const s = settingsRef.current;
      const p = progressionRef.current;
      const currentRole = roleRef.current ?? 'host';
      const fallbackName = currentRole === 'host' ? 'Player A' : 'Player B';
      return {
        playerId: peerIdRef.current,
        role: currentRole,
        name: s.playerName.trim() || fallbackName,
        character: s.preferredCharacter,
        cosmetic: p.selectedCosmetic,
        ready: overrideReady ?? readyRef.current,
        connected: true,
        progression: p,
      };
    },
    [],
  );

  const persistActiveBackup = useCallback(
    (nextScreen: ScreenId) => {
      if (!roomCodeRef.current || !roleRef.current) return;
      const backupScreen: 'lobby' | 'world-select' | 'playing' | 'result' =
        nextScreen === 'minigame'
          ? 'playing'
          : nextScreen === 'result'
            ? 'result'
            : nextScreen === 'world-select'
              ? 'world-select'
              : 'lobby';

      saveRoomSessionBackup({
        roomCode: roomCodeRef.current,
        peerId: peerIdRef.current,
        role: roleRef.current,
        playerName: settingsRef.current.playerName.trim() || (roleRef.current === 'host' ? 'Player A' : 'Player B'),
        character: settingsRef.current.preferredCharacter,
        cosmetic: progressionRef.current.selectedCosmetic,
        selectedLevelId: selectedLevelRef.current,
        activeScreen: backupScreen,
        stateVersion: stateVersionRef.current,
        hostEngineState: roleRef.current === 'host' ? hostEngineRef.current : null,
        lastOutcome: lastOutcomeRef.current,
        savedAt: Date.now(),
      });
    },
    [],
  );

  useEffect(() => {
    if (
      roomCode &&
      role &&
      (screen === 'lobby' || screen === 'world-select' || screen === 'minigame' || screen === 'result')
    ) {
      persistActiveBackup(screen);
    }
  }, [roomCode, role, screen, selectedLevelId, settings, progression, snapshot, lastOutcome, persistActiveBackup]);

  const teardownTransport = useCallback(async () => {
    transportRef.current?.dispose();
    transportRef.current = null;
    if (signalingRef.current) {
      if (roomCodeRef.current && peerIdRef.current) {
        await signalingRef.current.leaveRoom(roomCodeRef.current, peerIdRef.current).catch(() => undefined);
      }
      signalingRef.current.dispose();
      signalingRef.current = null;
    }
  }, []);

  const handleHostGameAction = useCallback(
    (levelId: LevelId, action: GameActionInput) => {
      const currentEngine = hostEngineRef.current;
      if (!currentEngine || roleRef.current !== 'host') return;
      if (selectedLevelRef.current !== levelId) return;

      const { nextState, completedNow } = applyGameAction(levelId, currentEngine, action, Date.now());
      hostEngineRef.current = nextState;
      stateVersionRef.current += 1;

      const nextAView = extractPlayerAView(levelId, nextState);
      const nextSnapshot = buildSanitizedSnapshot(levelId, nextState, stateVersionRef.current);
      setPlayerAView(nextAView);
      setSnapshot(nextSnapshot);

      transportRef.current?.send('GAME_STATE_SNAPSHOT', nextSnapshot);

      if (nextState.mistakes > currentEngine.mistakes) {
        playCozySound('error', settingsRef.current.soundEnabled);
      } else if (nextState.hintsUsed > currentEngine.hintsUsed) {
        playCozySound('hint', settingsRef.current.soundEnabled);
      }

      if (completedNow) {
        const meta = getLevelMeta(levelId);
        const elapsedMs = Math.max(1000, Date.now() - nextState.startedAt);
        const stars = calculateStars(meta, nextState.mistakes, elapsedMs, nextState.hintsUsed);
        const prevStars = progressionRef.current.levelStars[levelId] ?? 0;
        const xpAwarded = calculateXpAward(meta, prevStars, stars);

        const outcome: LevelOutcome = {
          completionId: createEventId(),
          levelId,
          stars,
          xpAwarded,
          elapsedMs,
          mistakes: nextState.mistakes,
          hintsUsed: nextState.hintsUsed,
          unlockedNextLevel: getNextUnlockLevel(levelId),
        };

        const { nextState: updatedProg } = applyLevelCompletion(progressionRef.current, outcome);
        progressionRef.current = updatedProg;
        setProgression(updatedProg);
        setLastOutcome(outcome);
        lastOutcomeRef.current = outcome;
        setScreen('result');
        playCozySound('win', settingsRef.current.soundEnabled);

        transportRef.current?.send('LEVEL_COMPLETE', {
          outcome,
          progression: updatedProg,
        });
      }
    },
    [],
  );

  const handleIncomingEnvelope = useCallback(
    (envelope: MultiplayerEnvelope) => {
      switch (envelope.type) {
        case 'ROOM_JOIN':
        case 'PLAYER_STATE': {
          const incoming = envelope.payload;
          setRemotePlayer({ ...incoming, connected: true });
          const merged = reconcileProgressionStates(
            progressionRef.current,
            incoming.progression,
          );
          progressionRef.current = merged;
          setProgression(merged);

          if (screenRef.current === 'create-room' || screenRef.current === 'join-room') {
            setScreen('lobby');
          }

          if (envelope.type === 'ROOM_JOIN' && roleRef.current === 'host') {
            if (hostEngineRef.current && (screenRef.current === 'minigame' || screenRef.current === 'result')) {
              stateVersionRef.current += 1;
              const activeSnapshot = buildSanitizedSnapshot(
                selectedLevelRef.current,
                hostEngineRef.current,
                stateVersionRef.current,
              );
              setSnapshot(activeSnapshot);
              transportRef.current?.send('RECONNECT_ACCEPTED', {
                hostPlayer: buildLocalProfile(),
                selectedLevelId: selectedLevelRef.current,
                reconciledProgression: merged,
                activeSnapshot,
                lastOutcome: lastOutcomeRef.current,
              });
            } else {
              transportRef.current?.send('PLAYER_STATE', buildLocalProfile());
            }
          }
          break;
        }

        case 'PLAYER_READY': {
          setRemotePlayer((prev) =>
            prev ? { ...prev, ready: envelope.payload.ready, connected: true } : prev,
          );
          break;
        }

        case 'ROOM_LEAVE': {
          setRemotePlayer((prev) => (prev ? { ...prev, connected: false, ready: false } : null));
          setNoticeBanner('Your partner left the cozy room.');
          if (screenRef.current === 'minigame') {
            setScreen('lobby');
          }
          break;
        }

        case 'GAME_START': {
          if (roleRef.current === 'guest') {
            const { levelId, snapshot: incomingSnap } = envelope.payload;
            selectedLevelRef.current = levelId;
            setSelectedLevelId(levelId);
            stateVersionRef.current = incomingSnap.summary.stateVersion;
            setSnapshot(incomingSnap);
            setLastOutcome(null);
            setNoticeBanner(null);
            setScreen('minigame');
            playCozySound('success', settingsRef.current.soundEnabled);
          }
          break;
        }

        case 'GAME_ACTION': {
          if (roleRef.current === 'host') {
            handleHostGameAction(envelope.payload.levelId, envelope.payload.action);
          }
          break;
        }

        case 'GAME_STATE_SNAPSHOT': {
          if (roleRef.current === 'guest') {
            const incoming = envelope.payload;
            if (incoming.summary.stateVersion <= stateVersionRef.current) {
              return; // Ignore stale or out-of-order snapshot
            }
            stateVersionRef.current = incoming.summary.stateVersion;
            setSnapshot(incoming);
          }
          break;
        }

        case 'LEVEL_COMPLETE': {
          if (roleRef.current === 'guest') {
            const { outcome, progression: hostProg } = envelope.payload;
            const { nextState: appliedLocal } = applyLevelCompletion(progressionRef.current, outcome);
            const merged = reconcileProgressionStates(appliedLocal, hostProg);
            progressionRef.current = merged;
            setProgression(merged);
            setLastOutcome(outcome);
            lastOutcomeRef.current = outcome;
            setScreen('result');
            playCozySound('win', settingsRef.current.soundEnabled);
          }
          break;
        }

        case 'LEVEL_FAILED': {
          if (roleRef.current === 'guest') {
            setNoticeBanner(envelope.payload.reason);
            setReady(false);
            setScreen('lobby');
          }
          break;
        }

        case 'LEVEL_RESTART': {
          if (roleRef.current === 'guest') {
            const { levelId, snapshot: nextSnap } = envelope.payload;
            selectedLevelRef.current = levelId;
            setSelectedLevelId(levelId);
            stateVersionRef.current = nextSnap.summary.stateVersion;
            setSnapshot(nextSnap);
            setLastOutcome(null);
            setScreen('minigame');
          }
          break;
        }

        case 'RECONNECT_REQUEST': {
          if (roleRef.current === 'host') {
            const { player } = envelope.payload;
            const merged = reconcileProgressionStates(
              progressionRef.current,
              player.progression,
            );
            progressionRef.current = merged;
            setProgression(merged);
            setRemotePlayer({ ...player, connected: true });

            let activeSnapshot: SanitizedSnapshotPayload | null = null;
            if (hostEngineRef.current && screenRef.current === 'minigame') {
              stateVersionRef.current += 1;
              activeSnapshot = buildSanitizedSnapshot(
                selectedLevelRef.current,
                hostEngineRef.current,
                stateVersionRef.current,
              );
              setSnapshot(activeSnapshot);
            }

            transportRef.current?.send('RECONNECT_ACCEPTED', {
              hostPlayer: buildLocalProfile(),
              selectedLevelId: selectedLevelRef.current,
              reconciledProgression: merged,
              activeSnapshot,
              lastOutcome: screenRef.current === 'result' ? lastOutcomeRef.current : null,
            });
            setNoticeBanner('Partner reconnected!');
          }
          break;
        }

        case 'RECONNECT_ACCEPTED': {
          if (roleRef.current === 'guest') {
            const {
              hostPlayer,
              selectedLevelId: hostLevelId,
              reconciledProgression,
              activeSnapshot,
              lastOutcome: hostOutcome,
            } = envelope.payload;
            setRemotePlayer({ ...hostPlayer, connected: true });
            const merged = reconcileProgressionStates(
              progressionRef.current,
              reconciledProgression,
            );
            progressionRef.current = merged;
            setProgression(merged);
            selectedLevelRef.current = hostLevelId;
            setSelectedLevelId(hostLevelId);

            if (activeSnapshot) {
              stateVersionRef.current = activeSnapshot.summary.stateVersion;
              setSnapshot(activeSnapshot);
              setLastOutcome(null);
              setScreen('minigame');
            } else if (hostOutcome) {
              setLastOutcome(hostOutcome);
              setScreen('result');
            } else {
              setScreen('lobby');
            }
            setNoticeBanner('Reconnected to your partner!');
          }
          break;
        }
      }
    },
    [buildLocalProfile, handleHostGameAction],
  );

  const attachTransport = useCallback(
    async (
      code: string,
      nextRole: 'host' | 'guest',
      nextPeerId: string,
      options?: {
        isRecovery?: boolean;
        restoredLevelId?: LevelId;
        restoredEngine?: GameEngineState | null;
        restoredOutcome?: LevelOutcome | null;
        restoredStateVersion?: number;
        targetScreen?: ScreenId;
        manualInviteInput?: string;
        staticModeOverride?: StaticConnectionPreference;
      },
    ) => {
      await teardownTransport();
      const signaling = await createSignalingProvider(
        options?.staticModeOverride ?? staticPreference,
      );
      signalingRef.current = signaling;
      const modeInfo = signaling.getModeInfo();
      setSignalingInfo(modeInfo);

      roleRef.current = nextRole;
      roomCodeRef.current = code;
      peerIdRef.current = nextPeerId;
      setRole(nextRole);
      setRoomCode(code);
      setPeerId(nextPeerId);
      setRoomError(null);
      setNoticeBanner(null);

      if (options?.restoredLevelId) {
        selectedLevelRef.current = options.restoredLevelId;
        setSelectedLevelId(options.restoredLevelId);
      }
      if (options?.restoredStateVersion !== undefined) {
        stateVersionRef.current = options.restoredStateVersion;
      }
      if (options?.restoredEngine && nextRole === 'host') {
        hostEngineRef.current = options.restoredEngine;
        setPlayerAView(
          extractPlayerAView(
            options.restoredLevelId ?? selectedLevelRef.current,
            options.restoredEngine,
          ),
        );
        setSnapshot(
          buildSanitizedSnapshot(
            options.restoredLevelId ?? selectedLevelRef.current,
            options.restoredEngine,
            stateVersionRef.current,
          ),
        );
      }
      if (options?.restoredOutcome) {
        setLastOutcome(options.restoredOutcome);
        lastOutcomeRef.current = options.restoredOutcome;
      }

      const transport = new WebRTCTransport({
        roomCode: code,
        selfPeerId: nextPeerId,
        role: nextRole,
        signaling,
        onStatusChange: (status, detail) => {
          setTransportStatus(status);
          setTransportDetail(detail ?? null);
          if (status === 'connected') {
            setRemotePlayer((prev) => (prev ? { ...prev, connected: true } : prev));
            if (screenRef.current === 'create-room' || screenRef.current === 'join-room') {
              setScreen('lobby');
            }
            if (nextRole === 'guest' && (options?.isRecovery || isRecoveringRef.current)) {
              transport.send('RECONNECT_REQUEST', {
                player: buildLocalProfile(),
                lastKnownStateVersion: stateVersionRef.current,
              });
              isRecoveringRef.current = false;
            } else {
              transport.send('ROOM_JOIN', buildLocalProfile());
            }
          } else if (status === 'reconnecting' || status === 'disconnected') {
            setRemotePlayer((prev) => (prev ? { ...prev, connected: false } : prev));
          }
        },
        onEnvelope: handleIncomingEnvelope,
      });

      transportRef.current = transport;
      transport.startWaiting();

      const meta = {
        name: settingsRef.current.playerName || (nextRole === 'host' ? 'Player A' : 'Player B'),
        character: settingsRef.current.preferredCharacter,
      };

      if (modeInfo.mode === 'manual-p2p') {
        if (nextRole === 'host') {
          const inviteCode = await transport.createManualOfferCode();
          setManualInviteCode(inviteCode);
          setManualReplyCode(null);
        } else if (options?.manualInviteInput) {
          const { replyCode } = await transport.acceptManualInviteAndCreateReply(
            options.manualInviteInput,
          );
          setManualReplyCode(replyCode);
          setManualInviteCode(null);
        }
      } else if (nextRole === 'host') {
        await signaling.createRoom(code, nextPeerId, meta);
      } else {
        const joinRes = await signaling.joinRoom(code, nextPeerId, meta);
        transport.initiateConnection(joinRes.hostId);
      }

      setScreen(options?.targetScreen ?? 'lobby');
    },
    [buildLocalProfile, handleIncomingEnvelope, staticPreference, teardownTransport],
  );

  // Detect dev relay availability & attempt recovery if user refreshed mid-session
  useEffect(() => {
    void detectLocalDevRelayAvailable().then((avail) => {
      setLocalRelayAvailable(avail);
    });

    const backup = loadRoomSessionBackup();
    if (!backup) return;

    // Direct P2P manual sessions cannot survive a full page refresh without a signaling server
    void (async () => {
      const relayOk = await detectLocalDevRelayAvailable();
      if (!relayOk && staticPreference === 'manual-p2p') {
        clearRoomSessionBackup();
        setNoticeBanner('Previous P2P session closed on refresh. Create or join a new invite to play (your stars & XP are saved!).');
        return;
      }

      isRecoveringRef.current = true;
      const restoredScreen: ScreenId =
        backup.activeScreen === 'playing'
          ? 'minigame'
          : backup.activeScreen === 'result'
            ? 'result'
            : backup.activeScreen === 'world-select'
              ? 'world-select'
              : 'lobby';

      void attachTransport(backup.roomCode, backup.role, backup.peerId, {
        isRecovery: true,
        restoredLevelId: backup.selectedLevelId,
        restoredEngine: backup.hostEngineState,
        restoredOutcome: backup.lastOutcome,
        restoredStateVersion: backup.stateVersion,
        targetScreen: backup.role === 'host' ? restoredScreen : 'lobby',
      }).catch(() => {
        clearRoomSessionBackup();
        isRecoveringRef.current = false;
        setNoticeBanner('Previous room session expired. Create or join a room to play!');
        setScreen('landing');
      });
    })();

    return () => {
      void teardownTransport();
    };
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoom = useCallback(
    async (customName?: string) => {
      if (customName !== undefined) {
        setSettings((prev) => ({ ...prev, playerName: customName.trim().slice(0, 20) }));
      }
      setRoomBusy(true);
      setRoomError(null);
      setManualInviteCode(null);
      setManualReplyCode(null);
      try {
        const code = generateRoomCode(6);
        const newPeerId = createPeerId();
        setReady(false);
        setRemotePlayer(null);
        hostEngineRef.current = null;
        stateVersionRef.current = 0;
        setSnapshot(null);
        setPlayerAView(null);
        setLastOutcome(null);
        await attachTransport(code, 'host', newPeerId, { targetScreen: 'create-room' });
        playCozySound('success', settingsRef.current.soundEnabled);
      } catch (err) {
        setRoomError(err instanceof Error ? err.message : 'Unable to create room.');
      } finally {
        setRoomBusy(false);
      }
    },
    [attachTransport],
  );

  const acceptManualReply = useCallback(async (replyCode: string) => {
    if (!transportRef.current) {
      setRoomError('Create a room invite first.');
      return;
    }
    setRoomBusy(true);
    setRoomError(null);
    try {
      await transportRef.current.acceptManualReplyCode(replyCode);
      playCozySound('success', settingsRef.current.soundEnabled);
    } catch (err) {
      setRoomError(err instanceof Error ? err.message : 'Invalid reply code.');
    } finally {
      setRoomBusy(false);
    }
  }, []);

  const joinRoom = useCallback(
    async (rawInput: string, customName?: string) => {
      const trimmed = rawInput.trim();
      const isManualInvite = trimmed.startsWith('TBOH1:') || trimmed.startsWith('TBOH0:');

      if (customName !== undefined) {
        setSettings((prev) => ({ ...prev, playerName: customName.trim().slice(0, 20) }));
      }

      if (isManualInvite || (!localRelayAvailable && staticPreference === 'manual-p2p')) {
        if (!trimmed) {
          setRoomError('Paste the P2P Invite Code from your partner.');
          return;
        }
        setRoomBusy(true);
        setRoomError(null);
        setManualInviteCode(null);
        setManualReplyCode(null);
        try {
          const decoded = await decodeManualSignalBundle(trimmed);
          const newPeerId = createPeerId();
          setReady(false);
          setRemotePlayer(null);
          hostEngineRef.current = null;
          stateVersionRef.current = 0;
          setSnapshot(null);
          setPlayerAView(null);
          setLastOutcome(null);
          await attachTransport(decoded.r, 'guest', newPeerId, {
            targetScreen: 'join-room',
            manualInviteInput: trimmed,
            staticModeOverride: 'manual-p2p',
          });
          playCozySound('success', settingsRef.current.soundEnabled);
        } catch (err) {
          await teardownTransport();
          setRoomError(err instanceof Error ? err.message : 'Invalid P2P Invite Code.');
        } finally {
          setRoomBusy(false);
        }
        return;
      }

      const normalized = normalizeRoomCode(rawInput);
      if (!isValidRoomCodeFormat(normalized)) {
        setRoomError('Enter a valid 4–8 character room code (for example HRT429).');
        return;
      }
      setRoomBusy(true);
      setRoomError(null);
      setManualInviteCode(null);
      setManualReplyCode(null);
      try {
        const newPeerId = createPeerId();
        setReady(false);
        setRemotePlayer(null);
        hostEngineRef.current = null;
        stateVersionRef.current = 0;
        setSnapshot(null);
        setPlayerAView(null);
        setLastOutcome(null);
        await attachTransport(normalized, 'guest', newPeerId, { targetScreen: 'lobby' });
        playCozySound('success', settingsRef.current.soundEnabled);
      } catch (err) {
        await teardownTransport();
        setRoomError(err instanceof Error ? err.message : 'Could not join that room.');
      } finally {
        setRoomBusy(false);
      }
    },
    [attachTransport, localRelayAvailable, staticPreference, teardownTransport],
  );

  const leaveRoom = useCallback(async () => {
    transportRef.current?.send('ROOM_LEAVE', { reason: 'Player left room' });
    await teardownTransport();
    clearRoomSessionBackup();
    roleRef.current = null;
    roomCodeRef.current = null;
    hostEngineRef.current = null;
    stateVersionRef.current = 0;
    setRoomCode(null);
    setRole(null);
    setReady(false);
    setRemotePlayer(null);
    setManualInviteCode(null);
    setManualReplyCode(null);
    setTransportStatus('idle');
    setTransportDetail(null);
    setPlayerAView(null);
    setSnapshot(null);
    setLastOutcome(null);
    setNoticeBanner(null);
    setScreen('landing');
  }, [teardownTransport]);

  const toggleReady = useCallback(() => {
    const nextReady = !readyRef.current;
    readyRef.current = nextReady;
    setReady(nextReady);
    playCozySound('tap', settingsRef.current.soundEnabled);
    transportRef.current?.send('PLAYER_READY', { ready: nextReady });
    transportRef.current?.send('PLAYER_STATE', buildLocalProfile(nextReady));
  }, [buildLocalProfile]);

  const selectCharacter = useCallback(
    (character: CharacterId) => {
      setSettings((prev) => {
        const next = { ...prev, preferredCharacter: character };
        settingsRef.current = next;
        return next;
      });
      playCozySound('tap', settingsRef.current.soundEnabled);
      if (transportRef.current?.isConnected()) {
        transportRef.current.send('PLAYER_STATE', buildLocalProfile());
      }
    },
    [buildLocalProfile],
  );

  const selectCosmetic = useCallback(
    (cosmetic: CosmeticId) => {
      if (!isCosmeticUnlocked(cosmetic, progressionRef.current.levelStars)) {
        return;
      }
      setProgression((prev) => {
        const next = { ...prev, selectedCosmetic: cosmetic };
        progressionRef.current = next;
        return next;
      });
      playCozySound('tap', settingsRef.current.soundEnabled);
      if (transportRef.current?.isConnected()) {
        transportRef.current.send('PLAYER_STATE', buildLocalProfile());
      }
    },
    [buildLocalProfile],
  );

  const selectLevel = useCallback((levelId: LevelId) => {
    if (levelId > progressionRef.current.unlockedLevelId) return;
    selectedLevelRef.current = levelId;
    setSelectedLevelId(levelId);
    playCozySound('tap', settingsRef.current.soundEnabled);
  }, []);

  const startLevel = useCallback((levelIdOverride?: LevelId) => {
    if (roleRef.current !== 'host') return;
    const targetLevel = levelIdOverride ?? selectedLevelRef.current;
    if (targetLevel > progressionRef.current.unlockedLevelId) return;
    if (!readyRef.current || !remotePlayer?.ready || !remotePlayer?.connected) {
      setRoomError('Both players must be connected and Ready to start!');
      return;
    }

    selectedLevelRef.current = targetLevel;
    setSelectedLevelId(targetLevel);
    setRoomError(null);
    setNoticeBanner(null);

    const engine = createEngineState(targetLevel, Date.now());
    hostEngineRef.current = engine;
    stateVersionRef.current += 1;

    const aView = extractPlayerAView(targetLevel, engine);
    const snap = buildSanitizedSnapshot(targetLevel, engine, stateVersionRef.current);

    setPlayerAView(aView);
    setSnapshot(snap);
    setLastOutcome(null);
    setScreen('minigame');
    playCozySound('success', settingsRef.current.soundEnabled);

    transportRef.current?.send('GAME_START', {
      levelId: targetLevel,
      snapshot: snap,
    });
  }, [remotePlayer]);

  const restartCurrentLevel = useCallback(() => {
    if (roleRef.current !== 'host') return;
    const levelId = selectedLevelRef.current;
    const engine = createEngineState(levelId, Date.now());
    hostEngineRef.current = engine;
    stateVersionRef.current += 1;

    const aView = extractPlayerAView(levelId, engine);
    const snap = buildSanitizedSnapshot(levelId, engine, stateVersionRef.current);

    setPlayerAView(aView);
    setSnapshot(snap);
    setLastOutcome(null);
    setScreen('minigame');
    playCozySound('tap', settingsRef.current.soundEnabled);

    transportRef.current?.send('LEVEL_RESTART', {
      levelId,
      snapshot: snap,
    });
  }, []);

  const sendGameAction = useCallback(
    (action: GameActionInput) => {
      if (roleRef.current === 'host') {
        handleHostGameAction(selectedLevelRef.current, action);
      } else if (roleRef.current === 'guest') {
        transportRef.current?.send('GAME_ACTION', {
          levelId: selectedLevelRef.current,
          action,
        });
      }
    },
    [handleHostGameAction],
  );

  const returnToLobbyFromGame = useCallback(() => {
    hostEngineRef.current = null;
    setPlayerAView(null);
    setSnapshot(null);
    setLastOutcome(null);
    setReady(false);
    readyRef.current = false;

    if (roleRef.current === 'host' && screenRef.current === 'minigame') {
      transportRef.current?.send('LEVEL_FAILED', {
        levelId: selectedLevelRef.current,
        reason: 'Host returned to the lobby.',
      });
    } else {
      transportRef.current?.send('PLAYER_STATE', buildLocalProfile(false));
    }
    setScreen('lobby');
  }, [buildLocalProfile]);

  const openSettings = useCallback((from: ScreenId) => {
    setSettingsReturnScreen(from);
    setScreen('settings');
  }, []);

  const closeSettings = useCallback(() => {
    setScreen(settingsReturnScreen);
  }, [settingsReturnScreen]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = resetProgressionStorage();
    progressionRef.current = fresh;
    setProgression(fresh);
    setSelectedLevelId(1);
    playCozySound('tap', settingsRef.current.soundEnabled);
  }, []);

  return {
    screen,
    setScreen,
    settings,
    updateSettings,
    progression,
    resetProgress,
    roomCode,
    role,
    peerId,
    ready,
    selectedLevelId,
    remotePlayer,
    transportStatus,
    transportDetail,
    signalingInfo,
    localRelayAvailable,
    staticPreference,
    setStaticPreference,
    manualInviteCode,
    manualReplyCode,
    roomBusy,
    roomError,
    setRoomError,
    noticeBanner,
    setNoticeBanner,
    playerAView,
    snapshot,
    lastOutcome,
    createRoom,
    acceptManualReply,
    joinRoom,
    leaveRoom,
    toggleReady,
    selectCharacter,
    selectCosmetic,
    selectLevel,
    startLevel,
    restartCurrentLevel,
    sendGameAction,
    returnToLobbyFromGame,
    openSettings,
    closeSettings,
    buildLocalProfile,
  };
}
