# FORMA

**An AI-powered, cross-platform fitness companion with interactive 3D muscle biomechanics, computer-vision meal analytics, intelligent workout generation, and offline-first cloud sync.**

FORMA tracks training, nutrition, recovery, and performance for athletes who want their data to be legible and fast — on a phone mid-set, and on a desktop for analysis.

<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="FORMA logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vitedotjs&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Three.js-0.186-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Firebase-12-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Platforms-Web%20%7C%20iOS%20%7C%20Android%20%7C%20Desktop-blueviolet?style=for-the-badge" alt="Cross platform" />
</p>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [Security model](#security-model)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Cross-platform builds](#cross-platform-builds)
- [Scripts](#scripts)
- [Internationalization](#internationalization)
- [Known issues](#known-issues)
- [Contributing](#contributing)

---

## Overview

FORMA is a sports-science-backed training app built around three ideas:

1. **The in-session HUD comes first.** Logging a set must be possible one-handed, mid-workout, without navigating away or mis-tapping.
2. **Progress should be legible at a glance.** Recovery, macro budget, and training load are designed to be read in a second, not studied.
3. **Data belongs to the athlete.** Every user's records are isolated by Firestore security rules, with admin access gated on a cryptographically signed custom claim.

It ships as an installable PWA, native iOS and Android apps via Capacitor, and a desktop application via Electron.

---

## Features

### Training

- **One-thumb workout HUD** — large set checklist, fast numeric keypad with unit toggle, and a rest timer with real pause/resume.
- **AI workout generation** — personalised splits from Google Gemini, adapted for equipment, experience, and current recovery.
- **Program builder** — drag-to-reorder exercises and sets with full keyboard equivalents, optimistic saving, and visible unsaved state.
- **Live telemetry** — elapsed time, rest intervals, set volume, and estimated 1RM during training.
- **Exercise library** — 500+ movements with primary/secondary muscle attribution, form cues, and video references.
- **Load calculators** — barbell plate loading and progressive warm-up sets from a target working weight.

### Nutrition

- **Camera meal scanner** — photograph a plate for calorie and macro estimation via Gemini vision, with a review-and-correct step before logging.
- **Macro budget** — calories remaining as the hero number, with protein/carbs/fat as a single glanceable breakdown.
- **Barcode scanner** — scan packaged food for instant macro entry.
- **TDEE and macro targets** — BMR/TDEE from body composition, unit-aware entry (g/oz, kcal/kJ).
- **Hydration tracking** with daily targets.

### Performance and recovery

- **Athletic power radar** — multi-axis view of strength, consistency, volume capacity, recovery, and conditioning, each with a screen-reader equivalent.
- **Muscle recovery heatmap** — per-muscle fatigue estimated from training recency.
- **Progress charts** — volume, bodyweight, and estimated 1RM over time, with table fallbacks for every visualisation.

### 3D biomechanics

- **Interactive muscle hologram** — WebGL mesh highlighting agonists, antagonists, and synergists.
- **Motion simulator and 3D exercise viewer** with graceful non-WebGL and reduced-motion fallbacks.
- **Muscle map** — tap any muscle to see its role in a movement.

### Platform

- **8 themes** — dark, light, midnight, neon, ocean, forest, sunset, paper.
- **Bilingual English / Arabic with full RTL mirroring**, using logical CSS properties throughout.
- **Offline-first PWA** with service-worker precaching and stale-chunk recovery.
- **Accessibility** — reduced-motion honoured from both the OS and the in-app setting, focus-visible rings on interactive primitives, and keyboard paths for every drag interaction.
- **Density and motion preferences** applied via `data-density` / `data-motion` on the document root.

---

## Tech stack

| Domain | Choice |
| --- | --- |
| Core | React 18, TypeScript 5.5, Vite 5.4 |
| Styling & motion | Tailwind CSS v4, CSS custom-property design tokens, Framer Motion 13, Lucide React |
| 3D | Three.js 0.186 (WebGL) |
| AI | Google Gemini via `@google/genai`, proxied through Cloud Functions |
| Backend | Firebase 12 — Firestore, Authentication, Storage, Cloud Functions |
| Mobile | Capacitor 8 (iOS, Android) |
| Desktop | Electron 32 |
| PWA | `vite-plugin-pwa` with Workbox |
| Utilities | date-fns, clsx, tailwind-merge |

---

## Quick start

**Prerequisites:** Node.js 20+ (developed on 24.x) and npm 10+.

```bash
git clone https://github.com/AhmadEmad5/MyGym.git
cd MyGym
npm install
cp .env.example .env      # then fill in your values
npm run dev
```

The dev server runs on **http://localhost:1420** (not 5173 — the port is pinned in `vite.config.ts`).

---

## Environment configuration

Copy `.env.example` to `.env`. **`.env` is gitignored and must never be committed.**

```bash
# Firebase client config — from Console > Project Settings
# These are public-by-design: they are protected by Firestore rules, not by secrecy.
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""

# Admin identity — the EMAIL is public; the password is NOT used client-side.
# Admin authority is granted via a signed Firestore custom claim, not a client check.
VITE_ADMIN_EMAIL="admin@example.com"

# Gemini — SERVER SIDE ONLY. Never prefix a secret with VITE_.
# Set this as a Functions secret, not in the client .env:
#   firebase functions:secrets:set GEMINI_API_KEY
GEMINI_API_KEY=""
```

> **The `VITE_` prefix is not cosmetic.** Vite inlines every `VITE_`-prefixed variable into the shipped JavaScript bundle. Anything named that way is public the moment the app is deployed, regardless of `.gitignore`. See [Security model](#security-model).

---

## Security model

FORMA treats the client bundle as **fully public**. There is no secret in it.

**What is protected and how**

| Asset | Protection |
| --- | --- |
| User records (sessions, meals, routines, history, body metrics) | Firestore rules isolate by owner: `allow read, write: if isOwner(userId)` |
| Admin data access | A signed Firebase Auth custom claim — `request.auth.token.get('admin', false) == true`. Cannot be forged client-side. |
| Gemini API key | Held server-side in Cloud Functions; the client calls a callable function that authenticates the caller first. |
| Admin password | **Not used in the client at all.** Authentication is claim-based. |
| Firebase web config | Public by design; security comes from rules, not from hiding the key. |
| File uploads | Client-side size and MIME validation (`src/lib/fileValidation.ts`), plus Storage rules. |

**Rules of thumb for contributors**

- Never read a secret from `import.meta.env`. If it must be a secret, it does not belong in the client.
- Never compare passwords in the browser. Use Firebase Auth and claims.
- Never add a `VITE_` prefix to anything confidential.
- Verify after building:

  ```bash
  npm run build
  # then confirm your secret is not in the output
  grep -rl "YOUR_SECRET_VALUE" dist/assets/
  ```

- Response headers (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`) are set in `firebase.json` and applied on every deploy.

---

## Deployment

Deploy **hosting only** unless you intend to change rules or functions:

```bash
npm run build
firebase deploy --only hosting
```

Running a bare `firebase deploy` also pushes `firestore.rules`, `storage.rules`, and the Cloud Functions code. Those are production access-control rules — review them deliberately before deploying them.

A previous deployment can be restored with `firebase hosting:rollback`.

---

## Architecture

```
MyGym/
├── functions/                 # Cloud Functions — Gemini proxy, server-side secrets
├── src/
│   ├── app/                   # Routes, route metadata, app shell
│   ├── components/
│   │   ├── ui/                # Design-system primitives (Button, Card, Modal, Input…)
│   │   ├── primitives/        # Small single-purpose primitives
│   │   ├── layout/            # Page frame, route transitions, nav rail
│   │   ├── performance/       # Chart and table chrome, shared hooks
│   │   ├── routines/          # Program builder, schedule modal, calendar
│   │   ├── admin/             # Admin dashboard sub-components and data hook
│   │   └── mobile/            # Mobile-specific widgets
│   ├── context/               # React context providers
│   ├── hooks/                 # Shared hooks (useData, useAI, timers)
│   ├── lib/                   # Firebase, Gemini client, formatters, recovery math
│   ├── styles/                # Design tokens and feature stylesheets
│   ├── types/                 # Shared TypeScript types
│   └── views/                 # Top-level screens
├── electron/                  # Desktop main and preload
├── firestore.rules            # Production rules (RBAC + structural validation)
├── storage.rules              # Storage rules
├── firebase.json              # Hosting, headers, CSP
└── vite.config.ts             # PWA, code-splitting, dev server
```

**Design system.** Tokens live in `src/styles/design-tokens.css` and are consumed through `var()`. Themes redefine the token set rather than hardcoding colours. Use logical CSS properties (`margin-inline`, `inset-inline-start`, `padding-block`) so the Arabic RTL layout mirrors without special cases.

---

## Cross-platform builds

**PWA**
```bash
npm run build && npm run preview
```

**Desktop (Electron)**
```bash
npm run electron:dev     # Vite + Electron together
npm run electron:start   # Electron against an existing build
```

**Mobile (Capacitor)**
```bash
npm run build:mobile     # build + npx cap sync
npx cap open android     # Android Studio
npx cap open ios         # Xcode (macOS)
```

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR on port 1420 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Type-check and produce an optimised build in `dist/` |
| `npm run build:mobile` | Production build and Capacitor sync |
| `npm run cap:sync` | Sync web assets into the native projects |
| `npm run preview` | Serve the production build locally |
| `npm run electron:dev` | Vite and Electron together |
| `npm run electron:start` | Launch the desktop shell |

---

## Internationalization

English and Arabic, switchable at runtime and persisted per user. Switching sets `dir="rtl"` on the document root; because the layout is built on logical properties, mirroring is automatic. New UI must use logical properties and add strings to `src/lib/i18n.tsx` rather than inlining ternaries.

---

## Known issues

- **Multi-session programs lose sessions on save.** `Routine` has no `sessions` field, so only the first session of a program is persisted. The lossless converter (`draftToPredefinedRoutine`) exists but has nothing to write into. Fixing the write path alone would not be user-visible, because the read path would still return one session — this needs a `Routine` contract change.
- **Plate and warmup calculators are not wired in.** The components were removed as unreachable; if the calculators are wanted, they need a host in the session flow.
- **`--radius-*` is defined in two files** (`index.css` in `rem`, `design-tokens.css` in `px`). Import order decides the winner. Consolidate to one.

---

## Contributing

1. Branch from `main`.
2. Run `npm run typecheck` and `npm run build` before opening a PR.
3. Keep new UI on the design tokens — no hardcoded colours in components.
4. Honour reduced motion from both the OS media query and the in-app `data-motion` setting.
5. Never commit secrets, and never introduce a `VITE_`-prefixed secret.

---

## License

See [LICENSE](./LICENSE).
