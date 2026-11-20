# Implementation Plan — Two Brains, One Heart

## Phased Execution Roadmap

### Phase 1 — Repository Assessment & Documentation *(Completed)*
- Inspected starter repository, `README.md`, `ANTIGRAVITY_PROMPT.md`, and all 3 reference PNG boards.
- Authored `PROJECT_CONTEXT.md`, `GAME_DESIGN.md`, `ARCHITECTURE.md`, `ASSET_GUIDE.md`, `IMPLEMENTATION_PLAN.md`, and `TEST_PLAN.md`.

### Phase 2 — Project Setup, Design Tokens, Assets & App Shell *(Completed)*
- Initialized TypeScript strict config, Vite, Tailwind CSS v4, Framer Motion, Zod, Lucide React, `@supabase/supabase-js`, ESLint, Vitest + Testing Library.
- Created pastel design tokens (`src/styles/tokens.css`) and organized local SVG assets in `public/assets/{characters,backgrounds,props,icons,effects}/`.
- Built reusable UI primitives (`CuteButton`, `PastelCard`, `AssetImage` with fallback, `CharacterAvatar` with cosmetics, `ConnectionPill`, `ConfirmDialog`, `CozySymbolIcon`).
- Built responsive app shell and all 8 screens (`Landing`, `CreateRoom`, `JoinRoom`, `Lobby`, `WorldSelect`, `MiniGame`, `LevelResult`, `SettingsHelp`).

### Phase 3 — Signaling Abstraction & Room/Lobby Flow *(Completed)*
- Implemented `SignalingProvider` interface plus `LocalDevHttpSignalingProvider` (+ `vite-plugin-local-signal.ts`), `BroadcastChannelSignalingProvider`, and `SupabaseSignalingProvider`.
- Implemented Create Room / Join Room / Lobby UI states with loading, invalid code validation, waiting state, ready toggles, character/cosmetic picker, and host level selector.

### Phase 4 — WebRTC Peer Transport & Typed Protocol *(Completed — Live Chrome Session Pending Remote Debugging)*
- Implemented versioned Zod multiplayer protocol (`src/multiplayer/protocol.ts`), `WebRTCTransport` (configurable STUN/TURN, ICE candidate buffering, `RTCDataChannel`, heartbeat `PING`/`PONG`), and `RECONNECT_REQUEST`/`RECONNECT_ACCEPTED`.
- Verified signaling relay middleware, `BroadcastChannel` pairing, and protocol validation in Vitest; live Chrome two-tab run requires user-enabled Chrome remote debugging (`chrome://inspect/#remote-debugging`).

### Phase 5 — Pure Game Engine & Progression Core *(Completed)*
- Built pure TypeScript `src/game-engine/` modules: deterministic puzzles for Levels 1–5, clue isolation projections (`extractPlayerAView` / `extractPlayerBView`), BFS route verifier, grid placement validator, scoring & star thresholds, XP/unlock progression, idempotent completion deduplication, and peer reconciliation.

### Phase 6 — Level 1 (**Memory Sync**) End-to-End *(Completed)*
- Wired `GAME_START`, `GAME_ACTION`, `GAME_STATE_SNAPSHOT`, `LEVEL_COMPLETE`, `LEVEL_RESTART` between Host and Guest over WebRTC.
- Verified clue isolation (`Player A` never sees `Player B` controls; `Player B` never receives sequence).

### Phase 7 — Remaining Mini-Games & Mixed Final Level *(Completed)*
- Implemented **Level 2: Secret Language**, **Level 3: Lost Together**, **Level 4: Shape It!**, and **Level 5: Mixed Challenge** (reusing Secret Language + Lost Together engines).

### Phase 8 — Progression, Rewards, Cosmetics & Local Persistence *(Completed)*
- Connected `localStorage` persistence, replay best-star retention, XP progression, star-unlocked cosmetics (`2★`, `5★`, `8★`, `12★`), and peer progress reconciliation on lobby join.

### Phase 9 — Accessibility, Responsive Polish, Reconnection & Tests *(Completed)*
- Added `prefers-reduced-motion` + explicit Reduced Motion toggle, Web Audio cozy chimes toggle, `>= 44px` touch targets, `360px` mobile-friendly grids, disconnect/reconnecting banners, and `sessionStorage` refresh recovery.
- Verified all automated tests, lint, typecheck, and build cleanly.

### Phase 10 — Final Audit Against Definition of Done *(Completed)*
- Audited against `ANTIGRAVITY_PROMPT.md §12` and documented live Chrome remote-debugging prerequisite plus production Supabase + TURN configuration requirements.
