# Two Brains, One Heart — Cooperative Puzzle Adventure

**Two minds. Different clues. One mission.**

A pure-frontend, mobile-first, two-player cooperative puzzle adventure featuring **World 1 Campaign (5 levels)** and **Arcade Mode (8 distinct cooperative mini-games across Easy / Medium / Hard)** built with React, TypeScript, Vite, Tailwind CSS, Zod, PeerJS, and WebRTC DataChannels — deployable directly to Vercel with zero database or custom backend required.

### Included Game Modes (13 Total)
- **World 1 Campaign (*The Cozy Room*):** Memory Sync, Secret Language, Lost Together, Shape It!, Mixed Challenge.
- **Arcade Mode (8 Instant Co-op Mini-Games):** Rhythm Duo, Power Connection, Don't Press Together, Potion Lab, Mirror Moves, Draw My Mind, Bridge Builder, Balloon Rescue.

---

## Included Starter Kit Assets

- `assets/01-primary-art-direction-board.png` — primary visual direction, character pair, palette, logo and broad UI reference.
- `assets/02-game-ui-and-world-reference.png` — screen layouts, mini-game concepts, backgrounds, props, effects and UI reference.
- `assets/03-gameplay-and-prop-reference.png` — additional gameplay panels, tile/prop/icon references and environment concepts.
- `ANTIGRAVITY_PROMPT.md` — implementation brief and instructions.

### Important asset note

These PNGs are **visual reference boards**, not production-ready sprite sheets. They contain multiple elements in one image and some generated lettering/details may be imperfect. Do not display a whole board as a game screen, and do not assume every tiny element can be cropped cleanly. Use them as the source of truth for art direction. Recreate interface elements as React/CSS/SVG and create clean, isolated local assets where practical. Do not invent a different art style or redesign the character pair.

All isolated production SVG assets live in `public/assets/{characters,backgrounds,props,icons,effects}/` and are documented in `docs/ASSET_GUIDE.md`.

---

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

When running `npm run dev`, Vite includes a lightweight local signaling relay (`/__signal` via `vite-plugin-local-signal.ts`) so two separate browsers (e.g., Chrome + Safari, or a phone on the same Wi-Fi network) can pair with a 6-character code automatically, or switch to **Online 2 Devices (PeerJS)** to test over PeerJS Cloud.

### Scripts

- `npm run dev` — Start local dev server + `/__signal` local relay
- `npm run typecheck` — Run strict TypeScript check (`tsc -b --noEmit`)
- `npm run lint` — Run ESLint
- `npm test` — Run Vitest unit & component tests
- `npm run build` — Production TypeScript + Vite bundle

---

## Pure Frontend Deployment on Vercel (PeerJS Cloud)

`vercel.json` is pre-configured for static Vite SPA deployment (`npm run build` → `dist/`).

1. Push to GitHub/GitLab/Bitbucket and import into **Vercel** (Framework Preset: **Vite**).
2. Click **Deploy** — **zero backend servers, databases, or required environment variables**.

### How Two-Player Connections Work on Vercel
- **Online 2 Devices (PeerJS — Default on Vercel):**
  1. Host clicks **Play • Create Room** → **Generate Room Code** and shares the 6-character code (e.g., `HRT429`).
  2. Partner anywhere opens the Vercel URL → **Join Partner's Room** → enters the 6-character code → clicks **Join Cozy Room**.
  3. PeerJS Cloud (`0.peerjs.com`) brokers the initial WebRTC handshake, and all gameplay syncs over WebRTC `DataConnection`.
- **1 Browser (2 Tabs):** Toggle to **1 Browser (2 Tabs)** for instant offline testing across tabs in the same browser via `BroadcastChannel`.
- **NAT / Firewall Note:** Direct WebRTC uses public STUN (`stun.l.google.com:19302`, `stun.cloudflare.com:3478`). If restrictive cellular/corporate Symmetric NATs block direct P2P, optionally set `VITE_ICE_SERVERS` with a TURN server in Vercel Environment Variables (and/or `VITE_PEER_HOST` for a self-hosted PeerServer).

---

## Project Documentation

- `docs/PROJECT_CONTEXT.md` — Repository snapshot, MVP scope, security/infrastructure boundaries
- `docs/GAME_DESIGN.md` — Core loop, canonical characters, 5 levels, scoring/XP/unlock rules
- `docs/ARCHITECTURE.md` — Directory structure, PeerJS/WebRTC/Signaling adapters, Zod protocol v1
- `docs/ASSET_GUIDE.md` — Palette tokens and `public/assets/` inventory
- `docs/IMPLEMENTATION_PLAN.md` — Phased execution log
- `docs/TEST_PLAN.md` — Automated test matrix and two-browser verification checklist
