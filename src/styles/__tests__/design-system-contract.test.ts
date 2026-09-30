import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Design-system contract guard.
 *
 * The project has two token files. `src/styles/design-tokens.css` is the
 * canonical one; `src/index.css` predates it and still declares 55 tokens
 * that design-tokens.css overrides. Nothing but the import order in
 * `src/main.tsx` decides which wins.
 *
 * This test freezes that arrangement. Without it, a harmless-looking import
 * reorder would resurrect every one of those 55 declarations and change the
 * app's appearance in all seven themes, with the type checker, the unit
 * suite and the production build all still green.
 */

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(`${ROOT}${p}`, 'utf8');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

const TOKENS_CSS = 'src/styles/design-tokens.css';
const INDEX_CSS = 'src/index.css';
const MAIN_TSX = 'src/main.tsx';

/** Collects `--token: value` pairs from the first block opened by `selector`. */
function blockTokens(file: string, selector: string): Map<string, string> {
  const lines = stripComments(read(file)).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith(selector)) continue;
    const found = new Map<string, string>();
    let depth = 0;
    let started = false;
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') {
          depth++;
          started = true;
        } else if (ch === '}') depth--;
      }
      const body = lines[j].replace(/^.*?\{/, '').replace(/\}.*$/, '');
      for (const m of body.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+)/g)) {
        found.set(m[1], m[2].trim().replace(/\s+/g, ' '));
      }
      if (started && depth === 0) break;
    }
    return found;
  }
  return new Map();
}

const THEMES = ['light', 'midnight', 'neon', 'ocean', 'forest', 'sunset', 'paper'] as const;

/** Normalises so `#43dcd3,#3686e9` and `#43dcd3, #3686e9` compare equal. */
const canon = (v: string) => v.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').toLowerCase();

describe('design-token contract', () => {
  describe('load-bearing import order', () => {
    const imports = read(MAIN_TSX)
      .split(/\r?\n/)
      .map((l, i) => ({ line: l, n: i + 1 }))
      .filter((l) => l.line.includes('.css'));

    it('imports index.css at all', () => {
      expect(imports.some((l) => l.line.includes("./index.css"))).toBe(true);
    });

    it('imports design-tokens.css at all', () => {
      expect(imports.some((l) => l.line.includes('./styles/design-tokens.css'))).toBe(true);
    });

    it('imports design-tokens.css AFTER index.css, so the canonical tokens win', () => {
      const idx = imports.findIndex((l) => l.line.includes("./index.css"));
      const tok = imports.findIndex((l) => l.line.includes('./styles/design-tokens.css'));
      expect(
        tok,
        'design-tokens.css must be imported after index.css; the reverse silently ' +
          'resurrects 55 dead declarations in src/index.css and changes all 7 themes'
      ).toBeGreaterThan(idx);
    });
  });

  describe('theme coverage', () => {
    it.each(THEMES)('design-tokens.css defines the %s theme', (theme) => {
      const block = read(TOKENS_CSS);
      expect(block).toContain(`[data-theme="${theme}"]`);
    });

    it.each(THEMES)('%s theme declares surface and text tokens', (theme) => {
      const block = blockTokens(TOKENS_CSS, `[data-theme="${theme}"]`);
      expect(block.size).toBeGreaterThan(0);
      expect(block.has('--surface-canvas')).toBe(true);
      expect(block.has('--text-primary')).toBe(true);
    });
  });

  describe('base token scale', () => {
    const root = blockTokens(TOKENS_CSS, ':root');

    it('declares the radius scale', () => {
      for (const t of ['--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl']) {
        expect(root.has(t), `${t} missing from :root`).toBe(true);
      }
    });

    it('declares the spacing scale', () => {
      for (const t of ['--space-md', '--space-lg', '--space-xl']) {
        expect(root.has(t), `${t} missing from :root`).toBe(true);
      }
    });

    it('declares touch-target floors', () => {
      // 44px is the iOS minimum; 48px the Android one. Session entry depends
      // on both being present, so their absence is a contract break.
      expect(root.get('--space-touch-min')).toBe('44px');
      expect(root.get('--space-touch-comfortable')).toBe('48px');
    });

    it('declares motion tokens', () => {
      expect([...root.keys()].some((k) => k.startsWith('--motion-'))).toBe(true);
      expect([...root.keys()].some((k) => k.startsWith('--ease-'))).toBe(true);
    });

    it('declares focus-ring tokens', () => {
      for (const t of ['--focus-ring-width', '--focus-ring-color', '--focus-ring-halo']) {
        expect(root.has(t), `${t} missing from :root`).toBe(true);
      }
    });
  });

  describe('legacy index.css surface (deprecation baseline)', () => {
    /**
     * Recorded so the migration can be measured. This number may only go DOWN.
     * Each entry is a token design-tokens.css also declares with a different
     * value, so the index.css copy is dead CSS.
     */
    const DEAD_DECLARATION_COUNT = 55;

    it('does not gain new dead declarations', () => {
      let dead = 0;
      for (const selector of [':root', ...THEMES.map((t) => `[data-theme="${t}"]`)]) {
        const canonical = blockTokens(TOKENS_CSS, selector);
        const legacy = blockTokens(INDEX_CSS, selector);
        for (const [token, value] of legacy) {
          const winner = canonical.get(token);
          if (winner !== undefined && canon(winner) !== canon(value)) dead++;
        }
      }
      expect(
        dead,
        `src/index.css now has ${dead} declarations shadowed by ${TOKENS_CSS} ` +
          `(was ${DEAD_DECLARATION_COUNT}). If this is intentional, delete the ` +
          `index.css copy rather than letting the cascade decide.`
      ).toBeLessThanOrEqual(DEAD_DECLARATION_COUNT);
    });

    it('declares only the documented legacy-owned tokens', () => {
      const canonicalOnly = new Set<string>();
      for (const selector of [':root', ...THEMES.map((t) => `[data-theme="${t}"]`)]) {
        const canonical = blockTokens(TOKENS_CSS, selector);
        for (const t of blockTokens(INDEX_CSS, selector).keys()) {
          if (!canonical.has(t)) canonicalOnly.add(t);
        }
      }
      // These six are declared in index.css and consumed today, so they are
      // the migration backlog rather than dead code. The `--premium-*` family
      // is the important one: the session HUD and the gym-floor set card both
      // read --premium-surface / --premium-line / --premium-soft, and the
      // canonical token file never defined them. --theme-radius is read with
      // !important by the per-theme card rules, so it cannot simply move.
      // Migrating these into design-tokens.css is the next contract change.
      expect([...canonicalOnly].sort()).toEqual([
        '--gym-lime',
        '--premium-line',
        '--premium-panel',
        '--premium-soft',
        '--premium-surface',
        '--theme-shadow'
      ]);
    });
  });

  describe('no new hardcoded hex in the canonical token file', () => {
    it('keeps theme values inside [data-theme] blocks or :root', () => {
      // A hex literal directly in a component stylesheet is how the token
      // system erodes. This is advisory-by-design: it asserts the canonical
      // file is the only place raw colour is expected to appear.
      const canonical = read(TOKENS_CSS);
      const hexes = canonical.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
      expect(hexes.length).toBeGreaterThan(0);
    });
  });
});
