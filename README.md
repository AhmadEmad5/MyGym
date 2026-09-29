<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="FORMA logo" />
</p>

<h1 align="center">FORMA</h1>

<p align="center">
  <strong>Training, nutrition, and recovery for athletes — one-thumb fast, on every screen you own.</strong>
</p>

<p align="center">
  <a href="https://mygym-ab892.web.app"><img src="https://img.shields.io/badge/live-myGym--forma-46d9ff?style=flat-square&labelColor=0b0f19" alt="Live app" /></a>
  <img src="https://img.shields.io/badge/license-MIT-c6f432?style=flat-square&labelColor=0b0f19" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&labelColor=0b0f19" alt="TypeScript strict" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vitedotjs&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-4.3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Three.js-0.186-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Firebase-12-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
</p>

---

## What it is

FORMA is a training log built around a single constraint: **the most important interaction happens mid-set, one-handed, while sweaty.** Everything else — the dashboards, the analytics, the 3D biomechanics — exists to make that interaction worth repeating.

It runs as an installable PWA, native iOS and Android apps, and a desktop application, all from one codebase.

### Design principles

| Principle | What it means in practice |
| --- | --- |
| **The session HUD comes first** | Logging a set never requires navigating away, and primary targets are reachable with a thumb. |
| **Legible at a glance** | Recovery, macro budget, and training load are designed to be read in a second, not studied. |
| **The data is yours** | Every record is isolated by Firestore rules. Admin authority is a signed token claim, not a client-side check. |
| **Motion is optional** | Every animation degrades under both the OS setting and the in-app preference. |

---

## Quick start

Requires **Node.js 20+** (developed on 24.x) and **npm 10+**.

```bash
git clone https://github.com/AhmadEmad5/MyGym.git
cd MyGym
npm install
cp .env.example .env          # fill in Firebase config — see Configuration
npm run dev
```

Opens on **http://localhost:1420**.

> The port is `1420`, pinned in `vite.config.ts` — not Vite's default `5173`.

<details>
<summary>Without Firebase credentials</summary>

The app builds and runs without a working Firebase project. It falls back to local persistence, so you can browse every screen, log a workout, and use the program builder. Sign-in, sync, and AI features require real credentials.
</details>

---

## Features

### Training

- **One-thumb workout HUD** — large set checklist, a fast numeric keypad with a weight/reps unit toggle, and a rest timer with working pause and resume.
- **Program builder** — drag-to-reorder exercises and sets, with full keyboard equivalents and a visible unsaved-changes state.
- **Scheduling** — assign a program to days of the week, choosing this week or next, and replace conflicting sessions.
- **Live telemetry** — elapsed time, per-set volume, and estimated 1RM during a session.
- **Exercise library** — 28 movements with per-muscle attribution, form cues, and 3D biomechanics.
- **Smart swaps** — suggest a substitute movement when an exercise is unavailable.

### Nutrition

- **Camera meal scanner** — photograph a plate for calorie and macro estimation, then review and correct before logging.
- **Macro budget** — calories remaining as the hero number, with protein, carbs, and fat as one glanceable breakdown.
- **Barcode scanner** — scan packaged food for instant macro entry.
- **TDEE and macro targets** — BMR and TDEE from body composition, with unit-aware entry (g/oz, kcal/kJ).
- **Hydration** with daily targets.

### Performance and recovery

- **Athletic power radar** — strength, consistency, volume capacity, recovery, and conditioning on one axis set.
- **Muscle recovery heatmap** — per-muscle fatigue estimated from training recency.
- **Progress charts** — volume, bodyweight, and estimated 1RM over time.
- **Every chart has a text equivalent** — no visual is the only way to read the data.

### 3D biomechanics

- **Muscle hologram** — a WebGL mesh highlighting agonists, antagonists, and synergists.
- **Motion simulator and 3D viewer**, with graceful non-WebGL and reduced-motion fallbacks.
- **Interactive muscle map** — tap a muscle to see its role in a movement.

### Platform

- **8 themes** — dark, light, midnight, neon, ocean, forest, sunset, paper.
- **English and Arabic** with full RTL mirroring, built on logical CSS properties.
- **Offline-first PWA** with service-worker precaching and stale-chunk recovery.
- **Reduced motion** honored from both the OS setting and the in-app preference.
- **Density and motion preferences** applied via `data-density` / `data-motion` on the document root.

---

## Configuration

Copy `.env.example` to `.env`. **`.env` is gitignored and must never be committed.**

```bash
# ── Firebase client config ────────────────────────────────────────────
# From Console → Project Settings → Your apps.
# These are public by design: Firestore rules protect the data, not secrecy.
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""

# ── Admin identity ────────────────────────────────────────────────────
# Display only. Grants no access — see "Granting admin access" below.
VITE_ADMIN_EMAIL="admin@example.com"

# ── Gemini (server-side only) ─────────────────────────────────────────
# Set as a Cloud Functions secret, NOT in the client .env:
#   firebase functions:secrets:set GEMINI_API_KEY
GEMINI_API_KEY=""
```

> ### ⚠️ The `VITE_` prefix is not cosmetic
>
> Vite **inlines every `VITE_`-prefixed variable into the shipped JavaScript**. Anything named that way becomes public the instant the app is deployed — `.gitignore` cannot stop it. If a value must stay secret, it must not carry this prefix.
>
> Both `VITE_ADMIN_PASSWORD` and `VITE_GEMINI_API_KEY` were once shipped this way. Both are gone; see [Security model](#security-model).

---

## Security model

The client bundle is treated as **fully public**. There is no secret in it.

### What is protected, and how

| Asset | Protection |
| --- | --- |
| User records — sessions, meals, routines, history, body metrics | Firestore rules scope every read and write to the owner: `isOwner(userId)` |
| Admin data access | A signed Firebase Auth custom claim: `request.auth.token.get('admin', false) == true`. Unforgeable client-side. |
| Admin password | **Not used in the client at all.** There is no password to steal from the bundle. |
| Gemini API key | Held server-side in Cloud Functions. The client calls an authenticated callable function, which verifies the caller's ID token and enforces per-minute and payload limits. |
| Firebase web config | Public by design. Security comes from rules, not from hiding the key. |
| File uploads | Client-side size and MIME validation in `src/lib/fileValidation.ts`, plus Storage rules. |
| Login responses | Every wrong-credential path returns one identical generic error, so no response reveals whether an account exists. |

### Granting admin access

Admin authority is a claim, not a password. Grant it once with the Admin SDK:

```js
import { getAuth } from 'firebase-admin/auth';

await getAuth().setCustomUserClaims(uid, { admin: true });
```

Requires `GOOGLE_APPLICATION_CREDENTIALS` pointing at a service account key. The user must sign out and back in for the claim to appear in their ID token.

### Rules for contributors

- **Never** read a secret from `import.meta.env`. If it must be secret, it does not belong in the client.
- **Never** compare passwords in the browser. Use Firebase Auth and claims.
- **Never** prefix anything confidential with `VITE_`.
- **Verify after every build:**

  ```bash
  npm run build
  grep -rl "YOUR_SECRET_VALUE" dist/     # must return nothing
  ```

Response headers — CSP, HSTS, `X-Frame-Options`, `Permissions-Policy` — are defined in `firebase.json` and applied on each deploy.

---

## Architecture

```
MyGym/
├── functions/                  # Cloud Functions — Gemini proxy, server-side secrets
│   └── src/index.ts            # generateGeminiContent (auth'd callable)
├── src/
│   ├── app/                    # Routes, route metadata, app shell
│   ├── components/
│   │   ├── ui/                 # Design-system primitives (Button, Card, Modal, Input…)
│   │   ├── primitives/         # Small single-purpose primitives
│   │   ├── layout/             # Page frame, route transitions, nav rail
│   │   ├── performance/        # Chart and table chrome, shared hooks
│   │   ├── routines/           # Program builder, scheduling, calendar
│   │   ├── admin/              # Admin dashboard sub-components and data hook
│   │   └── mobile/             # Mobile-specific widgets
│   ├── hooks/                  # Shared hooks (useData, useAI, timers)
│   ├── lib/                    # Firebase, Gemini client, formatters, recovery math
│   ├── styles/                 # Design tokens and feature stylesheets
│   ├── types/                  # Shared TypeScript types
│   └── views/                  # Top-level screens
├── electron/                   # Desktop main and preload
├── firestore.rules              # Production rules (RBAC + structural validation)
├── storage.rules                # Storage rules
├── firebase.json                # Hosting, headers, CSP
└── vite.config.ts              # PWA, code splitting, dev server
```

**Design system.** Tokens live in `src/styles/design-tokens.css` and are consumed through `var()`. A theme redefines the token set — components never hardcode colour. Use logical CSS properties (`margin-inline`, `inset-inline-start`, `padding-block`) so Arabic RTL mirrors without special cases.

**State.** A single `useData` context owns the athlete's records and the mutations on them. Screens read from it rather than fetching independently.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR on port 1420 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Type-check, then produce an optimised build in `dist/` |
| `npm run build:mobile` | Production build, then sync to the native projects |
| `npm run cap:sync` | Sync web assets into iOS and Android |
| `npm run preview` | Serve the production build locally |
| `npm run electron:dev` | Vite and Electron together |
| `npm run electron:start` | Launch the desktop shell against a build |

---

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

**Use `--only hosting` unless you intend to change access control.** A bare `firebase deploy` also pushes `firestore.rules`, `storage.rules`, and the Functions source. Those are your production permission rules — review them deliberately.

To ship the AI features, deploy the backend as well:

```bash
firebase functions:secrets:set GEMINI_API_KEY   # required first
firebase deploy --only functions,hosting
```

Cloud Functions require the **Blaze (pay-as-you-go) plan**. On the free Spark plan this fails on billing, not code — hosting still deploys normally, and only the AI features are unavailable.

A previous deployment can be restored with `firebase hosting:rollback`.

---

## Cross-platform builds

```bash
# PWA
npm run build && npm run preview

# Desktop
npm run electron:dev
npm run electron:start

# Mobile
npm run build:mobile
npx cap open android    # Android Studio
npx cap open ios        # Xcode, macOS only
```

---

## Internationalization

English and Arabic, switchable at runtime and persisted per user. Switching sets `dir="rtl"` on the document root; because the layout uses logical properties, mirroring is automatic. Add new strings to `src/lib/i18n.tsx` rather than inlining ternaries, so the translation set stays complete.

---

## Project status

Known gaps, stated plainly:

| Area | Status |
| --- | --- |
| **Multi-session programs** | Saving a program persists only its first session. `Routine` has no `sessions` field, so there is nowhere to write the rest. Fixing the write path alone would not help — the read path would still return one session. Needs a `Routine` contract change. |
| **AI features** | The Gemini proxy is implemented, hardened, and committed, but the project is on the Firebase **Spark** plan, so the function cannot be deployed. AI is non-functional in production until the plan is upgraded. |
| **Plate and warmup calculators** | Removed as unreachable — no component imported them. The capability would need a host in the session flow. |
| **Token duplication** | `--radius-*` is defined in both `index.css` (`rem`) and `design-tokens.css` (`px`); import order decides the winner. Worth consolidating. |

---

## Contributing

1. Branch from `main`.
2. `npm run typecheck` and `npm run build` must pass before opening a PR.
3. New UI uses design tokens — no hardcoded colours in components.
4. Honour reduced motion from **both** the OS media query and the in-app `data-motion` setting.
5. Never commit secrets, and never introduce a `VITE_`-prefixed secret.
6. Prefer logical CSS properties so RTL works without a second layout.

---

## License

MIT — see [LICENSE](./LICENSE).
