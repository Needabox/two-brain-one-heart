import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyGameAction,
  buildSanitizedSnapshot,
  createEngineState,
  extractPlayerAView,
} from '../../game-engine/engines';
import {
  applyArcadeEngineAction,
  buildArcadeSnapshot,
  createArcadeEngineState,
  extractArcadePlayerAView,
  isArcadeEngineState,
} from '../../game-engine/arcadeEngines';
import { getArcadeGameEntry } from '../../game-engine/registry';
import { getLevelMeta } from '../../game-engine/puzzles';
import {
  applyLevelCompletion,
  calculateArcadeScore,
  calculateStars,
  calculateXpAward,
  getNextUnlockLevel,
  isCosmeticUnlocked,
  reconcileProgressionStates,
  type ProgressionState,
} from '../../game-engine/scoring';
import type {
  ArcadeGameId,
  CharacterId,
  CosmeticId,
  DifficultyLevel,
  GameActionInput,
  GameEngineState,
  LaunchTarget,
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
import type { GameTransport, TransportStatus } from '../../multiplayer/GameTransport';
import { PeerJSTransport } from '../../multiplayer/peerjs/PeerJSTransport';
import {
  createSignalingProvider,
  detectLocalDevRelayAvailable,
  type ConnectionModePreference,
} from '../../multiplayer/signaling/createSignalingProvider';
import type { SignalingModeInfo, SignalingProvider } from '../../multiplayer/signaling/SignalingProvider';
import { WebRTCTransport } from '../../multiplayer/webrtc/WebRTCTransport';

export type ScreenId =
  | 'landing'
  | 'create-room'
  | 'join-room'
  | 'lobby'
  | 'world-select'
  | 'arcade-select'
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
  const [selectedTarget, setSelectedTarget] = useState<LaunchTarget>({
    mode: 'campaign',
    levelId: 1,
  });
  const [remotePlayer, setRemotePlayer] = useState<PlayerProfilePayload | null>(null);

  const [transportStatus, setTransportStatus] = useState<TransportStatus>('idle');
  const [transportDetail, setTransportDetail] = useState<string | null>(null);
  const [signalingInfo, setSignalingInfo] = useState<SignalingModeInfo | null>(null);
  const [localRelayAvailable, setLocalRelayAvailable] = useState(false);
  const [connectionPreference, setConnectionPreference] =
    useState<ConnectionModePreference>('auto');
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  const [playerAView, setPlayerAView] = useState<PlayerAView | null>(null);
  const [snapshot, setSnapshot] = useState<SanitizedSnapshotPayload | null>(null);
  const [lastOutcome, setLastOutcome] = useState<LevelOutcome | null>(null);

  // Refs for stable event-handler closures
  const signalingRef = useRef<SignalingProvider | null>(null);
  const transportRef = useRef<GameTransport | null>(null);
  const roleRef = useRef<'host' | 'guest' | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const peerIdRef = useRef<string>(peerId);
  const settingsRef = useRef<AppSettings>(settings);
  const progressionRef = useRef<ProgressionState>(progression);
  const readyRef = useRef<boolean>(ready);
  const selectedLevelRef = useRef<LevelId>(selectedLevelId);
  const selectedTargetRef = useRef<LaunchTarget>(selectedTarget);
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
    selectedTargetRef.current = selectedTarget;
  }, [selectedTarget]);

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
        selectedTarget: selectedTargetRef.current,
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
    (levelId: LevelId, action: GameActionInput, actorRole: 'host' | 'guest') => {
      const currentEngine = hostEngineRef.current;
      if (!currentEngine || roleRef.current !== 'host') return;
      const target = selectedTargetRef.current;

      if (target.mode === 'arcade') {
        if (!isArcadeEngineState(currentEngine) || currentEngine.kind !== target.gameId) {
          return;
        }
        const { nextState, completedNow } = applyArcadeEngineAction(
          currentEngine,
          action,
          actorRole,
        );
        hostEngineRef.current = nextState;
        stateVersionRef.current += 1;

        const nextAView = extractArcadePlayerAView(nextState);
        const nextSnapshot = buildArcadeSnapshot(
          selectedLevelRef.current,
          target,
          nextState,
          stateVersionRef.current,
        );
        setPlayerAView(nextAView);
        setSnapshot(nextSnapshot);
        transportRef.current?.send('GAME_STATE_SNAPSHOT', nextSnapshot);

        if (nextState.mistakes > currentEngine.mistakes) {
          playCozySound('error', settingsRef.current.soundEnabled);
        } else if (nextState.hintsUsed > currentEngine.hintsUsed) {
          playCozySound('hint', settingsRef.current.soundEnabled);
        }

        if (completedNow) {
          const entry = getArcadeGameEntry(target.gameId);
          const diffThresholds = entry.thresholds[target.difficulty];
          const elapsedMs = Math.max(1000, Date.now() - nextState.startedAt);
          const stars = calculateStars(
            diffThresholds,
            nextState.mistakes,
            elapsedMs,
            nextState.hintsUsed,
          );
          const prevStars =
            progressionRef.current.arcadeRecords[target.gameId]?.bestStars ?? 0;
          const xpAwarded = calculateXpAward(
            { baseXp: entry.baseXp[target.difficulty] },
            prevStars,
            stars,
          );
          const score = calculateArcadeScore(
            stars,
            nextState.mistakes,
            elapsedMs,
            nextState.hintsUsed,
            target.difficulty,
          );

          const outcome: LevelOutcome = {
            completionId: createEventId(),
            levelId: selectedLevelRef.current,
            arcade: {
              gameId: target.gameId,
              difficulty: target.difficulty,
              score,
            },
            stars,
            xpAwarded,
            elapsedMs,
            mistakes: nextState.mistakes,
            hintsUsed: nextState.hintsUsed,
            unlockedNextLevel: null,
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
        return;
      }

      if (selectedLevelRef.current !== levelId || isArcadeEngineState(currentEngine)) return;

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
              const activeSnapshot = isArcadeEngineState(hostEngineRef.current)
                ? buildArcadeSnapshot(
                    selectedLevelRef.current,
                    selectedTargetRef.current,
                    hostEngineRef.current,
                    stateVersionRef.current,
                  )
                : buildSanitizedSnapshot(
                    selectedLevelRef.current,
                    hostEngineRef.current,
                    stateVersionRef.current,
                  );
              setSnapshot(activeSnapshot);
              transportRef.current?.send('RECONNECT_ACCEPTED', {
                hostPlayer: buildLocalProfile(),
                selectedLevelId: selectedLevelRef.current,
                selectedTarget: selectedTargetRef.current,
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
            const { levelId, target, snapshot: incomingSnap } = envelope.payload;
            const resolvedTarget: LaunchTarget =
              target ?? incomingSnap.summary.target ?? { mode: 'campaign', levelId };
            selectedLevelRef.current = levelId;
            setSelectedLevelId(levelId);
            selectedTargetRef.current = resolvedTarget;
            setSelectedTarget(resolvedTarget);
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
            handleHostGameAction(envelope.payload.levelId, envelope.payload.action, 'guest');
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
            const { levelId, target, snapshot: nextSnap } = envelope.payload;
            const resolvedTarget: LaunchTarget =
              target ?? nextSnap.summary.target ?? { mode: 'campaign', levelId };
            selectedLevelRef.current = levelId;
            setSelectedLevelId(levelId);
            selectedTargetRef.current = resolvedTarget;
            setSelectedTarget(resolvedTarget);
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
              activeSnapshot = isArcadeEngineState(hostEngineRef.current)
                ? buildArcadeSnapshot(
                    selectedLevelRef.current,
                    selectedTargetRef.current,
                    hostEngineRef.current,
                    stateVersionRef.current,
                  )
                : buildSanitizedSnapshot(
                    selectedLevelRef.current,
                    hostEngineRef.current,
                    stateVersionRef.current,
                  );
              setSnapshot(activeSnapshot);
            }

            transportRef.current?.send('RECONNECT_ACCEPTED', {
              hostPlayer: buildLocalProfile(),
              selectedLevelId: selectedLevelRef.current,
              selectedTarget: selectedTargetRef.current,
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
              selectedTarget: hostTarget,
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
            const resolvedTarget: LaunchTarget =
              hostTarget ?? activeSnapshot?.summary.target ?? { mode: 'campaign', levelId: hostLevelId };
            selectedTargetRef.current = resolvedTarget;
            setSelectedTarget(resolvedTarget);

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
        restoredTarget?: LaunchTarget;
        restoredEngine?: GameEngineState | null;
        restoredOutcome?: LevelOutcome | null;
        restoredStateVersion?: number;
        targetScreen?: ScreenId;
        preferenceOverride?: ConnectionModePreference;
      },
    ) => {
      await teardownTransport();
      const signaling = await createSignalingProvider(
        options?.preferenceOverride ?? connectionPreference,
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
      if (options?.restoredTarget) {
        selectedTargetRef.current = options.restoredTarget;
        setSelectedTarget(options.restoredTarget);
      }
      if (options?.restoredStateVersion !== undefined) {
        stateVersionRef.current = options.restoredStateVersion;
      }
      if (options?.restoredEngine && nextRole === 'host') {
        hostEngineRef.current = options.restoredEngine;
        if (isArcadeEngineState(options.restoredEngine)) {
          const fallbackTarget: LaunchTarget = options.restoredTarget ?? {
            mode: 'arcade',
            gameId: options.restoredEngine.kind,
            difficulty: options.restoredEngine.difficulty,
          };
          setPlayerAView(extractArcadePlayerAView(options.restoredEngine));
          setSnapshot(
            buildArcadeSnapshot(
              options.restoredLevelId ?? selectedLevelRef.current,
              fallbackTarget,
              options.restoredEngine,
              stateVersionRef.current,
            ),
          );
        } else {
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
      }
      if (options?.restoredOutcome) {
        setLastOutcome(options.restoredOutcome);
        lastOutcomeRef.current = options.restoredOutcome;
      }

      const handleStatusChange = (status: TransportStatus, detail?: string) => {
        setTransportStatus(status);
        setTransportDetail(detail ?? null);
        if (status === 'connected') {
          setRemotePlayer((prev) => (prev ? { ...prev, connected: true } : prev));
          if (screenRef.current === 'create-room' || screenRef.current === 'join-room') {
            setScreen('lobby');
          }
          const activeTransport = transportRef.current;
          if (!activeTransport) return;
          if (nextRole === 'guest' && (options?.isRecovery || isRecoveringRef.current)) {
            activeTransport.send('RECONNECT_REQUEST', {
              player: buildLocalProfile(),
              lastKnownStateVersion: stateVersionRef.current,
            });
            isRecoveringRef.current = false;
          } else {
            activeTransport.send('ROOM_JOIN', buildLocalProfile());
          }
        } else if (status === 'reconnecting' || status === 'disconnected') {
          setRemotePlayer((prev) => (prev ? { ...prev, connected: false } : prev));
        }
      };

      if (modeInfo.mode === 'peerjs') {
        const peerTransport = new PeerJSTransport({
          roomCode: code,
          selfPeerId: nextPeerId,
          role: nextRole,
          onStatusChange: handleStatusChange,
          onEnvelope: handleIncomingEnvelope,
        });
        transportRef.current = peerTransport;
        peerTransport.startWaiting();

        if (nextRole === 'host') {
          await peerTransport.createAsHost();
        } else {
          await peerTransport.connectAsGuest();
        }
      } else {
        const rtcTransport = new WebRTCTransport({
          roomCode: code,
          selfPeerId: nextPeerId,
          role: nextRole,
          signaling,
          onStatusChange: handleStatusChange,
          onEnvelope: handleIncomingEnvelope,
        });
        transportRef.current = rtcTransport;
        rtcTransport.startWaiting();

        const meta = {
          name: settingsRef.current.playerName || (nextRole === 'host' ? 'Player A' : 'Player B'),
          character: settingsRef.current.preferredCharacter,
        };

        if (nextRole === 'host') {
          await signaling.createRoom(code, nextPeerId, meta);
        } else {
          const joinRes = await signaling.joinRoom(code, nextPeerId, meta);
          rtcTransport.initiateConnection(joinRes.hostId);
        }
      }

      setScreen(options?.targetScreen ?? 'lobby');
    },
    [buildLocalProfile, connectionPreference, handleIncomingEnvelope, teardownTransport],
  );

  // Detect dev relay availability & attempt recovery if user refreshed mid-session
  useEffect(() => {
    void detectLocalDevRelayAvailable().then((avail) => {
      setLocalRelayAvailable(avail);
    });

    const backup = loadRoomSessionBackup();
    if (!backup) return;

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
      restoredTarget: backup.selectedTarget,
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
      try {
        const newPeerId = createPeerId();
        setReady(false);
        setRemotePlayer(null);
        hostEngineRef.current = null;
        stateVersionRef.current = 0;
        setSnapshot(null);
        setPlayerAView(null);
        setLastOutcome(null);

        let attemptCode = generateRoomCode(6);
        try {
          await attachTransport(attemptCode, 'host', newPeerId, { targetScreen: 'create-room' });
        } catch (err) {
          if (err instanceof Error && err.message.includes('in use')) {
            attemptCode = generateRoomCode(6);
            await attachTransport(attemptCode, 'host', newPeerId, { targetScreen: 'create-room' });
          } else {
            throw err;
          }
        }
        playCozySound('success', settingsRef.current.soundEnabled);
      } catch (err) {
        await teardownTransport();
        setRoomError(err instanceof Error ? err.message : 'Unable to create room.');
      } finally {
        setRoomBusy(false);
      }
    },
    [attachTransport, teardownTransport],
  );

  const joinRoom = useCallback(
    async (rawInput: string, customName?: string) => {
      const normalized = normalizeRoomCode(rawInput);
      if (!isValidRoomCodeFormat(normalized)) {
        setRoomError('Enter a valid 4–8 character room code (for example HRT429).');
        return;
      }
      if (customName !== undefined) {
        setSettings((prev) => ({ ...prev, playerName: customName.trim().slice(0, 20) }));
      }
      setRoomBusy(true);
      setRoomError(null);
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
    [attachTransport, teardownTransport],
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
    const nextTarget: LaunchTarget = { mode: 'campaign', levelId };
    selectedTargetRef.current = nextTarget;
    setSelectedTarget(nextTarget);
    playCozySound('tap', settingsRef.current.soundEnabled);
  }, []);

  const selectArcadeGame = useCallback(
    (gameId: ArcadeGameId, difficulty: DifficultyLevel) => {
      const nextTarget: LaunchTarget = { mode: 'arcade', gameId, difficulty };
      selectedTargetRef.current = nextTarget;
      setSelectedTarget(nextTarget);
      playCozySound('tap', settingsRef.current.soundEnabled);
    },
    [],
  );

  const launchTarget = useCallback(
    (target: LaunchTarget, isRestart: boolean) => {
      if (roleRef.current !== 'host') return;
      if (target.mode === 'campaign') {
        if (target.levelId > progressionRef.current.unlockedLevelId) return;
        selectedLevelRef.current = target.levelId;
        setSelectedLevelId(target.levelId);
      }

      selectedTargetRef.current = target;
      setSelectedTarget(target);
      setRoomError(null);
      setNoticeBanner(null);

      const now = Date.now();
      stateVersionRef.current += 1;

      if (target.mode === 'arcade') {
        const engine = createArcadeEngineState(target.gameId, target.difficulty, now);
        hostEngineRef.current = engine;
        const aView = extractArcadePlayerAView(engine);
        const snap = buildArcadeSnapshot(
          selectedLevelRef.current,
          target,
          engine,
          stateVersionRef.current,
        );
        setPlayerAView(aView);
        setSnapshot(snap);
        setLastOutcome(null);
        setScreen('minigame');
        playCozySound(isRestart ? 'tap' : 'success', settingsRef.current.soundEnabled);

        transportRef.current?.send(isRestart ? 'LEVEL_RESTART' : 'GAME_START', {
          levelId: selectedLevelRef.current,
          target,
          snapshot: snap,
        });
        return;
      }

      const engine = createEngineState(target.levelId, now);
      hostEngineRef.current = engine;
      const aView = extractPlayerAView(target.levelId, engine);
      const snap = buildSanitizedSnapshot(target.levelId, engine, stateVersionRef.current);

      setPlayerAView(aView);
      setSnapshot(snap);
      setLastOutcome(null);
      setScreen('minigame');
      playCozySound(isRestart ? 'tap' : 'success', settingsRef.current.soundEnabled);

      transportRef.current?.send(isRestart ? 'LEVEL_RESTART' : 'GAME_START', {
        levelId: target.levelId,
        target,
        snapshot: snap,
      });
    },
    [],
  );

  const startLevel = useCallback(
    (levelIdOverride?: LevelId) => {
      if (roleRef.current !== 'host') return;
      if (!readyRef.current || !remotePlayer?.ready || !remotePlayer?.connected) {
        setRoomError('Both players must be connected and Ready to start!');
        return;
      }
      const target: LaunchTarget =
        levelIdOverride !== undefined
          ? { mode: 'campaign', levelId: levelIdOverride }
          : selectedTargetRef.current;
      launchTarget(target, false);
    },
    [launchTarget, remotePlayer],
  );

  const restartCurrentLevel = useCallback(() => {
    launchTarget(selectedTargetRef.current, true);
  }, [launchTarget]);

  const sendGameAction = useCallback(
    (action: GameActionInput) => {
      if (roleRef.current === 'host') {
        handleHostGameAction(selectedLevelRef.current, action, 'host');
      } else if (roleRef.current === 'guest') {
        transportRef.current?.send('GAME_ACTION', {
          levelId: selectedLevelRef.current,
          target: selectedTargetRef.current,
          action,
        });
      }
    },
    [handleHostGameAction],
  );

  // Host-only fixed-step simulation ticker for real-time Arcade games (Balloon Rescue & Draw My Mind timer)
  useEffect(() => {
    if (role !== 'host' || screen !== 'minigame' || selectedTarget.mode !== 'arcade') {
      return;
    }

    if (selectedTarget.gameId === 'balloon-rescue') {
      const interval = setInterval(() => {
        handleHostGameAction(
          selectedLevelRef.current,
          { kind: 'balloon-rescue', type: 'TICK_BALLOON' },
          'host',
        );
      }, 180);
      return () => clearInterval(interval);
    }

    if (selectedTarget.gameId === 'draw-my-mind') {
      const interval = setInterval(() => {
        handleHostGameAction(
          selectedLevelRef.current,
          { kind: 'draw-my-mind', type: 'TICK_DRAW_TIMER' },
          'host',
        );
      }, 1000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [role, screen, selectedTarget, handleHostGameAction]);

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
    selectedTarget,
    remotePlayer,
    transportStatus,
    transportDetail,
    signalingInfo,
    localRelayAvailable,
    connectionPreference,
    setConnectionPreference,
    roomBusy,
    roomError,
    setRoomError,
    noticeBanner,
    setNoticeBanner,
    playerAView,
    snapshot,
    lastOutcome,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    selectCharacter,
    selectCosmetic,
    selectLevel,
    selectArcadeGame,
    startLevel,
    restartCurrentLevel,
    sendGameAction,
    returnToLobbyFromGame,
    openSettings,
    closeSettings,
    buildLocalProfile,
  };
}
