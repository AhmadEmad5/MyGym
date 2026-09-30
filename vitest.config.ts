import { defineConfig } from 'vitest/config';

// Every module under test (`src/lib/weights.ts`, `src/lib/exerciseKey.ts`,
// `src/lib/videoRef.ts`, `src/app/navActive.ts`) is pure TypeScript: no React,
// no DOM, no Firebase import. That is what keeps the harness to ONE dependency —
// the `node` environment needs no jsdom, no happy-dom and no @testing-library.
//
// Tests live under `src/` on purpose. `tsconfig.json` has `include: ["src"]`, so
// every `*.test.ts` file is type-checked for free by BOTH `npm run typecheck`
// and the `tsc` half of `npm run build`, under full strict settings. A root
// `tests/` directory would be invisible to both, so a type-broken test would
// still execute and CI would pass on it.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});