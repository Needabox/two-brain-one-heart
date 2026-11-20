# Test Plan — Two Brains, One Heart

## 1. Automated Unit & Component Tests (`Vitest`)

All automated tests run via `npm test` (`vitest run`).

### Game Engine & Deterministic Puzzles
- **Level 1 (`Memory Sync`):**
  - Exact sequence match advances round / completes level.
  - Wrong length or wrong symbol order increments `mistakes`, preserves playability, and triggers retry preview without advancing.
  - Hint increments `hintsUsed` and drops max attainable stars from 3 to 2.
  - `extractPlayerBView` never includes the expected sequence symbols.
- **Level 2 (`Secret Language`):**
  - Valid decoded word (`COZY`, `HEART`) advances/completes regardless of case/whitespace normalization.
  - Wrong word increments `mistakes`.
  - `extractPlayerBView` includes the 12-symbol decoder map and word length ONLY; never includes `codedSymbolIds` or `answer`.
  - `extractPlayerAView` includes `codedSymbolIds` ONLY; never includes `decoderMap`.
- **Level 3 (`Lost Together`):**
  - BFS verifier confirms valid solvable route from `start` -> `key` -> `door` on Level 3 and Level 5 mazes.
  - Movement within open cells updates avatar position cleanly.
  - Moving into walls or outside grid `[0..6]` bounds is blocked, keeps avatar on valid tile, and increments `mistakes`.
  - Reaching `door` without collecting `key` does not win; collecting `key` then reaching `door` completes level.
  - Reset returns avatar to start cleanly.
  - `extractPlayerBView` contains ONLY the 3×3 neighborhood around `avatarPos` — never full wall grid or out-of-range coordinates.
- **Level 4 (`Shape It!`):**
  - Valid placement of all 4 polyomino pieces covering the exact 12-cell silhouette completes the level.
  - Rotating pieces (0°, 90°, 180°, 270°) transforms relative cell offsets correctly.
  - Overlapping pieces, out-of-bounds placement, missing pieces, or mismatched silhouette cells are rejected with clear reason and increment `mistakes`.
  - `extractPlayerBView` contains piece definitions ONLY; never `targetPlacements` or `targetMask`.
- **Level 5 (`Mixed Challenge`):**
  - Stage 1 validates Secret Language passkey (`SPARK`) and transitions cleanly to Stage 2 (`Lost Together` maze).
  - Mistakes, hints, and timer accumulate across both stages.
  - Clue isolation holds in both stages.

### Scoring, XP, Unlocks & Persistence
- 1★ / 2★ / 3★ thresholds: completion alone = 1★; within mistake target = 2★; within mistake + time + 0 hints = 3★.
- Replay never reduces existing best stars (`3★ -> 1★` replay preserves `3★`).
- Level `N+1` unlocks when Level `N` reaches `>= 1` star.
- Duplicate `completionId` / `LEVEL_COMPLETE` event does not grant duplicate XP or mutate stats twice.
- Cosmetic unlock milestones unlock accurately at `2★`, `5★`, `8★`, `12★`.
- Peer progress reconciliation picks `Math.max` per level stars, unlocked level, and XP cleanly.

### Multiplayer Protocol & Reconnection
- Zod validation accepts all 14 required event types (`ROOM_JOIN`, `ROOM_LEAVE`, `PLAYER_READY`, `PLAYER_STATE`, `GAME_START`, `GAME_ACTION`, `GAME_STATE_SNAPSHOT`, `LEVEL_COMPLETE`, `LEVEL_FAILED`, `LEVEL_RESTART`, `PING`, `PONG`, `RECONNECT_REQUEST`, `RECONNECT_ACCEPTED`).
- Malformed envelopes, wrong protocol version, and invalid payloads fail Zod validation gracefully.
- Duplicate `eventId` is ignored idempotently.
- Stale `GAME_STATE_SNAPSHOT` with lower/equal `stateVersion` is discarded.
- Reconnection snapshot restores active level state accurately without resetting completed rounds or corrupting scores.
- Vite local dev signaling relay middleware handles health, room create, invalid room 404, valid join, capacity 409, queued SSE signal delivery, and host refresh re-creation.

---

## 2. Integration & Manual Two-Browser Test Scenarios

### Setup for Local Cross-Browser Testing
1. Run `npm run dev` (starts Vite + local SSE/POST dev signaling relay at `/__signal`).
2. Open Browser A (e.g., Chrome normal window) and Browser B (e.g., Chrome Incognito or Safari or mobile device on same LAN).

### Setup for Separate Networks (Production / Internet)
1. Configure `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, plus `VITE_ICE_SERVERS` with STUN and TURN server entries.
2. Open deployed HTTPS site on Device A (Wi-Fi) and Device B (cellular data).

### Verification Checklist
1. **Create / Join / Ready / Start:**
   - Browser A creates room -> copies 6-char room code.
   - Browser B enters code -> connects over signaling + WebRTC DataChannel -> both appear in Lobby with `"Connected"` badges.
   - Host cannot start until both Ready toggles are ON; once both Ready, Host launches Level 1.
2. **Clue Isolation Check:**
   - Inspect both screens (and WebRTC snapshot payload in DevTools): Player A sees only A's clue view; Player B sees only B's interactive view; neither sees the other's secret clue.
3. **Simultaneous & Out-of-Order Actions:**
   - Rapidly tap movement/ready/shape controls while signaling or transitioning rounds; verify sequence numbers & stateVersion prevent glitches or freezes.
4. **Guest Refresh / Temporary Disconnect:**
   - During Level 3 (mid-maze after picking up Key), Guest refreshes tab or toggles offline briefly -> reconnects to room -> receives `RECONNECT_ACCEPTED` + `GAME_STATE_SNAPSHOT` with `keyCollected === true` and exact avatar position.
5. **Host Disconnect & Reconnect:**
   - Host temporarily drops connection -> Guest sees clear `"Partner disconnected / Reconnecting..."` status banner -> Host returns/re-establishes room or exits cleanly without silent freeze.
6. **Invalid Room Code & Expired Room:**
   - Entering `"BAD999"` or malformed code shows immediate clear validation/error message (never hangs infinitely on "Connecting...").
7. **Narrow Mobile Viewport (`360px` width) & Touch:**
   - Inspect all 8 screens at `360×740` viewport; verify zero horizontal scroll overflow, `>= 44px` touch buttons, readable contrast, and zero hover-only controls.
8. **Shared Result & Progression Parity:**
   - Finish levels and verify both clients display identical Stars, XP, Time, Mistakes, Hints, and Level Unlocks, and persist across browser reload.

---

## 3. Executed Verification Status

- **Automated Verification (`npm run typecheck && npm run lint && npm test && npm run build`):**
  - Executed after final edit across 7 Vitest suites (26 tests total) + strict TypeScript + ESLint + production Vite build.
- **Live Two-Browser Chrome DevTools Session:**
  - Attempted against `http://localhost:5173/`, blocked on host machine because Chrome remote debugging (`chrome://inspect/#remote-debugging` / `DevToolsActivePort`) was not active. Run `npm run dev` locally in two browser windows (or enable Chrome remote debugging to let the browser subagent run the live two-tab walkthrough) to execute Section 2 interactively.
