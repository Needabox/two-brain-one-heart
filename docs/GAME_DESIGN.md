# Game Design Document — Two Brains, One Heart

## 1. Core Loop

1. **Landing / Title:** Player sees the title badge, tagline (*"Two minds. Different clues. One mission."*), Play action, and How to Play / Settings.
2. **Room Setup:**
   - **Host (Player A)** clicks *Create Room*, enters a display name (optional default `"Player A"`), receives a 6-character uppercase room code (e.g., `HRT429` using unambiguous alphanumeric characters `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), and copies/shares it.
   - **Guest (Player B)** clicks *Join Room*, enters their display name and room code, and connects via the signaling provider + WebRTC DataChannel.
3. **Shared Lobby:**
   - Both players see the canonical pair, connection badges, display names, character choice (A or B) + unlocked cosmetic accessory picker, and independent **Ready** toggles.
   - Host selects an unlocked level in **World 1: The Cozy Room** (or opens the World/Level Select screen).
   - Game can only start when both players are connected and marked Ready.
4. **Asymmetric Mini-Game:**
   - Host sees Player A's private clue view; Guest sees Player B's private interactive view.
   - Players talk through their own call/voice channel and submit cooperative actions.
   - Host validates actions deterministically, syncs non-spoiling progress (`GAME_STATE_SNAPSHOT`), and evaluates win/mistake/hint/time states.
5. **Shared Result & Rewards:**
   - Both clients display the identical validated outcome (`LEVEL_COMPLETE` or `LEVEL_FAILED` / retry): stars earned (1–3), XP awarded, elapsed time, mistakes, hints used, and next-level unlock notification.
   - Actions: *Next Level*, *Replay*, or *Back to Lobby*.

---

## 2. Canonical Characters & Cosmetics

### Canonical Base Characters (Consistent Across Every Screen)
- **Character A (Chibi Boy):** Warm brown tousled hair (`#6B4432`), peach/coral T-shirt (`#FF9E85`), navy shorts (`#3B4675`), simple sky/navy sneakers, soft plum outline (`#4A355A`), rosy cheeks, warm friendly smile.
- **Character B (Chibi Girl):** Deep violet hair (`#4F3B78`), pastel lavender hair bow (`#D9C7FF`), pale lavender dress (`#DFD0FF`), white socks and soft purple shoes, matching plum outline and chibi proportions.

### Cosmetic Accessories (Purely Visual, Zero Gameplay Impact)
Unlocked progressively by total stars earned across World 1 (stored locally and reconciled across peers):
1. **None** (0★) — Classic canonical look.
2. **Round Cozy Glasses** (2★) — Soft periwinkle/gold wire round glasses.
3. **Pastel Cat Ears** (5★) — Lavender plush cat-ear headband.
4. **Cloud Headphones** (8★) — Pastel periwinkle/pink over-ear headphones.
5. **Tiny Heart Crown** (12★) — Golden pastel mini crown with a heart gem.

Accessories overlay cleanly above/around the head without changing hair shape, outfit colors, body proportions, or Character B's signature bow.

---

## 3. World 1: The Cozy Room — Level Breakdown

All 5 levels use deterministic, pre-validated puzzle data (zero unverified random generation).

### Level 1 — Memory Sync (Easy)
- **Learning Goal:** Practice quick verbal description and ordered recall.
- **Structure:** 2 sequential rounds (`Round 1`: 4 symbols; `Round 2`: 5 symbols) from a 6-symbol cozy set (`Star`, `Heart`, `Moon`, `Leaf`, `Cloud`, `Key`).
- **Player A View (Host):** Sees the target sequence during an **8-second preview countdown** per round, then the symbols hide behind mystery cards (preventing passive reading without memory, while still showing round count and `"Partner entered X / N"` status). Player A never sees or touches Player B's answer buttons.
- **Player B View (Guest):** Sees the 6 symbol buttons and empty sequence slots. Taps symbols to fill the sequence, can backspace/clear, and taps **Submit Sequence**.
- **Failure / Retry:** Wrong order increments `mistakes` by 1, shows shared gentle feedback (*"Not quite in order — previewing again!"*), clears B's slots, and gives A a fresh 6-second preview so the pair is never soft-locked.
- **Optional Hint:** Re-reveals the current round's sequence to Player A for 5 seconds (marks `hintsUsed += 1`, forfeiting 3-star eligibility).
- **Star Thresholds:**
  - 3★: `mistakes <= 0` AND `hintsUsed === 0` AND `time <= 75s`
  - 2★: `mistakes <= 2`
  - 1★: Completed

### Level 2 — Secret Language (Easy)
- **Learning Goal:** Cooperatively translate visual symbols using split information.
- **Structure:** 2 sequential code words:
  - Round 1 (4 letters): `COZY` encoded as `[Cloud, Moon, Star, Leaf]`
  - Round 2 (5 letters): `HEART` encoded as `[Heart, Key, Sun, Bell, Gem]`
- **Player A View (Host):** Sees ONLY the ordered coded symbol tiles (`? ? ? ?`) for the active round and round progress. Does NOT see the decoder key.
- **Player B View (Guest):** Sees a 12-symbol **Decoder Key** mapping 12 cozy symbols to 12 distinct letters (`A, C, E, H, K, L, M, O, R, S, T, Y, Z` — wait: exact 12-entry unique bijection covering all puzzle letters plus distractors so B cannot deduce the answer without A!), plus letter-tile slots and a tap keyboard of those 12 letters + Backspace + **Submit Word**.
- **Clue Isolation:** Decoder map contains 12 symbol→letter pairs and zero indication of which symbols or order appear in Player A's message. Player A never receives B's input choices mid-typing; only final submission triggers validation.
- **Optional Hint:** Reveals 1 correct letter slot in the current word (forfeits 3-star eligibility).
- **Star Thresholds:**
  - 3★: `mistakes === 0` AND `hintsUsed === 0` AND `time <= 90s`
  - 2★: `mistakes <= 2`
  - 1★: Completed

### Level 3 — Lost Together (Medium)
- **Learning Goal:** Spatial communication — one guides with a map, one navigates blind.
- **Structure:** Deterministic 7×7 Cozy Room maze with walls, start cell `(0, 6)`, a **Golden Key** pickup at `(5, 5)`, and the **Heart Door** goal at `(6, 0)` (solvable only after collecting the Golden Key; shortest path verified by BFS unit test).
- **Player A View (Host):** Sees the full 7×7 Cozy Room map (walls, furniture obstacles, Golden Key, Heart Door) and the partner avatar's live cell marker, plus directional labels (`Up / Down / Left / Right`) to help give instructions. Cannot move the avatar.
- **Player B View (Guest):** Sees ONLY a cozy **3×3 local spotlight** centered on the avatar (showing immediate open floor or wall adjacent cells, or bump indicator if hitting a wall — NEVER the full map or goal coordinates outside the 3×3 radius!), plus accessible 44px+ directional D-pad controls (and Arrow/WASD keyboard bindings), step count, key status, and a **Reset to Start** button.
- **Failure / Retry:** Attempting to walk into a wall or out of bounds increments `mistakes`, keeps avatar in place, and triggers a gentle `"Bump!"` cue on both screens.
- **Optional Hint:** Briefly highlights the next 2 optimal tiles toward the next objective (Key or Door) for Player A and flashes the next direction compass hint for Player B (forfeits 3-star eligibility).
- **Star Thresholds:**
  - 3★: `mistakes === 0` AND `hintsUsed === 0` AND `time <= 110s`
  - 2★: `mistakes <= 3`
  - 1★: Completed

### Level 4 — Shape It! (Medium)
- **Learning Goal:** Describe spatial orientation, shapes, colors, and grid coordinates together.
- **Structure:** 5×5 snap-to-grid Cozy Silhouette board. Target is a 12-cell **Cozy Cottage Heart** silhouette made from 4 distinct non-overlapping pastel polyomino pieces:
  - **Mint Square (`2×2`)** — 4 cells
  - **Sky Bar (`1×3`)** — 3 cells (rotatable horizontal/vertical)
  - **Coral L-Piece (`3 cells`)** — L corner (4 rotations)
  - **Lavender Corner (`2 cells` / `1×2` or `3-cell L` — let's keep total = 12 cells: e.g., `2×2` (4) + `1×3` (3) + `L-3` (3) + `1×2` (2) = 12 cells!)
- **Player A View (Host):** Sees the 5×5 target blueprint showing the silhouette outline and where each colored piece sits inside the target figure. Does NOT see B's piece tray or move pieces.
- **Player B View (Guest):** Sees an empty 5×5 snap grid, the 4 pieces in a piece tray, a **Rotate 90°** button for the selected piece, tap-a-cell-to-place (and tap-placed-piece-to-pick-up/remove) interaction, and **Check Blueprint** submit button.
- **Validation:** Verifies all 4 pieces are placed within `[0..4, 0..4]` bounds, zero overlap, and the placed colored cells match the target blueprint exactly (accounting for rotation symmetry of identical cells within a piece).
- **Optional Hint:** Snaps/ghosts 1 unplaced or misplaced piece into its exact target position on B's board (forfeits 3-star eligibility).
- **Star Thresholds:**
  - 3★: `mistakes === 0` AND `hintsUsed === 0` AND `time <= 120s`
  - 2★: `mistakes <= 2`
  - 1★: Completed

### Level 5 — Mixed Challenge: The Cozy Heart Chest (Hard)
- **Learning Goal:** Combine previously learned communication modes under rising stakes.
- **Structure:** Reuses `secretLanguageEngine` (Stage 1) and `lostTogetherEngine` (Stage 2) inside a unified two-stage finale:
  - **Stage 1 (Unlock the Whisper Lock):** Secret Language — decode the 5-letter passkey `SPARK` (`[Star, Leaf, Sun, Key, Gem]`) using a 12-symbol decoder key.
  - **Stage 2 (Navigate to the Heart Chest):** Lost Together — 7×7 Cozy Finale Labyrinth with Key at `(1, 1)` and Heart Chest at `(6, 6)` starting from `(0, 3)`.
- **Progression:** Mistakes, hints used, and timer accumulate seamlessly across Stage 1 → Stage 2.
- **Star Thresholds:**
  - 3★: `mistakes <= 1` AND `hintsUsed === 0` AND `time <= 165s`
  - 2★: `mistakes <= 4`
  - 1★: Completed

---

## 4. Scoring, XP, Unlocks & Progression Rules

### Star Rules
- **1 Star:** Level completed (`status === 'completed'`).
- **2 Stars:** Completed with `mistakes <= level.twoStarMaxMistakes`.
- **3 Stars:** Completed with `mistakes <= level.threeStarMaxMistakes` AND `elapsedMs <= level.threeStarMaxMs` AND `hintsUsed === 0`.
- Replaying a level **never reduces** existing stars (`bestStars = Math.max(prevStars, newStars)`).

### XP Rules
- Base completion XP (first clear): `100 XP` (Levels 1–2), `125 XP` (Levels 3–4), `175 XP` (Level 5).
- Star bonus XP on new star gain: `+25 XP` per newly earned star above previous best (`Math.max(0, newStars - prevStars) * 25`).
- Replay XP (if replaying an already-cleared level with no new stars): `+20 XP` cozy bonus so replaying still feels warm without creating a grind.
- **Idempotency:** Each completion broadcasts a unique `completionId` (UUID/eventId). Both clients store processed `completionIds` (bounded list) so duplicate network retries never grant XP twice.
- **Player Level Display:** Derived monotonically from total XP (`level = Math.floor(xp / 150) + 1`) — purely celebratory, never gates content.

### Level Unlock Rules
- Level 1 starts unlocked.
- Completing Level `k` (`stars >= 1`) unlocks Level `k + 1` (up to Level 5).

### Local Persistence & Peer Reconciliation
- Each browser stores its own `ProgressionState` (`xp`, `levelStars`, `unlockedLevelId`, `processedCompletionIds`, `selectedCosmetic`) in `localStorage`.
- When Host and Guest join a room and share `PLAYER_STATE`, room progression reconciles deterministically:
  - `reconciledLevelStars[id] = Math.max(hostStars[id], guestStars[id])`
  - `reconciledUnlockedLevel = Math.max(hostUnlocked, guestUnlocked)`
  - `reconciledXp = Math.max(hostXp, guestXp)`
- Both peers adopt the reconciled shared campaign unlock/best-star state during the session and save non-regressing improvements locally.

---

## 5. Arcade Mode — 8 New Co-op Mini-Games (Games 06–13)

Unlocked immediately alongside World 1 Campaign, selectable by the Host from **Arcade (8)** (`ArcadeSelectScreen`) across **Easy / Medium / Hard** difficulties and 6 filterable categories (`Memory`, `Logic`, `Coordination`, `Creativity`, `Timing`, `Spatial Reasoning`):

6. **Rhythm Duo (`Timing`):** Split complementary beat tracks (`patternA` vs `patternB`) over 3 rounds (4, 6, and 8 beats with rests/syncopation), drift-safe local round countdown anchors, `Perfect / Good / Miss` grading, Hint widened timing window, and Re-sync countdown.
7. **Power Connection (`Logic`):** 3×3 / 4×4 / 5×5 multi-branch circuit puzzles across 3 stages. Player A holds the target blueprint; Player B rotates wire tiles clockwise (`RESET_CIRCUIT`, `SUBMIT_CIRCUIT`) with algorithmic BFS connectivity & dangling-wire validation.
8. **Don't Press Together (`Logic`):** Asymmetric button control panels across 2 / 3 / 4 shared variables and 3 stages. Player A holds target goals + Switches; Player B holds color selector controls + Hazard Safety Manual (`forbidImmediatePartnerFollow` & prerequisite checks in Hard mode).
9. **Potion Lab (`Memory`):** 3 recipe rounds per difficulty (3, 4, and 5 ingredients against shelf decoys). Player A reads the ordered alchemist recipe with color & property cues; Player B adds/removes/clears bottles and brews with exact sequence validation.
10. **Mirror Moves (`Spatial Reasoning`):** Separate 4×4 / 5×5 / 6×6 twin boards across 3 stages with `hold-plate` / `hold-door`, `latch-switch` / `latch-door`, and `sync-pad` / `sync-door` mechanics. Touch D-pad + keyboard controls, simultaneous Goal requirement, and BFS solver Hint.
11. **Draw My Mind (`Creativity`):** Synchronized `320×240` HTML `<canvas>` (colors, brush sizes, eraser, clear, throttled batched strokes). Round 1 A draws & B guesses, alternating drawer/guesser roles every round across predefined word pools (`SUN`, `PENGUIN`, `DAYDREAM`, etc.), countdown timer + Hint letter reveals, and strict nulling of `secretWord` on the guessing client.
12. **Bridge Builder (`Spatial Reasoning`):** Deterministic cliff-to-cliff grid construction (3 / 5 / 7 pieces, rock obstacles, strict material inventory) checked via BFS port connectivity + blueprint structure match. Player A holds the blueprint; Player B places/rotates/removes `Deck`, `Ramp`, and `Truss` pieces.
13. **Balloon Rescue (`Coordination`):** Fixed-step deterministic sky arena (`100×60` world coordinates, `180ms` Host tick). Player A steers horizontal Left/Glide/Right; Player B fires vertical Rise/Hover/Sink burner through static & oscillating storm clouds with wind drift, countdown, collision reset, and Calm-Wind Hint.

Arcade completions award stars (`1–3★`), calculate scaled `score` (`calculateArcadeScore`), grant XP (`calculateXpAward`) + idempotent `completionId` tracking, and preserve `arcadeRecords` best stars/score/time without overwriting or altering Campaign `unlockedLevelId`.
