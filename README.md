# FORMA ⚡ Next-Gen Fitness, Bodybuilding & Nutrition Platform

<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="FORMA Logo" />
</p>

<p align="center">
  <strong>An AI-powered, cross-platform fitness companion with interactive 3D muscle biomechanics, computer vision meal analytics, intelligent workout generation, and offline-first cloud synchronization.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Three.js-0.186-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.0-orange?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Firebase-v12-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Platforms-Web_|_iOS_|_Android_|_Desktop-blueviolet?style=for-the-badge" alt="Cross Platform" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Security & DevSecOps Hardening](#-security--devsecops-hardening)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [Environment Configuration](#-environment-configuration)
- [Cross-Platform Builds](#-cross-platform-builds)
- [Available Scripts](#-available-scripts)
- [Internationalization (i18n & RTL)](#-internationalization-i18n--rtl)

---

## ⚡ Overview

**FORMA** (formerly *MyGym*) is a high-performance, sports-science backed fitness application engineered for athletes, bodybuilders, and fitness enthusiasts. It bridges real-time exercise telemetry with advanced generative AI and 3D computer graphics to deliver:

1. **Intelligent Hypertrophy & Strength Workouts**: Adaptive split routines customized by experience, recovery state, and available equipment.
2. **Biomechanical 3D Visualizer**: Real-time 3D muscle activation holograms powered by Three.js and WebGL.
3. **AI Vision Nutrition**: Real-time camera food identification and macronutrient breakdown utilizing Google Gemini Multimodal Vision.
4. **Unified Cross-Platform Experience**: Runs identically as a Progressive Web App (PWA), native iOS/Android mobile apps via Capacitor, and native desktop executables via Electron.

---

## ✨ Key Features

### 🏋️‍♂️ Smart Workout Engine & Live HUD
- **AI Workout Generator**: Generate comprehensive personalized routines in seconds powered by Google Gemini.
- **Dynamic Live Workout Bar**: Tracks elapsed time, rest intervals, active set telemetry, and 1RM estimations during training.
- **Exercise Library & 3D Motion Guides**: 500+ curated movements with primary/secondary muscle highlights, step-by-step form cues, and video references.
- **Warmup & Plate Calculators**: Automated barbell load calculations and progressive warm-up sets based on target working weights.

### 🥩 AI Meal Vision & Nutrition Tracking
- **Multimodal Meal Scanner**: Take a picture of your plate to detect food items, estimated gram weights, and calories/protein/carbs/fat ratios.
- **TDEE & Macro Architect**: Calculates Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on body composition.
- **Hydration Wave Card**: Interactive water tracking with animated hydration levels and smart daily targets.

### 🧬 Recovery, Biomechanics & 3D Anatomy
- **Interactive 3D Muscle Hologram**: Interactive WebGL mesh viewer highlighting agonist, antagonist, and synergist muscles.
- **Muscle Recovery Heatmap**: Muscle fatigue tracking that estimates systemic and localized recovery status based on training recency.
- **Athletic Power Radar**: Multi-axis performance chart mapping strength, consistency, volume capacity, recovery, and metabolic conditioning.

### 🎵 In-App Gym Audio & Workout Music Player
- **Integrated Music Widget**: Built-in workout soundscapes and ambient gym tracks with zero background disruption.
- **Local Audio Uploads**: Add personal audio files with safe client-side validation and responsive media playback controls.
- **Haptic Audio Feedback**: Synthesized cues and sound effects for rest-timer completions and workout milestones.

### 🌐 Dual-Language Support (English & Arabic RTL)
- Seamless dynamic switching between **English (LTR)** and **Arabic (RTL)** with layout flipping and localized typography.

---

## 🛠️ Technology Stack

| Domain | Frameworks & Libraries |
| :--- | :--- |
| **Core Frontend** | [React 18](https://react.dev/), [TypeScript 5.5](https://www.typescriptlang.org/), [Vite 5.4](https://vitejs.dev/) |
| **Styling & Motion** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion 13](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **3D Rendering & Canvas** | [Three.js](https://threejs.org/) (WebGL rendering, materials, orbital controls) |
| **AI & Multimodal Intelligence**| [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini API: Multimodal Vision, Structured JSON) |
| **Backend & Realtime Data** | [Firebase v12](https://firebase.google.com/) (Cloud Firestore, Firebase Authentication, Firebase Hosting) |
| **Mobile Runtime** | [Capacitor 8](https://capacitorjs.com/) (iOS & Android native bindings, native storage, haptics) |
| **Desktop Runtime** | [Electron 32](https://www.electronjs.org/) (Windows/macOS native window container) |
| **Offline & PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/), Workbox Service Worker caching |
| **Data & Date Utilities** | [date-fns](https://date-fns.org/), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge) |

---

## 📂 Architecture & Folder Structure

```
MyGym/
├── .github/
│   └── workflows/
│       └── ci-security.yml       # Automated GitHub Actions type-check & build gate
├── android/                      # Native Android project generated by Capacitor
├── ios/                          # Native iOS project generated by Capacitor
├── electron/
│   ├── main.js                   # Electron main process lifecycle & native window
│   └── preload.js                # Context bridge & secure IPC handlers
├── public/                       # Static public assets (3D GLTF models, audio, icons)
│   ├── models/                   # 3D anatomy and muscle meshes
│   ├── music/                    # In-app background soundtrack stems
│   └── manifest.webmanifest      # PWA application metadata
├── src/
│   ├── app/                      # Application routes & configuration
│   ├── components/               # Modular UI components
│   │   ├── ui/                   # Reusable atomic design system (Buttons, Cards, Badges)
│   │   ├── layout/               # Navigation bar, headers, shells
│   │   ├── performance/          # Radar charts, recovery heatmaps, activity rings
│   │   ├── AIMealVisionModal.tsx # Camera & image upload scanner for Gemini
│   │   ├── AIWorkoutGeneratorModal.tsx # Prompt-to-workout generator
│   │   ├── ExerciseMuscleHologram.tsx  # Three.js 3D muscle render widget
│   │   └── NowPlayingMusicWidget.tsx   # Floating interactive music player
│   ├── context/                  # Global Context Providers (MusicPlayerContext, etc.)
│   ├── hooks/                    # Custom React hooks (useAI, useData, useActiveCardio)
│   ├── lib/                      # Core business logic & SDK integrations
│   │   ├── adminAuth.ts          # Admin session management & credentials handling
│   │   ├── api.ts                # Firestore repository, DTO mappings & transformers
│   │   ├── audio.ts              # Web Audio API procedural sound synthesizer & haptics
│   │   ├── fileValidation.ts     # OWASP client-side upload & MIME validation
│   │   ├── firebase.ts           # Firebase App, Auth, and Firestore initialization
│   │   ├── gemini.ts             # Google GenAI SDK client & prompt contracts
│   │   ├── i18n.tsx              # Bilingual translation dictionaries & RTL controller
│   │   └── recovery.ts           # Muscle fatigue calculations & algorithms
│   ├── views/                    # Primary top-level screen views
│   │   ├── TodayView.tsx         # Dashboard, active session, quick metrics
│   │   ├── RoutinesView.tsx      # Training split builder and routine organizer
│   │   ├── SessionDetailView.tsx # Live workout session execution HUD
│   │   ├── NutritionView.tsx     # Meal diary, TDEE calculator, camera vision
│   │   ├── CalendarView.tsx      # Workout history & frequency heatmaps
│   │   ├── PerformanceHubView.tsx# Analytics, 1RM progression, recovery scores
│   │   └── SettingsView.tsx      # Language, theme, units, cloud backup
│   ├── App.tsx                   # Main route switchboard & modal providers
│   ├── main.tsx                  # React DOM root entrypoint
│   └── index.css                 # Global Tailwind design tokens & utility styles
├── .env.example                  # Sanitized template for environment variables
├── capacitor.config.ts           # Capacitor mobile runtime configuration
├── firebase.json                 # Firebase Hosting configuration & CSP security headers
├── firestore.rules               # Production Firestore Security Rules (RBAC & constraints)
├── package.json                  # Dependencies & execution scripts
└── vite.config.ts                # Vite bundler, PWA, and code-splitting configuration
```

---

## 🔒 Security & DevSecOps Hardening

The codebase complies with rigorous DevSecOps and OWASP standards:

1. **Firestore Role-Based Security Rules (`firestore.rules`)**:
   - Enforces strict user isolation: `allow read, write: if isOwner(userId)`.
   - Prevents Broken Object-Level Authorization (BOLA): Administrative access requires a cryptographically verified custom claim (`request.auth.token.get('admin', false) == true`).
   - Deep structural validation of all incoming documents (lengths, types, permitted keys).

2. **Secrets Hygiene**:
   - Hardened `.gitignore` excludes `.env*`, mobile keystores, and private certificates.
   - Client code (`src/lib/adminAuth.ts`) does not contain hardcoded plaintext credentials.

3. **Content Security Policy (`firebase.json`)**:
   - Strict `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `HSTS` preloading.
   - Tight CSP restricting origins to trusted Google Firebase and Gemini endpoints, with explicit `object-src 'none'` and `base-uri 'self'`.

4. **Client-Side File Upload Guard (`src/lib/fileValidation.ts`)**:
   - File size limits (12MB max for images, 50MB max for audio) and strict MIME-type checking prevent client memory exhaustion, unhandled exceptions, and UI thread blocking.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version **18.x** or **20.x** recommended)
- `npm` (version 9+ or 10+)
- A [Firebase Project](https://console.firebase.google.com/) with Cloud Firestore and Authentication enabled.
- A [Google Gemini API Key](https://aistudio.google.com/) for AI features.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/MyGym.git
   cd MyGym
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Firebase and Gemini API credentials (see [Environment Configuration](#-environment-configuration)).

4. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Configuration

Configure your `.env` based on `.env.example`:

```env
# Firebase Client Configuration (From Firebase Console > Project Settings)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef..."
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# Google Gemini API Key (From Google AI Studio)
VITE_GEMINI_API_KEY="AIzaSy..."

# Administrator Account Email (Optional override)
VITE_ADMIN_EMAIL="admin@yourgym.com"
```

---

## 📱 Cross-Platform Builds

### 1. Progressive Web App (PWA)
The app is configured as a fully offline-capable PWA with automatic service-worker updates.
```bash
npm run build
npm run preview
```

### 2. Desktop Application (Electron)
Run FORMA inside an Electron desktop window:
```bash
# Development mode (concurrently runs Vite dev server and Electron)
npm run electron:dev

# Run Electron against existing build
npm run electron:start
```

### 3. Mobile Applications (iOS & Android via Capacitor)
```bash
# 1. Build web distribution and sync assets with native projects
npm run build:mobile

# 2. Open native IDEs
npx cap open android    # Opens Android Studio
npx cap open ios        # Opens Xcode (macOS only)
```

---

## 📜 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR. |
| `npm run typecheck` | Runs TypeScript compiler (`tsc --noEmit`) to verify types. |
| `npm run build` | Runs type-checking and produces optimized production bundles in `dist/`. |
| `npm run build:mobile` | Runs production build and synchronizes assets with Capacitor iOS/Android. |
| `npm run cap:sync` | Syncs plugins and web assets into native mobile directories. |
| `npm run preview` | Serves the production build locally for testing. |
| `npm run electron:dev` | Concurrently launches Vite dev server and the Electron desktop window. |
| `npm run electron:start` | Launches the Electron desktop shell. |

---

## 🌍 Internationalization (i18n & RTL)

FORMA features a built-in localization engine ([`src/lib/i18n.tsx`](file:///c:/Users/ahmad/OneDrive/Desktop/Projects/MyGym/src/lib/i18n.tsx)):

- **Languages Supported**:
  - 🇺🇸 **English** (`en`) — Left-to-Right (LTR)
  - 🇸🇦 **العربية (Arabic)** (`ar`) — Right-to-Left (RTL)
- **Automatic Direction Flipping**: Switching languages automatically updates the `dir="rtl"` or `dir="ltr"` attribute on `document.documentElement`, mirroring grids, navigations, cards, and animations without CSS breakage.
- **Persistence**: Language selection is saved to `localStorage` and synchronized with user cloud profiles.

---

<p align="center">
  Crafted with passion for athletic excellence and high-performance software engineering. 🏋️‍♂️⚡
</p>
