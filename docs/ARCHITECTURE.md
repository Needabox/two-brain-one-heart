# Technical Architecture — Two Brains, One Heart

## 1. Tech Stack

- **UI Framework:** React 19 + TypeScript (`strict: true`, zero unjustified `any`)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 + custom pastel design tokens (`src/styles/tokens.css`)
- **Motion:** Framer Motion (wrapped with `MotionConfig reducedMotion="user"` + explicit app setting toggle)
- **Runtime Validation:** Zod (validates all incoming WebRTC/signaling messages and persisted `localStorage` payloads)
- **Icons:** Custom kawaii SVG asset components + `lucide-react` for clean secondary UI controls
- **Testing:** Vitest + `@testing-library/react` + `jsdom`

## 2. Directory Structure

```text
public/
  assets/
    characters/      # Canonical boy & girl SVGs + expressions
    backgrounds/     # Cozy Room backdrop & soft cloud pattern SVGs
    props/           # Cozy sofa, key, chest, plant, heart lock SVGs
    icons/           # Star, heart, trophy, sound, settings kawaii SVGs
    effects/         # Sparkle burst & confetti SVGs
src/
  game-engine/       # Pure TypeScript: puzzle configs, mini-game engines, scoring, BFS maze verifier
  multiplayer/
    protocol.ts      # Versioned Zod schemas + typed multiplayer events
    signaling/       # SignalingProvider interface + LocalDevHttp + BroadcastChannel + Supabase adapters
    webrtc/          # PeerConnection wrapper, DataChannel transport, heartbeat & reconnect manager
  features/
    room/            # Room create/join/lobby state orchestration & React hook
    progression/     # XP, star calculation, unlock logic, localStorage persistence, peer reconciliation
    settings/        # Sound effects (Web Audio API gentle chimes), reduced motion, persisted prefs
  games/
    memory-sync/     # Player A clue view + Player B sequence pad
    secret-language/ # Player A coded message + Player B decoder table & input
    lost-together/   # Player A full map + Player B 3x3 fog-of-war + D-pad
    shape-it/        # Player A target blueprint + Player B snap grid & tray
    mixed-challenge/ # Composes Secret Language (Stage 1) -> Lost Together (Stage 2)
  components/        # Reusable UI primitives (CuteButton, PastelCard, AssetIcon, CharacterAvatar, ConnectionPill, Modals)
  screens/           # 8 top-level screens matching ANTIGRAVITY_PROMPT.md §8
vite-plugin-local-signal.ts  # Dev-only SSE+POST local signaling relay (zero external services needed)
```

## 3. Networking & Signaling Architecture

### Important Infrastructure Reality
WebRTC provides direct peer-to-peer `RTCDataChannel` gameplay once connected, **but cannot discover peers or cross restrictive NATs alone**:
1. **Signaling** is required to exchange room presence, SDP offers/answers, and ICE candidates.
2. **STUN** (configurable via `VITE_ICE_SERVERS`, defaulting to Google public STUN servers) discovers public reflexive addresses.
3. **TURN** is required in production when peers sit behind symmetric NATs or strict corporate/mobile firewalls.

### Pluggable `SignalingProvider` Interface
All signaling adapters implement `SignalingProvider`:
- `connect(): Promise<void>`
- `disconnect(): Promise<void>`
- `createRoom(roomCode, hostMeta): Promise<void>`
- `joinRoom(roomCode, guestMeta): Promise<{ hostId: string }>`
- `sendSignal(envelope): Promise<void>`
- `onMessage(handler): () => void`
- `onPeerStatus(handler): () => void`
- `getModeInfo(): { mode, label, supportsCrossDevice, notes }`

### Implemented Pure Frontend Adapters
1. **`Direct P2P Manual Invite/Reply` (`mode: 'manual-p2p'`, default on static Vercel builds)**
   - Uses `manualCodec.ts` (`deflate-raw` + base64url + Zod validation) to bundle WebRTC SDP Offer/Answer together with gathered STUN ICE candidates into a copy-pasteable `TBOH1:...` code.
   - Enables real two-device multiplayer on static hosting (Vercel) with zero backend, zero database, and zero external signaling accounts.
   - Note: Direct P2P relies on public STUN (`stun.l.google.com:19302`) and can still be blocked by strict symmetric NATs unless an optional `VITE_ICE_SERVERS` TURN relay is configured.
2. **`LocalDevHttpSignalingProvider` (`mode: 'local-dev-relay'`)**
   - Activated automatically during `npm run dev` when `/__signal/health` returns JSON `{ ok: true, mode: 'local-dev-relay' }`.
   - Uses a lightweight Vite middleware (`vite-plugin-local-signal.ts`) exposing HTTP `POST` + `EventSource` SSE streams for fast 6-char room code pairing across separate browsers & LAN devices locally.
3. **`BroadcastChannelSignalingProvider` (`mode: 'broadcast-channel'`)**
   - Connects two tabs within the same browser origin using a short 6-char room code.

### Environment Variables (All Optional)
- `VITE_ICE_SERVERS` — Optional JSON array of `RTCIceServer` objects (`stun:` and optional `turn:` entries for restrictive NATs)
- `VITE_SIGNALING_MODE` — Optional override (`auto` | `manual-p2p` | `local-relay` | `broadcast`)

---

## 4. Multiplayer Protocol (`PROTOCOL_VERSION = 1`)

Every message sent over signaling or `RTCDataChannel` uses a versioned envelope validated at runtime by `MultiplayerEnvelopeSchema` (Zod):

```ts
{
  version: 1,
  roomId: string,
  senderId: string,
  eventId: string,   // Unique UUID/nanoid for idempotency
  seq: number,       // Monotonic sender sequence number
  timestamp: number,
  type: ProtocolEventType,
  payload: ...       // Discriminated union validated per event type
}
```

### Required Event Types
- Room & Presence: `ROOM_JOIN`, `ROOM_LEAVE`, `PLAYER_READY`, `PLAYER_STATE`
- Lifecycle: `GAME_START`, `GAME_ACTION`, `GAME_STATE_SNAPSHOT`
- Outcomes: `LEVEL_COMPLETE`, `LEVEL_FAILED`, `LEVEL_RESTART`
- Connection Health & Recovery: `PING`, `PONG`, `RECONNECT_REQUEST`, `RECONNECT_ACCEPTED`

### Protocol Guarantees
1. **Runtime Validation:** Every inbound message is parsed with `MultiplayerEnvelopeSchema.safeParse(...)`; malformed payloads are logged/ignored safely without crashing UI.
2. **Idempotent Event Handling:** Peers maintain a bounded FIFO set (`max 500` entries) of processed `eventId`s. Duplicate deliveries (e.g., on reconnect replay or retries) are ignored.
3. **Out-of-Order & Stale Snapshot Guard:** `GAME_STATE_SNAPSHOT` carries a monotonic `stateVersion`. Snapshots with `stateVersion <= lastAppliedStateVersion` are ignored.
4. **Private Clue Isolation:** The Host runs the authoritative level engine and projects **sanitized views**:
   - Host UI renders `extractPlayerAView(engineState)`.
   - Outbound `GAME_STATE_SNAPSHOT` sent over WebRTC carries ONLY `sharedMeta` + `extractPlayerBView(engineState)`. Player A's secret sequence, full maze walls, cipher symbols, and target blueprint coordinates are never sent over the network to Player B.
5. **Reconnection Recovery:**
   - Heartbeat `PING` every 4s; peer marked `reconnecting` after 10s without `PONG`, `disconnected` after 25s.
   - Room session info (`roomCode`, `playerId`, `role`, `playerName`, `activeLevelSnapshot`) is kept in `sessionStorage` / `localStorage` (not URLs or console logs).
   - If a tab refreshes or DataChannel drops, the client re-attaches via signaling, renegotiates WebRTC, and sends `RECONNECT_REQUEST`. Host replies with `RECONNECT_ACCEPTED` + latest `GAME_STATE_SNAPSHOT` and reconciled `PLAYER_STATE`.
6. **Host Authority Caveat:** Because MVP has no backend game server, Host computes and broadcasts `LEVEL_COMPLETE` / `stars` / `xpAwarded`. A modified host client could spoof results locally; this is an explicit, acceptable trade-off for a private two-player couple adventure.
