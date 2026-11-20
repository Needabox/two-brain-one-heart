# Antigravity Master Prompt — Two Brains, One Heart

You are the lead product engineer, game designer, UI designer, and QA engineer for this project. Build a complete, playable MVP of **Two Brains, One Heart**, a mobile-first, two-player cooperative puzzle adventure for an LDR couple.

## 0. Mandatory first steps

1. Inspect the entire existing repository before changing anything. Identify framework, scripts, dependencies, conventions, and existing implementation.
2. Read all three reference boards in `assets/`:
   - `01-primary-art-direction-board.png`
   - `02-game-ui-and-world-reference.png`
   - `03-gameplay-and-prop-reference.png`
3. Treat the boards as visual direction, not finished UI screenshots or production sprite sheets. Read `README.md` for asset limitations.
4. Create or update `docs/PROJECT_CONTEXT.md`, `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/ASSET_GUIDE.md`, `docs/IMPLEMENTATION_PLAN.md`, and `docs/TEST_PLAN.md` before major implementation.
5. If repository state, existing code, credentials, or product requirements conflict with this prompt, explain the conflict and ask one focused question before destructive changes. Do not overwrite or remove existing work without approval.
6. After inspection, present a concise repository assessment, proposed architecture, risks, and phased plan. Then proceed with implementation unless a genuinely blocking decision or secret is required.

## 1. Product definition

**Title:** Two Brains, One Heart  
**Tagline:** Two minds. Different clues. One mission.  
**Genre:** Cooperative puzzle adventure  
**Players:** Exactly 2  
**Session target:** 15–30 minutes  
**Platform:** Responsive web, mobile-first, desktop supported  
**Tone:** Playful, cute, warm, funny, cooperative  
**Core promise:** Each player receives different information. Neither player can solve the challenge alone. They must communicate and coordinate to win.

This is not Monopoly, a board game, a dice game, a property/trading game, or a turn-based economy game. Do not reuse Monopoly mechanics, board movement, dice, money, rent, property, or player elimination.

## 2. Core game loop

1. Player A creates a private room and receives a short room code.
2. Player B joins using that code.
3. Both players appear in a shared lobby and confirm Ready.
4. Host selects an unlocked level.
5. Each player receives a different private clue/information view.
6. Players communicate verbally outside the app or through their own call. Do not build voice/video chat in MVP.
7. Players submit actions. Game state synchronizes in real time.
8. The game validates the cooperative solution and shows a shared result.
9. Award stars and XP, unlock the next level, and allow replay.

A session should contain multiple short challenges and fit within 15–30 minutes. Avoid long mandatory animations and unnecessary waiting.

## 3. MVP scope — build this, not the full future roadmap

- 1 world: **The Cozy Room**.
- 5 playable levels.
- 4 mini-game types: Memory Sync, Secret Language, Lost Together, Shape It!.
- 2 player slots and private room create/join flow.
- Real-time multiplayer state synchronization.
- Shared level progression, stars, and XP.
- Basic character selection using the two canonical characters below.
- 3–5 simple cosmetic accessories if time allows; cosmetics must not affect gameplay.
- Responsive mobile and desktop layouts.
- Reconnection handling and clear connection states.
- Local persistence for each browser, with explicit reconciliation of shared progress between peers.

Out of MVP: five worlds, 25 levels, daily challenges, shared-room decoration, achievements catalogue, shop/economy, voice/video chat, accounts, payments, backend user profiles, and cloud save. Keep architecture extensible, but do not implement these before MVP works end-to-end.

## 4. Level design

World 1 — The Cozy Room. Five levels:

| Level | Mini-game | Difficulty | Learning goal |
|---|---|---|---|
| 1 | Memory Sync | Easy | Learn to describe and remember a short pattern |
| 2 | Secret Language | Easy | Decode a simple symbol-to-letter mapping together |
| 3 | Lost Together | Medium | One player reads a map; the other controls a character |
| 4 | Shape It! | Medium | One player sees a target silhouette; the other assembles pieces |
| 5 | Mixed Challenge | Hard | Combine at least two previously learned mechanics |

Provide deterministic, tested puzzle data. Each puzzle must have a valid solution and a clear failure/retry path. Avoid random generation unless the generator guarantees solvability and is covered by tests.

## 5. Mini-game requirements

### 5.1 Memory Sync
- Player A sees a sequence of 4–6 symbols for a limited preview period.
- Player B sees an empty sequence input and must reproduce the sequence based on A's verbal description.
- Player A must not see or control Player B's answer controls.
- Validate order exactly; show shared success/failure feedback.
- Support touch input and accessible labels.

### 5.2 Secret Language
- Player A sees a symbol/code message.
- Player B sees a decoder key or mapping.
- They communicate to decode and submit the correct answer.
- Do not reveal both clue sets to either player.

### 5.3 Lost Together
- Player A sees the maze map and goal route, but cannot control the avatar.
- Player B sees and controls the avatar, but cannot see the full map.
- A gives directions; B moves using accessible directional controls.
- Validate walls, movement bounds, goal reachability, and reset behavior.

### 5.4 Shape It!
- Player A sees the target silhouette/reference.
- Player B sees draggable/tappable shape pieces and a board.
- B assembles the target based on A's description.
- Use a small deterministic set of shapes for MVP. Prefer snap-to-grid placement over physics.

### 5.5 Mixed Challenge
- Combine two existing mechanics in one final level. Reuse tested mini-game logic rather than creating an entirely new system.

## 6. Game rules and rewards

- Both players must be connected and ready before starting a level.
- Shared result must be identical on both clients.
- Each level awards 1–3 stars:
  - 1 star: level completed.
  - 2 stars: completed within the target mistake threshold.
  - 3 stars: completed within target time and without hints.
- XP is shared progression metadata; do not make it a grind or gate basic play behind energy.
- No lives/energy system, no paywalls, no ads, no punitive streak loss.
- Hints are optional. If included, show the same hint cost/rule to both players and record hint usage in the result.
- Replaying a level must not reduce existing stars. Keep the best result or highest star rating.
- Prevent duplicate reward grants when the same completion event is received more than once.

## 7. Art direction — follow reference boards

Use the provided boards as the visual source of truth. Overall look:
- Cute 2D kawaii / soft chibi illustration.
- Pastel palette: lavender, periwinkle, baby blue, blush pink, peach, cream, and mint.
- Rounded shapes, friendly outlines, soft shadows, subtle gradients, tiny sparkles/hearts.
- Playful, warm, polished. Not corporate dashboard, not generic SaaS UI, not photorealistic, not 3D.
- Clear contrast and readable text. Decorative elements must not obstruct gameplay.
- Use short, natural English game copy. Avoid generated-looking filler text.

### Canonical player characters
Keep the pair visually consistent across every screen, icon, sticker, and animation:
- Character A: chibi boy, warm brown tousled hair, peach/coral top, navy shorts, simple sneakers, friendly expression.
- Character B: chibi girl, deep violet hair, lavender bow, lavender/pale purple dress, simple shoes, friendly expression.
- Both have matching proportions, clean outlines, expressive faces, and a cohesive art style.
- Do not change their hair, outfit palette, body proportions, or identifying accessories between screens. Cosmetic unlocks may add accessories without changing the base design.

### Asset handling
- Do not use any entire reference board as a background or in-game screen.
- Do not crop text, labels, or UI mockups from the boards and present them as production UI.
- Rebuild buttons, cards, panels, progress bars, badges, and icons as clean CSS/SVG components.
- Use local assets only. No hotlinked images or remote image dependencies.
- If an isolated character or prop cannot be extracted cleanly, create a simple cohesive SVG/CSS illustration rather than using a visibly messy crop.
- Create `public/assets/` with organized subfolders (`characters`, `backgrounds`, `props`, `icons`, `effects`). Keep filenames descriptive and document each asset in `docs/ASSET_GUIDE.md`.
- Add a fallback for missing assets. Do not block gameplay on decorative assets.

## 8. UI screens

Build these screens with a consistent design system:
1. Landing / title screen: logo/title, tagline, Play, how-to-play.
2. Create room: generate room code, copy/share code, show waiting state.
3. Join room: enter code, validation and useful error states.
4. Lobby: both characters, player names/slots, connection state, Ready toggles, host level selection.
5. World/level select: one world, five levels, locked/unlocked/completed states, star display.
6. Mini-game screen: distinct private clue panel per player, shared status, timer where relevant, progress and exit confirmation.
7. Level result: shared outcome, stars, XP, retry, next level, lobby.
8. Settings/help: sound toggle, reduced motion, controls, how multiplayer works.

Mobile-first layout. Support narrow screens around 360px width. Never require hover. Use touch targets at least 44px. Avoid tiny text. Respect `prefers-reduced-motion`.

## 9. Technical architecture

First inspect the repository and preserve its existing stack if it is already suitable. If empty, use:
- React + TypeScript + Vite.
- Tailwind CSS for styling.
- Framer Motion only for purposeful UI transitions; respect reduced motion.
- Pure TypeScript game logic, independent from React components.
- WebRTC DataChannel for peer-to-peer gameplay events.
- A signaling transport adapter for room creation and WebRTC offer/answer/ICE exchange.
- LocalStorage for local device preferences and cached progress.

### Important networking truth
WebRTC does not eliminate signaling infrastructure. STUN/TURN may also be needed; direct peer connections can fail on restrictive networks. Do not claim that a fully reliable internet multiplayer experience works with zero supporting service.

Implement a clean `SignalingProvider` interface. Prefer Supabase Realtime Broadcast/Presence as a signaling-only transport if project credentials/configuration are already available or explicitly supplied. Do not create a Supabase project, expose service-role keys, or silently add a paid dependency. If no signaling credentials exist, implement a local development adapter and document the exact environment variables and setup needed for internet play. Provide a configurable STUN list and document TURN as the production reliability requirement. Never hardcode secrets.

Suggested separation:
- `game-engine`: deterministic rules, puzzle validation, scoring, progression calculations.
- `multiplayer`: peer connection, signaling adapter, typed events, reconnection.
- `features/room`: create/join/lobby lifecycle.
- `features/progression`: XP, stars, unlock rules, local persistence.
- `games/*`: isolated mini-game state machines and UI.
- `components/*`: reusable UI and layout.

### Multiplayer protocol
Define versioned, typed events. At minimum:
- `ROOM_JOIN`, `ROOM_LEAVE`, `PLAYER_READY`, `PLAYER_STATE`.
- `GAME_START`, `GAME_ACTION`, `GAME_STATE_SNAPSHOT`.
- `LEVEL_COMPLETE`, `LEVEL_FAILED`, `LEVEL_RESTART`.
- `PING`, `PONG`, `RECONNECT_REQUEST`, `RECONNECT_ACCEPTED`.

Requirements:
- Validate every incoming event at runtime (e.g. Zod if dependency is justified).
- Include protocol version, room ID, sender/player ID, event ID, sequence number, and timestamp where appropriate.
- Make action handling idempotent. Ignore duplicate event IDs.
- Do not trust client-submitted score or completion claims. Recompute/validate results in the authoritative host game engine and broadcast the result.
- Handle stale/out-of-order events and reconnect snapshots.
- Do not send Player A's private clue to Player B unless the game rules explicitly require it.
- Do not persist secrets or private room data in URLs or logs.
- Explain limitations of host authority: without a trusted backend, a modified host client can cheat. This is a casual private couple game, not a competitive ranked game.

## 10. Code quality and implementation constraints

- TypeScript strict mode. Avoid `any`; explain unavoidable exceptions.
- Keep game logic pure and unit-testable.
- Use small components and clear boundaries. Avoid overengineering and unnecessary abstractions.
- Do not add dependencies without a concrete reason.
- No fake buttons, dead links, placeholder interactions, or nonfunctional menus.
- Every visible control must work or be clearly disabled with an explanation.
- Add loading, empty, error, disconnected, reconnecting, and success states.
- Use semantic HTML, keyboard support, focus states, and accessible names.
- Keep all puzzle data deterministic and separate from presentation.
- No analytics, tracking, ads, payment, or external asset hotlinks.

## 11. Testing requirements

Add unit tests for:
- Every mini-game's valid and invalid solution.
- Maze movement boundaries and route validity.
- Shape placement validation.
- Scoring and star thresholds.
- XP and unlock progression.
- Duplicate completion/reward events.
- Protocol event validation and duplicate-event handling.
- Reconnection snapshot reconciliation.

Add integration/manual test instructions for:
- Two separate browsers/devices on different networks.
- Create room / join room / ready / start.
- Verify private clues differ and are not leaked.
- Simultaneous and out-of-order actions.
- One player refreshes or temporarily disconnects.
- Host disconnects and reconnects.
- Invalid room code and expired room.
- Narrow mobile viewport and touch interaction.
- Both clients show identical completion and progression.

Do not claim tests pass unless you actually run them. Report exact commands and results.

## 12. Definition of Done

MVP is done only when:
- Two people can connect from separate devices through the configured signaling transport.
- Both can enter the same private room and see correct presence/ready state.
- All five levels are playable from beginning to end.
- Each player receives only their intended clue view.
- Actions and game state synchronize reliably.
- Disconnect/reconnect does not silently corrupt the active level or shared progress.
- Both clients receive the same validated result.
- Stars, XP, and level unlocks work and persist locally.
- The UI is responsive, visually consistent with the supplied art direction, and has no dead controls.
- Tests and setup documentation are present.

## 13. Execution workflow

Work in small verified phases:
1. Repository assessment and docs.
2. Design tokens, app shell, responsive navigation, screen skeletons.
3. Room/lobby UI and signaling abstraction.
4. WebRTC connection and two-browser connection test.
5. Game engine and typed protocol.
6. Implement one complete mini-game and verify end-to-end multiplayer.
7. Implement remaining three mini-games and mixed final level.
8. Progression/rewards/local persistence.
9. Accessibility, responsive polish, reconnection, tests.
10. Final audit against Definition of Done.

After each phase:
- Run lint, typecheck, and relevant tests.
- Fix regressions before moving on.
- Update implementation docs.
- Summarize changed files, decisions, test commands/results, blockers, and next phase.

Do not stop after producing mockups. Deliver a working playable MVP. Do not pretend internet multiplayer is configured if signaling credentials or TURN infrastructure are missing; make the missing setup explicit and keep local development usable.
