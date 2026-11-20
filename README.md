# Two Brains, One Heart — Cooperative Puzzle Adventure (MVP)

**Two minds. Different clues. One mission.**

A pure-frontend, mobile-first, two-player cooperative puzzle adventure built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, Zod, and WebRTC DataChannels — deployable directly to Vercel with zero database or backend required.

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

When running `npm run dev`, Vite includes a lightweight local signaling relay (`/__signal` via `vite-plugin-local-signal.ts`) so two separate browsers (e.g., Chrome + Safari, or a phone on the same Wi-Fi network) can pair with a 6-character code automatically.

### Scripts

- `npm run dev` — Start local dev server + `/__signal` local relay
- `npm run typecheck` — Run strict TypeScript check (`tsc -b --noEmit`)
- `npm run lint` — Run ESLint
- `npm test` — Run Vitest unit & component tests
- `npm run build` — Production TypeScript + Vite bundle

---

## Pure Frontend Deployment on Vercel (Zero Backend / Zero Supabase)

`vercel.json` is pre-configured for static Vite SPA deployment (`npm run build` → `dist/`).

1. Push to GitHub/GitLab/Bitbucket and import into **Vercel** (Framework Preset: **Vite**).
2. Click **Deploy** — **zero environment variables or database accounts are required**.

### How Two-Player Connections Work on Static Hosting
- **2 Devices (Direct P2P — Default on Vercel):**
  1. **Host** taps **Play • Create Room** → **Generate P2P Invite Code**, copies the `TBOH1:...` Invite Code, and sends it to their partner via chat.
  2. **Partner** opens the Vercel URL → **Join Partner's Room** → pastes the Invite Code → taps **Generate Reply Code**, and sends the `TBOH1:...` Reply Code back.
  3. **Host** pastes the Reply Code and taps **Connect Partner** → direct WebRTC `RTCDataChannel` connects for the entire session.
- **1 Browser (2 Tabs):** Switch the mode toggle to **1 Browser (2 Tabs)** to pair instantly via `BroadcastChannel` using a short 6-character room code.
- **NAT / Firewall Note:** Direct P2P uses public STUN servers (`stun.l.google.com:19302`) by default. If either player is on a restrictive corporate or symmetric mobile NAT that blocks direct P2P, you can optionally configure `VITE_ICE_SERVERS` with a TURN relay in Vercel Environment Variables.

---

## Project Documentation

- `docs/PROJECT_CONTEXT.md` — Repository snapshot, MVP scope, security/infrastructure boundaries
- `docs/GAME_DESIGN.md` — Core loop, canonical characters, 5 levels, scoring/XP/unlock rules
- `docs/ARCHITECTURE.md` — Directory structure, pure FE WebRTC/signaling adapters, Zod protocol v1
- `docs/ASSET_GUIDE.md` — Palette tokens and `public/assets/` inventory
- `docs/IMPLEMENTATION_PLAN.md` — Phased execution log
- `docs/TEST_PLAN.md` — Automated test matrix and two-browser verification checklist
