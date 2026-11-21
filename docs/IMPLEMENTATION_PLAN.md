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

---

## Expansion Plan — 8 New Arcade Mini-Games & Arcade Mode

### Phase 1 (Expansion) — Codebase Audit & Architecture Blueprint *(Completed)*
- **Existing Architecture:** Pure TypeScript deterministic engine (`src/game-engine/{types,puzzles,engines,scoring}.ts`), host-authoritative state machine with clue-isolated projections (`extractPlayerAView` / `extractPlayerBView`), `GameTransport` abstraction (`PeerJSTransport` + `WebRTCTransport`), Zod-validated `PROTOCOL_VERSION = 1` envelopes, and `localStorage`/`sessionStorage` persistence.
- **Registry & Navigation Analysis:** Campaign Levels 1–5 are defined in `LEVEL_METADATA` (`src/game-engine/puzzles.ts`) and launched via `useMultiplayerRoom` using numeric `LevelId (1..5)`. Adding a unified `GAME_REGISTRY` and `LaunchTarget` (`campaign` vs `arcade`) lets both Campaign (World 1) and Arcade Mode (8 new games across 6 categories with Easy/Medium/Hard difficulties) share Lobby, Ready checks, `MiniGameScreen`, `LevelResultScreen`, XP, and reconnection without touching Campaign Levels 1–5.
- **Protocol & Bidirectional Input Analysis:** Existing games mostly send `GAME_ACTION` from Guest -> Host. New games (`rhythm-duo`, `dont-press-together`, `mirror-moves`, `draw-my-mind` Round 2 role swap, `balloon-rescue`) require **both** Host and Guest actions (`playerRole: 'host' | 'guest'` passed into pure `applyArcadeAction`!), synchronized countdown origins resilient to clock drift, and throttled batched canvas strokes for `draw-my-mind`.
- **Backward Compatibility Risk & Mitigation:** Existing `ProgressionStateSchema` rejects missing fields if non-optional keys are added. Adding `arcadeRecords` as `.optional().default({})` guarantees existing `tboh_progression_v1` `localStorage` data loads cleanly with zero progress loss while keeping a single shared `xp` and `processedCompletionIds` ledger.

### Phase 2 (Expansion) — Arcade Foundation *(Completed)*
- Defined `ArcadeGameId`, `DifficultyLevel`, `GameCategory`, `LaunchTarget`, `ArcadeOutcomeMeta`, and central `ARCADE_GAME_REGISTRY` (`src/game-engine/registry.ts`).
- Extended `ProgressionState` with backward-compatible `arcadeRecords` (`.optional().default({})`), added `ArcadeSelectScreen`, wired Landing/Lobby/Result Arcade navigation, and preserved existing Campaign progression.

### Phase 3 (Expansion) — 8 Pure Mini-Game Engines & Validators *(Completed)*
- Implemented isolated `types.ts`, `config.ts`, `validator.ts`, and `engine.ts` modules under `src/games/<game-id>/` for all 8 games (`rhythm-duo`, `power-connection`, `dont-press-together`, `potion-lab`, `mirror-moves`, `draw-my-mind`, `bridge-builder`, `balloon-rescue`).

### Phase 4 (Expansion) — Multiplayer Protocol & Clue Isolation Wiring *(Completed)*
- Wired all 8 engines into `src/game-engine/arcadeEngines.ts`, Zod `GameActionInputSchema`, `SanitizedSnapshotSchema`, and `useMultiplayerRoom` (with server/host `trustedActor` identity enforcement, fixed-step `180ms` simulation tick for `balloon-rescue`, and `1000ms` timer tick for `draw-my-mind`).

### Phase 5 (Expansion) — UI Components & Local SVG Assets *(Completed)*
- Created 8 thumbnail icons (`public/assets/icons/minigame-*.svg`) and 8 potion bottle SVGs (`public/assets/props/potion-*.svg`).
- Built responsive (`>= 360px`, `>= 44px` touch targets, reduced-motion & sound aware) game UI components and integrated them into `MiniGameScreen.tsx`.

### Phase 6 (Expansion) — Progression, Replay, Stars & XP Parity *(Completed)*
- Connected Arcade best stars/score/time tracking, shared XP calculation, idempotent `completionId` deduplication, replay retention, legacy save compatibility, and peer reconciliation.

### Phase 7 (Expansion) — Comprehensive Tests & Verification *(Completed)*
- Added 30 deterministic engine tests across all 8 new games (including BFS solvability checks on all Mirror Moves boards), protocol round-trip coverage, legacy & Arcade scoring tests, UI clue isolation tests, and two-peer session sync verification.

### Phase 8 (Expansion) — Documentation Sync *(Completed)*
- Updated `PROJECT_CONTEXT.md`, `GAME_DESIGN.md`, `ARCHITECTURE.md`, `ASSET_GUIDE.md`, `IMPLEMENTATION_PLAN.md`, `TEST_PLAN.md`, and `README.md` covering all 13 playable game modes.
