# Asset Guide — Two Brains, One Heart

## 1. Visual Direction Summary

Source boards:
- `assets/01-primary-art-direction-board.png`
- `assets/02-game-ui-and-world-reference.png`
- `assets/03-gameplay-and-prop-reference.png`

### Palette Tokens
- **Ink / Outlines:** `#4A355A` (warm deep plum), secondary `#6D5880`
- **Cream & Surfaces:** `#FFFDF9`, `#FFF7F2`, `#F6F1FF`
- **Pastel Lavender / Periwinkle:** `#EDE5FF`, `#C7B6FF`, `#9B8CFF`, `#8FA8FF`
- **Baby Blue / Mint:** `#DFF3FF`, `#89C9FF`, `#D9F7EA`, `#6CD3AD`
- **Blush Pink / Coral Peach:** `#FFE3EC`, `#FF88A9`, `#FF6B93`, `#FFB396`, `#FF8F70`
- **Gold Star / Warm Accent:** `#FFE89E`, `#FFC94D`, `#F5A524`

### Typography & Surface Style
- Rounded, friendly display typography (`Fredoka` / `Nunito` style rounded sans-serif with safe system rounded fallbacks — loaded locally via system rounded fonts / clean CSS stack with zero external CDN runtime dependency risk, or self-hosted/system fallback so offline works 100%).
- Tactile pillowy cards (`rounded-3xl`), thick soft borders (`border-[3px] border-[#4A355A]/15` or plum accent borders), bottom-bevel kawaii buttons (`shadow-[0_4px_0_rgba(74,53,90,0.18)]`), gentle inner sheen, tiny sparkles/hearts that never obstruct interactive hit targets.

### Strict Board Usage Rules
- **Never** display an entire reference board as a background or UI screen.
- **Never** crop text labels or mockups from the boards.
- **Never** hotlink remote images.
- All UI controls, buttons, badges, and progress bars are clean React + CSS + inline/local SVG components.
- All local visual assets live under `public/assets/` with fallback rendering if an image fails to load.

---

## 2. Organized Local Asset Inventory (`public/assets/`)

### `public/assets/characters/`
- `character-a-idle.svg` — Canonical Character A (chibi boy: warm brown tousled hair, peach/coral T-shirt, navy shorts, simple sneakers, friendly expression).
- `character-a-happy.svg` — Character A cheering expression (happy closed-arc eyes, rosy cheeks, subtle sparkle).
- `character-b-idle.svg` — Canonical Character B (chibi girl: deep violet hair, lavender bow, pale lavender dress, simple shoes, friendly expression).
- `character-b-happy.svg` — Character B cheering expression (joyful wink/smile, rosy cheeks).
- `cosmetic-glasses.svg` — Overlay: round pastel cozy glasses.
- `cosmetic-cat-ears.svg` — Overlay: lavender plush cat-ear headband.
- `cosmetic-headphones.svg` — Overlay: periwinkle cloud headphones.
- `cosmetic-crown.svg` — Overlay: mini pastel gold heart crown.

### `public/assets/backgrounds/`
- `cozy-room-backdrop.svg` — Soft pastel sunlit living room backdrop inspired by Board 1 & Board 2 World 1 (pink sofa, potted plants, window sunlight, cozy rug), layered softly behind content with high text contrast.
- `pastel-sky-clouds.svg` — Fluffy lavender-and-blue cloud layer for title, lobby, and victory panels.

### `public/assets/props/`
- `cozy-sofa.svg` — Cute kawaii pink living room sofa prop for World 1 header/cards.
- `heart-chest.svg` — Locked/unlocked cozy heart treasure chest for Level 5 & completion celebration.
- `golden-key.svg` — Cozy chunky golden key prop for Lost Together & Secret Language.
- `potted-plant.svg` — Small smiling/leafy pastel plant prop for Cozy Room map tiles.
- `potion-moon-dew.svg`, `potion-sun-berry.svg`, `potion-star-dust.svg`, `potion-mint-leaf.svg`, `potion-rose-nectar.svg`, `potion-honey-drop.svg`, `potion-frost-plum.svg`, `potion-ember-spice.svg` — 8 distinct silhouette-differentiated alchemist potion bottles for Potion Lab.

### `public/assets/icons/`
- `logo-heart-emblem.svg` — Clean twin-brain / pastel heart crest (no baked text, paired with crisp accessible HTML/SVG title lockup).
- `star-filled.svg` / `star-empty.svg` — Chubby kawaii 5-point stars with warm plum outline.
- `heart-xp.svg` — Cozy pink heart badge for XP/duo meter.
- `minigame-memory.svg`, `minigame-secret.svg`, `minigame-lost.svg`, `minigame-shape.svg`, `minigame-mixed.svg` — Campaign Level 1–5 emblems.
- `minigame-rhythm.svg`, `minigame-power.svg`, `minigame-buttons.svg`, `minigame-potion.svg`, `minigame-mirror.svg`, `minigame-draw.svg`, `minigame-bridge.svg`, `minigame-balloon.svg` — Arcade Game 06–13 emblems.

### `public/assets/effects/`
- `sparkle-cluster.svg` — Pastel four-point stars and mini hearts for level complete / hover-free celebration bursts.

## 3. Fallback Policy
Every `AssetImage` component checks `onError` and switches seamlessly to an inline lightweight SVG badge or CSS pastel shape so missing or slow decorative images **never** crash a screen or block gameplay.
