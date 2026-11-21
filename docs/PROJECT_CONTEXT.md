# Project Context — Two Brains, One Heart

## 1. Repository Assessment (Pre-Implementation Snapshot)

Inspected workspace root: `/Users/muhammadrafli/Coding/tailwind/two-brain-one-heart`.

### Existing Files
- `ANTIGRAVITY_PROMPT.md` — Master product, gameplay, visual, architecture, testing, and workflow specification.
- `README.md` — Starter kit overview and asset handling constraints.
- `assets/01-primary-art-direction-board.png` — Visual direction board (logo, character style, accessories, UI buttons/cards, mini-game thumbnails, backgrounds, rewards).
- `assets/02-game-ui-and-world-reference.png` — Screen flow concepts, character expressions, props, effects, and pastel UI components.
- `assets/03-gameplay-and-prop-reference.png` — Canonical character outfits (boy in peach/coral top + navy shorts; girl in lavender bow + lavender dress) and top-down cozy room/prop concepts.

### Existing Code / Tooling State
- No application source code (`src/`), `package.json`, `tsconfig.json`, build config, `.env`, or test suite existed at inspection time.
- No signaling credentials (e.g., Supabase URL/anon key) or TURN credentials exist in the repository.
- Local Node (`v23.11.0`) and npm (`10.9.2`) are available on the machine.

## 2. Product Definition

- **Title:** Two Brains, One Heart
- **Tagline:** Two minds. Different clues. One mission.
- **Genre:** Cooperative asymmetric puzzle adventure
- **Players:** Exactly 2 (paired in a private room via short room code)
- **Target Session:** 15–30 minutes across 5 short cooperative levels
- **Platform:** Mobile-first responsive web (360px minimum width), desktop supported
- **Tone:** Playful, cute, warm, funny, cooperative
- **Core Promise:** Each player receives different private information. Neither player can solve the puzzle alone; they must communicate verbally (outside the app via call/voice or sitting nearby) and coordinate actions in real time.

## 3. MVP Scope & Explicit Boundaries

### Included in Playable Build (13 Co-op Modes)
- **World 1 Campaign (*The Cozy Room*) — 5 Sequential Levels:**
  1. Memory Sync (Easy)
  2. Secret Language (Easy)
  3. Lost Together (Medium)
  4. Shape It! (Medium)
  5. Mixed Challenge (Hard — combines Secret Language + Lost Together)
- **Arcade Mode — 8 Asymmetric Mini-Games (Easy / Medium / Hard, Unlocked by Default):**
  6. Rhythm Duo (Timing)
  7. Power Connection (Logic)
  8. Don't Press Together (Logic)
  9. Potion Lab (Memory)
  10. Mirror Moves (Spatial Reasoning)
  11. Draw My Mind (Creativity)
  12. Bridge Builder (Spatial Reasoning)
  13. Balloon Rescue (Coordination)
- Private room creation & join via short room code, lobby with Ready toggles, host Campaign & Arcade launcher, and connection status indicators.
- Real-time P2P multiplayer synchronization over WebRTC `RTCDataChannel` with 100% pure frontend options:
  - Cross-device pure static hosting (Vercel): `PeerJSTransport` using PeerJS Cloud (`0.peerjs.com`) WebSocket brokering for 6-character room codes across separate devices — zero custom backend, zero database, zero Supabase.
  - Same-browser two-tab play: `BroadcastChannelSignalingProvider`.
  - Local development: `LocalDevHttpSignalingProvider` (Vite dev server SSE+POST relay for cross-browser / LAN testing with zero external credentials).
- Shared progression: 1–3 stars per Campaign level & Arcade best records (stars, score, fastest time, completions), shared XP, sequential Campaign unlocks, replay without star loss, and idempotent reward grants.
- Canonical character selection (Character A and Character B) plus 4 unlockable visual cosmetic accessories that do not alter gameplay or base character design.
- Reconnection handling (heartbeat ping/pong, disconnect banner, `RECONNECT_REQUEST` / `RECONNECT_ACCEPTED` + `GAME_STATE_SNAPSHOT` state recovery).
- LocalStorage persistence per device with deterministic peer reconciliation.
- Full unit test suite + manual/two-browser verification guide.

### Explicitly Out of MVP
- Worlds 2–5 (Whispering Forest, Bubble Bay, Cloud Kingdom, Heart Castle) and 25-level campaign.
- Daily challenges, room decoration editor, full achievement catalog, shops, currencies, ads, paywalls, lives/energy systems.
- In-app voice or video chat.
- User accounts, OAuth, cloud databases, analytics/tracking.
- Board-game / dice / trading / Monopoly-style mechanics.

## 4. Infrastructure & Security Constraints

1. **No Secret Hardcoding:** Never embed API keys, service-role keys, or TURN secrets in code or URLs.
2. **Signaling & NAT Reality:** WebRTC requires signaling to exchange SDP offers/answers and ICE candidates, plus STUN/TURN for reliable traversal across restrictive NATs/cellular networks. We must explicitly surface which signaling adapter is active and document the env vars needed for internet deployment rather than claiming zero-infra internet reliability.
3. **Clue Isolation:** Player A's private clues (sequences, cipher text, full maze map, target shape blueprint) must never be transmitted to Player B's client.
4. **Host Authority Trade-off:** Without a central authoritative game server, the Host client validates puzzle rules and computes shared results. A modified host browser could tamper locally, which is an acceptable boundary for a private couple co-op game and is documented clearly.
