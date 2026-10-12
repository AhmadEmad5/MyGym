<div align="center">

  <img src="public/favicon.svg" width="96" height="96" alt="FORMA Logo" />

  # FORMA
  ### High-Performance Athletic Tracking, Gym Floor HUD & Biomechanical Recovery

  <p align="center">
    <strong>An engineered athletic operating system built for one-thumb mid-set speed, offline resilience, and scientific recovery analysis.</strong>
  </p>

  <p align="center">
    <a href="https://mygym-ab892.web.app"><img src="https://img.shields.io/badge/Live_App-forma--gym-06b6d4?style=for-the-badge&logo=firebase&logoColor=white&labelColor=0a0f1d" alt="Live App" /></a>
    <a href="https://github.com/AhmadEmad5/MyGym/actions"><img src="https://img.shields.io/badge/Test_Suite-277_Passing-10b981?style=for-the-badge&logo=vitest&logoColor=white&labelColor=0a0f1d" alt="Vitest Tests" /></a>
    <img src="https://img.shields.io/badge/Motion-60fps_Hardware_Accelerated-8b5cf6?style=for-the-badge&logo=framer&logoColor=white&labelColor=0a0f1d" alt="Motion" />
    <img src="https://img.shields.io/badge/License-MIT-c6f432?style=for-the-badge&labelColor=0a0f1d" alt="MIT License" />
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=black&labelColor=0a0f1d" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white&labelColor=0a0f1d" alt="TypeScript 5.5" />
    <img src="https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vitedotjs&logoColor=white&labelColor=0a0f1d" alt="Vite 5" />
    <img src="https://img.shields.io/badge/Tailwind-4.3-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=0a0f1d" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/Firebase-12-ffca28?style=flat-square&logo=firebase&logoColor=black&labelColor=0a0f1d" alt="Firebase 12" />
    <img src="https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white&labelColor=0a0f1d" alt="Capacitor 8" />
    <img src="https://img.shields.io/badge/PWA-Offline_First-10b981?style=flat-square&logo=pwa&logoColor=white&labelColor=0a0f1d" alt="PWA Ready" />
    <img src="https://img.shields.io/badge/i18n-English_%7C_Arabic_(RTL)-f59e0b?style=flat-square&labelColor=0a0f1d" alt="Bilingual Support" />
  </p>

</div>

---

## 📸 Production Interface

<div align="center">
  <h3>⚡ Desktop Flagship Dashboard & Active Training HUD</h3>
  <p><em>Desktop workout console featuring multi-layer background gradient glow, traveling border actions, and live session dials.</em></p>
  <img src="docs/screenshots/hero-today-desktop.png" alt="FORMA Today Desktop Interface" width="100%" />
</div>

<br />

<table>
  <tr>
    <td width="50%" align="center">
      <h3>🔄 3D Perspective Program Library</h3>
      <p><em>Interactive 3D routine carousel with mouse-tracked parallax tilt, depth falloff, and split configuration.</em></p>
      <img src="docs/screenshots/routines-3d-carousel.png" alt="Routines 3D Perspective Carousel" width="100%" />
    </td>
    <td width="50%" align="center">
      <h3>✨ Interactive Glowing Bento Grid</h3>
      <p><em>Cursor-following dynamic laser borders tracking daily volume, caloric deficit, target blueprint, and recovery readiness.</em></p>
      <img src="docs/screenshots/today-bento-glowing.png" alt="Interactive Glowing Bento Grid" width="100%" />
    </td>
  </tr>
</table>

<br />

<div align="center">
  <h3>📱 Mobile Gym Floor Ergonomics (&lt; 768px)</h3>
  <p><em>Engineered for one-handed operation mid-set: 60px tactile touch targets, floating rest timer, and ambient visual focus.</em></p>
  <img src="docs/screenshots/mobile-hero-workout.png" alt="FORMA Mobile Gym Floor Interface" width="400" />
</div>

---

## 📑 Contents

- [Architectural Philosophy](#-architectural-philosophy)
- [Design Engineering & Motion System](#-design-engineering--motion-system)
- [Core Capabilities](#-core-capabilities)
- [System Architecture](#-system-architecture)
- [Technical Stack](#-technical-stack)
- [Local Setup & Development](#-local-setup--development)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Data Security & Privacy](#-data-security--privacy)
- [Cross-Platform Builds](#-cross-platform-builds)
- [License](#-license)

---

## 🎯 Architectural Philosophy

Training apps frequently fail in real-world gym environments: complex hierarchies, tiny touch targets, and dependence on continuous network connectivity render them frustrating mid-set. 

**FORMA is engineered around four core requirements:**

1. **Sub-Second Input Velocity** — Logging a set requires zero screen transitions. Primary steppers (±2.5 kg, ±1 rep) and set completion checkboxes sit strictly inside natural thumb reach.
2. **Deterministic Offline Availability** — Reads and writes execute synchronously against an optimistic local data store before queuing background cloud synchronization. Workouts are never interrupted by poor gym cellular reception.
3. **High-Stress Visual Legibility** — Rest countdowns, target weights, and progression targets are rendered in high-contrast typographic hierarchy readable from two meters away on a gym bench.
4. **Hardware-Accelerated Motion with Accessibility Gates** — Visual feedback uses GPU-accelerated CSS transforms. All transitions strictly respect OS `prefers-reduced-motion` and user settings, falling back to instant state changes.

---

## 💎 Design Engineering & Motion System

FORMA's visual layer is built with custom design tokens and composable motion primitives:

| Component | Engineering Implementation |
| :--- | :--- |
| **`BackgroundGradient`** | High-performance multi-layer radial gradient mesh creating focused visual depth behind active training surfaces without repaints. |
| **`MovingBorderButton`** | SVG path-calculated beam progression around high-priority action triggers (*"Start workout"*, *"Quick workout"*). |
| **`GlowingEffect`** | Mouse-coordinated proximity lasers illuminating Bento Grid metric cards with semantic color themes (Emerald, Lime, Amber, Cyan). |
| **`3D Carousel`** | Program library presentation utilizing CSS 3D perspective transforms and cursor parallax coordinates with graceful touch fallbacks. |
| **`Meteors`** | Particle stream celebrating daily volume thresholds and workout completions. |
| **`Design Tokens Engine`** | 3-layer token hierarchy (Primitive → Semantic → Component) supporting 8 switchable atmospheric themes without inline style clutter. |

> [!NOTE]
> **Accessibility Compliance:** Touch targets maintain a minimum of 48×48 CSS pixels across mobile screens. High-contrast typography satisfies WCAG 2.2 AA ratios across both dark and light atmospheres.

---

## 🚀 Core Capabilities

### 🏋️ Gym Floor Workout HUD
- **One-Thumb Set Logging**: Quick set checklist with automated rest timer triggers and target volume previews.
- **Progressive Overload Telemetry**: Real-time display of previous session performance alongside current targets.
- **Tactile Weight & Rep Steppers**: Fast ±1.25 kg, ±2.5 kg, and ±5 kg adjustments without opening system keyboards.
- **Floating Rest Clock**: Glanceable Picture-in-Picture rest clock with audio and haptic alerts.
- **Split & Routine Engine**: Comprehensive workout splits (Push/Pull/Legs, Upper/Lower, Full Body) with drag-and-drop exercise reordering.

### 🥗 Nutrition & Metabolic Balance
- **Dynamic Energy Dial**: Real-time tracking of calories consumed, caloric expenditure, and remaining caloric targets.
- **Macronutrient Precision**: Independent daily tracking for protein, carbohydrate, and fat targets with grams-per-bodyweight benchmarks.
- **Hydration Tracking**: One-tap liquid intake logging with volume animation.
- **TDEE & Energy Calculation**: Accurate BMR/TDEE calculations utilizing Mifflin-St Jeor and Katch-McArdle models.

### 🧬 Biomechanics & Recovery Tracking
- **Muscle Fatigue Modeling**: Multi-day recovery decay curve based on total volume, intensity, and muscle group frequency.
- **Interactive Hologram**: Anatomical mapping of agonist, antagonist, and synergist muscle engagement.
- **Performance Radar**: 5-axis athletic metric chart evaluating strength, volume, conditioning, consistency, and recovery.

### 🌐 Universal Localization & Ergo Layout
- **Bilingual Internationalization**: Instant runtime switching between English and Arabic.
- **Zero-Drift RTL Layout**: Entire layout is built on CSS Logical Properties (`margin-inline`, `padding-block`, `inset-inline-start`) ensuring identical visual balance in LTR and RTL.
- **8 Curated Atmospheres**: Dark, Midnight, Light, Neon, Ocean, Forest, Sunset, and Paper.

---

## 🏛️ System Architecture

```
MyGym/
├── src/
│   ├── app/                        # Application bootstrap, routing & layout shell
│   ├── components/
│   │   ├── layout/                 # PageFrame, navigation docks, and sheets
│   │   ├── mobile/                 # GymFloorSetCard, MobileHeroWorkoutCard, steppers
│   │   ├── routines/               # 3D ProgramList, NewSessionDrawer, SplitLibrary
│   │   ├── ui/                     # Aceternity motion primitives (3d-card, carousel, glowing-effect)
│   │   └── TodayBentoGrid.tsx      # Daily vitals, energy balance, and readiness cards
│   ├── hooks/                      # useData (reactive store), timers, hardware listeners
│   ├── lib/                        # api.ts (storage layer & cloud sync), recovery models, i18n
│   ├── styles/                     # design-tokens.css, gym-floor.css, today.css
│   └── views/                      # Lazy-loaded views (Today, Routines, Calendar, Analytics)
├── functions/                      # Cloud Functions v2 backend endpoints
├── docs/screenshots/               # High-resolution production visual documentation
└── firestore.rules                 # User-isolated data security definitions
```

---

## 🛠️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18.3, TypeScript 5.5, Vite 5.4 |
| **Styling & CSS Architecture** | Tailwind CSS 4, Custom 3-Layer Design Token Engine |
| **Animation & Motion** | Aceternity UI, Motion 14, GSAP 3, WebGL Canvas |
| **Local Persistence** | Synchronous LocalStorage Mirror + IndexedDB offline cache |
| **Cloud Infrastructure** | Firebase Cloud Firestore, Authentication, Cloud Functions v2 |
| **Mobile Runtime** | Capacitor 8 (iOS & Android native container) |
| **Offline Engine** | Progressive Web App (`vite-plugin-pwa`) with Workbox caching |

---

## 💻 Local Setup & Development

### Prerequisites
- **Node.js**: `20.x` or newer
- **npm**: `10.x` or newer

### 1. Clone the repository
```bash
git clone https://github.com/AhmadEmad5/MyGym.git
cd MyGym
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration
```bash
cp .env.example .env
```
*(The application operates in complete **Guest Mode** locally without third-party credentials.)*

### 4. Launch development server
```bash
npm run dev
```
Navigate to **http://localhost:1420** in your browser *(port is configured in `vite.config.ts`)*.

---

## 🧪 Testing & Quality Assurance

The codebase enforces strict quality gates across component rendering, ergonomic accessibility, and data transformations:

```bash
# Execute test suite (277 tests)
npm test

# Verify TypeScript type contracts (0 errors)
npm run typecheck

# Validate production bundle compilation
npm run build
```

| Verification Category | Test Scope |
| :--- | :--- |
| **Design System Contracts** | Token variable validation, theme switching, dark/light contrast |
| **Ergonomic Shell** | Touch target dimensions (≥48px), viewport safe-area insets |
| **Biomechanical Logic** | Volume calculations, recovery half-life mathematics, streak tracking |
| **Data Synchronization** | Offline persistence fallback and optimistic update consistency |

---

## 🔒 Data Security & Privacy

- **User-Level Storage Isolation**: Firestore security rules restrict all record operations (`sessions`, `routines`, `history`, `meals`) strictly to `request.auth.uid == userId`.
- **Zero Third-Party Trackers**: No invasive tracking scripts, ads, or analytics pixels are bundled into the application.
- **Client Bundle Integrity**: Production bundles contain zero privileged API credentials or service account tokens.

---

## 📦 Cross-Platform Builds

```bash
# Production Web / PWA Build
npm run build
firebase deploy --only hosting

# Native Android Build (Capacitor)
npm run build:mobile
npx cap open android

# Native iOS Build (Capacitor)
npm run build:mobile
npx cap open ios
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [`LICENSE`](./LICENSE) file for details.

<div align="center">
  <sub>Designed and engineered for athletes who demand uncompromising precision.</sub>
</div>
