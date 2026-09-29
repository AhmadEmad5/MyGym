<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="FORMA logo" />
</p>

<h1 align="center">FORMA</h1>

<p align="center">
  <strong>Training, nutrition, and recovery for athletes — one-thumb fast, on every screen you own.</strong>
</p>

<p align="center">
  <a href="https://mygym-ab892.web.app">
    <img src="https://img.shields.io/badge/live-myGym--forma-46d9ff?style=flat-square&labelColor=0b0f19" alt="Live app" />
  </a>
  <a href="https://github.com/AhmadEmad5/MyGym/actions/workflows/ci-security.yml">
    <img src="https://github.com/AhmadEmad5/MyGym/actions/workflows/ci-security.yml/badge.svg?style=flat-square&labelColor=0b0f19" alt="Build status" />
  </a>
  <img src="https://img.shields.io/github/license/AhmadEmad5/MyGym?style=flat-square&labelColor=0b0f19&color=c6f432" alt="MIT License" />
  <img src="https://img.shields.io/github/repo-size/AhmadEmad5/MyGym?style=flat-square&labelColor=0b0f19" alt="Repository size" />
  <img src="https://img.shields.io/github/last-commit/AhmadEmad5/MyGym?style=flat-square&labelColor=0b0f19" alt="Last commit" />
  <img src="https://img.shields.io/github/stars/AhmadEmad5/MyGym?style=flat-square&labelColor=0b0f19" alt="Stars" />
  <img src="https://img.shields.io/github/forks/AhmadEmad5/MyGym?style=flat-square&labelColor=0b0f19" alt="Forks" />
  <img src="https://img.shields.io/github/issues/AhmadEmad5/MyGym?style=flat-square&labelColor=0b0f19" alt="Open issues" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.5" />
  <img src="https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vitedotjs&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Tailwind-4.3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Firebase-12-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase 12" />
  <img src="https://img.shields.io/badge/Node-20-5FA04E?style=for-the-badge&logo=node.js&logoColor=white" alt="Node 20" />
</p>

<!--
  HERO SCREENSHOT / DEMO GIF PLACEHOLDER
  ---------------------------------------------------------------------------
  Drop a recording at docs/forma-demo.gif (or a still at docs/hero.png) and
  replace the block below. Keep it under ~4 MB — it is the first thing a
  visitor downloads.

  <p align="center">
    <img src="docs/forma-demo.gif" alt="FORMA session HUD logging a set" width="820" />
  </p>
-->

---

## Table of contents

- [What it is](#what-it-is)
- [Core features](#core-features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Usage and key workflows](#usage-and-key-workflows)
- [Configuration](#configuration)
- [Security model](#security-model)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Cross-platform builds](#cross-platform-builds)
- [Internationalization](#internationalization)
- [Project status](#project-status)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What it is

FORMA is a training log built around a single constraint: **the most important interaction happens mid-set, one-handed, while sweaty.** Everything else — the dashboards, the analytics, the 3D biomechanics — exists to make that interaction worth repeating.

It runs as an installable PWA, native iOS and Android apps, and a desktop application, all from one codebase.

**The problem it solves.** Most fitness trackers are designed for a desk. The set is the one moment that matters, and it happens on a phone held in one hand, mid-effort, in a loud room. Existing apps bury the "log this set" action behind navigation, small tap targets, and forms. FORMA inverts that: a persistent session HUD keeps set entry one thumb-tap away, reads at a glance, and survives offline.

### Design principles

| Principle | What it means in practice |
| --- | --- |
| **The session HUD comes first** | Logging a set never requires navigating away, and primary targets are reachable with a thumb. |
| **Legible at a glance** | Recovery, macro budget, and training load are designed to be read in a second, not studied. |
| **The data is yours** | Every record is isolated by Firestore rules. Admin authority is a signed token claim, not a client-side check. |
| **Motion is optional** | Every animation degrades under both the OS setting and the in-app preference. |

---

## Core features

### Athlete-facing

**Training**
- **One-thumb workout HUD** — large set checklist, a fast numeric keypad with a weight/reps unit toggle, and a rest timer with working pause and resume.
- **Gym floor mode** — oversized ±2.5 kg / ±1 rep thumb steppers, last-session reference for progressive overload, and a 60px one-thumb check-off that auto-advances.
- **Program builder** — drag-to-reorder exercises and sets, with full keyboard equivalents and a visible unsaved-changes state.
- **Multi-session programs** — push/pull/legs and upper/lower splits persist *every* session, not just the first, and are scheduled against the number of days they were built for.
- **Scheduling** — assign a program to days of the week, choosing this week or next, and replace conflicting sessions.
- **Live telemetry** — elapsed time, per-set volume, and estimated 1RM during a session.
- **Exercise library** — 28 movements with per-muscle attribution, form cues, and 3D biomechanics.
- **Smart swaps** — suggest a substitute movement when an exercise is unavailable.
- **Cardio and body metrics** — cardio timers with heart-rate input, plus body-weight and composition tracking.

**Nutrition**
- **Camera meal scanner** — photograph a plate for calorie and macro estimation, then review and correct before logging.
- **Barcode scanner** — scan packaged food for instant macro entry.
- **Macro budget** — calories remaining as the hero number, with protein, carbs, and fat as one glanceable breakdown.
- **TDEE and macro targets** — BMR and TDEE from body composition, with unit-aware entry (g/oz, kcal/kJ).
- **Hydration** with daily targets and a wave-fill widget.

**Performance and recovery**
- **Athletic power radar** — strength, consistency, volume capacity, recovery, and conditioning on one axis set.
- **Muscle recovery heatmap** — per-muscle fatigue estimated from training recency.
- **Progress charts** — volume, bodyweight, and estimated 1RM over time.
- **Adaptive plan and weekly coach digest** — weekly load adjustment surfaced as a callout.
- **Every chart has a text equivalent** — no visual is the only way to read the data.

**3D biomechanics**
- **Muscle hologram** — a WebGL mesh highlighting agonists, antagonists, and synergists.
- **Motion simulator and 3D viewer**, with graceful non-WebGL and reduced-motion fallbacks.
- **Interactive muscle map** — tap a muscle to see its role in a movement.

**Onboarding and personalization**
- **Five-step setup tour** — language and units, rest rhythm, training goal / level / equipment / weekly days, theme and density, then a summary.
- **Athlete profile** — `goal`, `level`, `equipment`, and `daysPerWeek` are captured once, stored under `settings.athlete`, and re-normalized on every read so a malformed stored value can never break a screen.

**Platform**
- **8 themes** — dark, light, midnight, neon, ocean, forest, sunset, paper.
- **English and Arabic** with full RTL mirroring, built on logical CSS properties.
- **Offline-first PWA** with service-worker precaching and stale-chunk recovery.
- **Reduced motion** honored from both the OS setting and the in-app preference.
- **Density and motion preferences** applied via `data-density` / `data-motion` on the document root.

### System capabilities

| Capability | Implementation |
| --- | --- |
| **Offline-first persistence** | Every write lands in a `localStorage` mirror first, then syncs to Firestore. The app is fully usable with no connection. |
| **Per-user data isolation** | Firestore rules scope every read and write to `request.auth.uid == userId`, with structural validation on every document. |
| **Signed admin authority** | Admin access is a Firebase Auth custom claim, not a password and not a client-side flag. |
| **Secret-free client bundle** | The Gemini key lives only in Cloud Functions. No `VITE_`-prefixed secret exists. |
| **Rate-limited AI relay** | The Gemini callable verifies the caller's ID token, enforces App Check, and applies per-minute, per-day, and payload-size limits with atomic quota reservation. |
| **Schema normalization** | `normalizeSettings` / `normalizeAthleteProfile` repair stored data on all three read paths, so legacy documents load without migration. |
| **Deploy-time security headers** | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, and a restrictive `Permissions-Policy` are set in `firebase.json`. |
| **Code splitting and chunk recovery** | Every view is lazy-loaded; a `ChunkLoadError` clears the service-worker cache and reloads once. |
| **CI gate** | Every push and PR runs `typecheck` and a production build. |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18.3, TypeScript 5.5, Vite 5.4, Tailwind CSS 4 |
| **UI / motion** | Framer Motion 13, Lucide icons, custom design-token CSS (no component library) |
| **Backend** | Node.js 20, Firebase Cloud Functions v2 (`firebase-functions` 6) |
| **Database** | Cloud Firestore — one root document per user (`/users/{uid}`) plus scoped subcollections: `sessions`, `routines`, `history`, `meals` |
| **Local cache** | `localStorage` mirror + Firestore persistent cache (IndexedDB) |
| **Auth** | Firebase Authentication — email/password, Google, Apple, and a local guest mode |
| **AI** | Google Gemini, reached only through the authenticated `generateGeminiContent` callable |
| **Native shells** | Capacitor 8 (Android, iOS) |
| **PWA** | `vite-plugin-pwa` with Workbox generateSW |
| **Hosting** | Firebase Hosting with SPA rewrites and cache-control headers |

**No relational database, no ORM, and no migration files.** See [Getting started](#4-migrations-and-seeds).

---

## Architecture

```
MyGym/
├── functions/                      # Cloud Functions (Node 20)
│   ├── src/index.ts                # generateGeminiContent — the only callable
│   └── .env.example                # server-side secrets, never VITE_*
│
├── src/
│   ├── app/                        # Route table, route metadata, AppShell
│   │   ├── routes.tsx              #   single source of truth for paths
│   │   └── AppShell.tsx            #   desktop nav / mobile dock / safe areas
│   ├── views/                      # Top-level screens (one per route, all lazy)
│   │   ├── LoginView.tsx           #   auth, guest mode, EN/AR
│   │   ├── TodayView.tsx           #   home hub
│   │   ├── SessionDetailView.tsx   #   the workout HUD
│   │   ├── RoutinesView.tsx        #   program library and builder
│   │   ├── CalendarView.tsx        #   scheduling
│   │   ├── NutritionView.tsx       #   meals and macros
│   │   ├── PerformanceHubView.tsx  #   charts, radar, recovery
│   │   ├── SettingsView.tsx        #   preferences, data import/export
│   │   └── AdminDashboard.tsx      #   guarded by the admin claim
│   │
│   ├── components/
│   │   ├── ui/                     # Design-system primitives (Button, Card, Modal, Input…)
│   │   ├── primitives/             # Small single-purpose primitives (MetricPair, EmptyState…)
│   │   ├── layout/                 # PageFrame, route transitions, nav rail, sheets
│   │   ├── routines/               # Program builder, set editor, scheduling
│   │   ├── performance/            # Chart/table chrome, shared reduced-motion hook
│   │   ├── admin/                  # Admin sub-components and their data hook
│   │   ├── mobile/                 # Gym-floor and mobile-specific widgets
│   │   └── OnboardingTour.tsx      # The 5-step first-run setup
│   │
│   ├── hooks/                      # useData (the store), useAI, timers, wake lock
│   ├── lib/                        # firebase, api (data layer), gemini client,
│   │   │                            #   selectors, formatters, recovery math, i18n
│   ├── styles/                     # design-tokens.css + per-feature stylesheets
│   ├── types/                      # Shared TypeScript types
│   └── App.tsx                     # Route table, guards, global overlays
│
├── android/  ios/                  # Capacitor native projects
├── scripts/                        # Icon generation
├── firestore.rules                 # RBAC + structural validation
├── storage.rules                   # Deny-all (no client uploads)
├── firebase.json                   # Hosting, cache headers, CSP
└── vite.config.ts                  # PWA, code splitting, dev server
```

### Layers

**Routing.** `src/app/routes.tsx` is the only place a path is defined. `App.tsx` maps it to a lazy view, and navigation reads the same table — so a new screen cannot be added in two places and drift.

**Data.** `src/lib/api.ts` is a single repository over two backends. Every mutation follows the same shape: validate, write to the `localStorage` mirror, then push to Firestore if a user is signed in. A failed cloud write is logged and swallowed — the local copy is already correct, so the UI never blocks on the network. `src/hooks/useData.tsx` wraps that repository in one React context, so screens read from a single store instead of fetching independently.

**Presentation.** `src/styles/design-tokens.css` defines the token set; components consume it through `var()` and never hardcode a colour. A theme redefines tokens — it does not fork components. Layout uses logical CSS properties (`margin-inline`, `inset-inline-start`, `padding-block`) so Arabic RTL mirrors without a second stylesheet.

**Security boundary.** Nothing in the client decides who is an admin or what a user may read. Firestore rules and the Auth custom claim decide that, server-side.

---

## Getting started

### Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| **Node.js** | 20 or newer | Developed on 24.x. `engines` is not pinned, so older Node will fail on the Vite 5 toolchain. |
| **npm** | 10 or newer | Ships with Node 20+. |
| **Firebase CLI** | latest | Only needed for deploys and the emulator — *not* for `npm run dev`. Install with `npm i -g firebase-tools`. |
| **Java** | 11 or newer | Only needed to run the Firestore emulator. |
| **Android Studio / Xcode** | — | Only for native builds. Xcode requires macOS. |

### 1. Clone the repository

```bash
git clone https://github.com/AhmadEmad5/MyGym.git
cd MyGym
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in the Firebase web config from **Firebase Console → Project settings → Your apps**:

```bash
# ── Firebase client config ────────────────────────────────────────────
# These are public by design: Firestore rules protect the data, not secrecy.
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_MEASUREMENT_ID=""          # optional, analytics only

# ── Admin identity ────────────────────────────────────────────────────
# Display fallback only. Grants no access.
VITE_ADMIN_EMAIL="admin@example.com"
```

> **The `VITE_` prefix is not cosmetic.** Vite **inlines every `VITE_`-prefixed variable into the shipped JavaScript**. Anything named that way becomes public the instant you deploy — `.gitignore` cannot stop it. If a value must stay secret, it must not carry this prefix.

> **`.env` is gitignored and must never be committed.**

The Gemini key is **not** configured here. It belongs to the backend — see [Deployment](#deployment).

### 4. Migrations and seeds

**There are none, and that is deliberate.** FORMA has no relational schema, so there is no `migrate` or `seed` command to run. The equivalent concerns are handled in code:

| Concern | How it is handled |
| --- | --- |
| Missing settings keys | `normalizeSettings()` fills them from `DEFAULT_SETTINGS` on every read. |
| Malformed athlete profile | `normalizeAthleteProfile()` repairs invalid enum values and clamps `daysPerWeek` to 1–7. |
| Pre-`sessions` routine documents | `Routine.sessions` is optional; the legacy single-session shape still loads. |
| Legacy monolithic user documents | `migrateLegacyDataIfNeeded()` runs once, automatically, on the first authenticated load, and rewrites the root document into subcollections. |

Data is created by using the app. Signing in as **guest** gives you a fully functional local account with no credentials.

### 5. Run the development server

```bash
npm run dev
```

Opens on **http://localhost:1420**.

> The port is `1420`, pinned in `vite.config.ts` — not Vite's default `5173`.

<details>
<summary>Without Firebase credentials</summary>

The app builds and runs without a working Firebase project. `src/lib/firebase.ts` validates the config at startup and falls back to local persistence when it is incomplete, so you can browse every screen, log a workout, and use the program builder. Sign-in, cloud sync, and AI features need real credentials.
</details>

---

## Usage and key workflows

### First run — set up your profile

1. Open the app and pick **Continue as guest athlete**, or sign in with email, Google, or Apple.
2. Complete the five-step setup tour:
   - **Step 1** — interface language (English/Arabic) and weight unit (kg/lb).
   - **Step 2** — default rest interval and whether alerts use sound, vibration, or both.
   - **Step 3** — your training **goal**, **experience level**, **equipment**, and **days per week**.
   - **Step 4** — theme, layout density, and motion preference.
   - **Step 5** — review the summary, then **Start training**.

   Every selection persists immediately, so leaving early keeps what you already chose. To replay the tour, clear the completion flag in devtools:

   ```js
   Object.keys(localStorage)
     .filter(k => k.includes('onboarding'))
     .forEach(k => localStorage.removeItem(k));
   ```

### Logging your first workout

1. Go to **Routines** and build a program, or tap the quick-start action on **Today**.
2. Open the session. The HUD appears with the first exercise's first set highlighted.
3. Adjust weight and reps with the thumb steppers, or open the **numeric keypad**.
4. Tap the large check-off to complete a set. The app advances to the next set and starts the rest timer automatically.
5. Rest ends with sound and vibration; tap to skip.
6. Finish the session to write it to history. Your streak, volume, and recovery heatmap update immediately.

### Building and scheduling a program

1. **Routines → New program**, then choose single-session or a multi-session split.
2. For a split, define each session and the number of days it requires.
3. Reorder exercises and sets by drag, or with the keyboard.
4. Save. Every session in the split is persisted, not just the first.
5. **Schedule** the program and pick the weekdays it lands on. Conflicting sessions are replaced with a confirmation.

### Tracking nutrition

- **Scan a meal** — photograph the plate, review the estimated calories and macros, correct anything, then log.
- **Scan a barcode** — for packaged food, for instant macro entry.
- **Set targets** — open the TDEE calculator, enter body composition, and get calorie and macro targets in your preferred units.
- **Log manually** — meals, cardio, and hydration all support manual entry.

### Using the AI features

> **Currently non-functional — see [Project status](#project-status).** The Gemini proxy is implemented and hardened, but two blockers must be resolved first.

The flow when unblocked: open the AI assistant, ask for a program or a meal analysis, and the client calls the `generateGeminiContent` callable. The function verifies your ID token, enforces App Check, reserves quota atomically, and returns the result. The key never reaches the browser.

---

## Configuration

Beyond `.env`, most behaviour is set at runtime in **Settings** and stored on the user document:

| Setting | Key | Notes |
| --- | --- | --- |
| Weight unit | `settings.weightUnit` | `kg` / `lb` — affects every display and input |
| Language | `settings.language` | `en` / `ar`, sets `dir` on the document root |
| Theme | `settings.theme` | One of eight token sets |
| Density | `settings.density` | `comfortable` / `compact` → `data-density` |
| Motion | `settings.motion` | `full` / `reduced` → `data-motion` |
| Rest timer | `settings.restTimerSeconds` | Default interval for new exercises |
| Alerts | `settings.soundAlerts`, `settings.vibrationAlerts` | Independently toggleable |
| Reminder | `settings.workoutReminderEnabled/Time` | Fires a local notification |
| Athlete profile | `settings.athlete` | `goal`, `level`, `equipment`, `daysPerWeek`, `onboardedAt` |

The server side reads `functions/.env` (or Secret Manager):

```bash
GEMINI_API_KEY=""            # firebase functions:secrets:set GEMINI_API_KEY
DAILY_FREE_AI_LIMIT=10        # per-user daily cap
MAX_AI_REQUESTS_PER_MINUTE=10 # burst guard, applies to every tier
MAX_IMAGE_BASE64_CHARS=800000 # ~600 KB; the app compresses to ~35-100 KB
ALLOWED_ORIGINS=""            # defence in depth; App Check is the real control
```

---

## Security model

The client bundle is treated as **fully public**. There is no secret in it.

### What is protected, and how

| Asset | Protection |
| --- | --- |
| User records — sessions, meals, routines, history, body metrics | Firestore rules scope every read and write to the owner: `isOwner(userId)` |
| Admin data access | A signed Firebase Auth custom claim: `request.auth.token.get('admin', false) == true`. Unforgeable client-side. |
| Admin password | **Not used in the client at all.** There is no password to steal from the bundle. |
| Gemini API key | Held server-side in Cloud Functions. The client calls an authenticated callable, which verifies the caller's ID token and enforces rate and payload limits. |
| Firebase web config | Public by design. Security comes from rules, not from hiding the key. |
| File uploads | Client-side size and MIME validation in `src/lib/fileValidation.ts`, plus deny-all Storage rules. |
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

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR on port 1420 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Type-check, then produce an optimised build in `dist/` |
| `npm run build:mobile` | Production build, then sync to the native projects |
| `npm run cap:sync` | Sync web assets into iOS and Android |
| `npm run preview` | Serve the production build locally |

Inside `functions/`:

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile the callable to `lib/` |
| `npm run lint` | `tsc --noEmit` |
| `npm run serve` | Build, then start the Functions emulator |
| `npm run deploy` | Deploy the backend |

---

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

**Use `--only hosting` unless you intend to change access control.** A bare `firebase deploy` also pushes `firestore.rules`, `storage.rules`, and the Functions source. Those are your production permission rules — review them deliberately.

To ship the AI features:

```bash
cd functions && npm install && cd ..
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

# Mobile
npm run build:mobile
npx cap open android    # Android Studio
npx cap open ios        # Xcode, macOS only
```

Capacitor uses `appId: com.forma.app` and serves from `dist/`, so a production web build is the single source for both native shells.

---

## Internationalization

English and Arabic, switchable at runtime and persisted per user. Switching sets `dir="rtl"` on the document root; because the layout uses logical properties, mirroring is automatic. Add new strings to `src/lib/i18n.tsx` rather than inlining ternaries, so the translation set stays complete. Component-local bilingual copy (such as the onboarding tour) keeps both languages in one typed object so a missing key is a compile error rather than a blank string.

---

## Project status

Known gaps, stated plainly. Everything here was verified against the current `main`.

| Area | Status |
| --- | --- |
| **Automated tests** | **None.** There is no test runner configured, no `*.test.*` or `*.spec.*` file, and no coverage. CI gates on typecheck and build only, so behavioural regressions ship silently. The highest-value gap in the project. |
| **AI features** | Two independent blockers. (1) `generateGeminiContent` is registered with `enforceAppCheck: true`, but the client never calls `initializeAppCheck`, so every deployed call is rejected with HTTP 401 before the handler runs. (2) Functions deployment requires the Blaze plan. The fix for (1) is documented in `functions/.env.example`. |
| **Athlete profile is write-only** | `settings.athlete` is collected, validated, and persisted, but nothing consumes it yet. The program builder, AI generator, and TDEE calculator still start from a blank slate, and Settings offers no editor for it. |
| **Empty first-run dashboard** | A new athlete finishes onboarding onto a Today screen of zeroes. `EmptyState` exists, but there is no first-week checklist and no "log your first set" call to action. |
| **Token duplication** | `--radius-*` is defined in both `index.css` (in `rem`) and `design-tokens.css` (in `px`). Cascade order decides the winner, and `design-tokens.css` also redefines the set internally. Worth consolidating. |
| **Plate and warmup calculators** | Removed as unreachable — no component imported them. The capability would need a host in the session flow. |

Multi-session program persistence, previously listed as broken, was fixed in `1cc36ca` — `Routine.sessions` now persists every session in a split.

---

## Roadmap

Ordered roughly by value. Everything is unchecked; nothing here is promised.

**Quality foundation**
- [ ] Add a test runner (Vitest) and cover the data layer: `normalizeSettings`, `normalizeAthleteProfile`, and the selectors
- [ ] Add Firestore rules tests against the emulator, so rule changes are verified in CI rather than by hand
- [ ] Add a first-run dashboard checklist that auto-completes as real state accumulates
- [ ] Consolidate the duplicated `--radius-*` tokens into a single source
- [ ] Add ESLint/Prettier and run them in CI alongside typecheck

**Make the profile matter**
- [ ] Seed the program builder from `settings.athlete` — goal and days determine the split
- [ ] Pre-fill the TDEE calculator and macro targets from the profile
- [ ] Pass the profile to the AI generator as prompt context
- [ ] Add a profile editor in Settings, mirroring the onboarding step
- [ ] Use `athlete.onboardedAt` to drive first-week and day-3/7 nudges

**Unblock AI**
- [ ] Initialise App Check in `src/lib/firebase.ts` to match `enforceAppCheck`
- [ ] Document the Blaze-plan requirement as a first-class setup step
- [ ] Add graceful UI state when the AI callable returns 401/429 instead of a generic error

**Product surface**
- [ ] Replace the PWA icon as `og:image` with a real 1200×630 share card
- [ ] Add a "how it works" visual strip to the login hero
- [ ] Wire `settings.athlete` into the adaptive plan and weekly coach digest
- [ ] Re-introduce plate and warmup calculators inside the session flow
- [ ] Add data export to JSON/CSV beyond the existing import

**Platform**
- [ ] Store and restore more UI state per device (active theme across browsers)
- [ ] Add Bluetooth heart-rate reconnection handling to the cardio flow
- [ ] Localise the admin dashboard (currently English-only)

---

## Contributing

Contributions are welcome. A few house rules keep the codebase coherent:

1. **Branch from `main`** and keep the change focused — one concern per PR.
2. **`npm run typecheck` and `npm run build` must pass.** CI runs both on every push and PR; it is the only automated gate.
3. **New UI uses design tokens.** No hardcoded colours in components — a theme redefines tokens, it does not fork components.
4. **Use logical CSS properties** (`margin-inline`, `inset-inline-start`, `padding-block`) so RTL works without a second layout.
5. **Honour reduced motion from both** the OS media query and the in-app `data-motion` setting.
6. **Never commit secrets**, and never introduce a `VITE_`-prefixed secret.
7. **Write tests.** The project has none today; the first test you add sets the pattern for the next one.
8. **If you change `firestore.rules`, say so in the PR body.** Those are production access-control rules and deserve a deliberate review.

### Reporting issues

Open an issue with what you did, what you expected, what happened, and your browser and platform. For anything security-related, please report it privately first rather than in a public issue.

### Pull requests

- Keep the diff readable; comments explaining *why* are welcome, comments narrating *what* are not.
- Update `README.md` if you change setup, scripts, or architecture.
- If you close an issue, reference it (`Closes #123`).

---

## License

MIT — see [LICENSE](./LICENSE).
