import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Shell chrome / scroll contract guard.
 *
 * Forma is an app shell, not a document. The whole layout rests on four facts,
 * and every one of them is invisible to the type checker, to the unit suite and
 * to the production build:
 *
 *   1. `.content-area` is the only vertical scroller. `body` is
 *      `overflow: hidden` at `100dvh`, so the document itself never scrolls.
 *   2. The navigation chrome is a SIBLING of `<main>`, not a descendant of the
 *      scroller. `.content-area` is nested inside `<main>` (AppShell.tsx), and
 *      the nav wrapper and the mobile top bar sit beside it.
 *   3. Nothing between the chrome and the viewport creates a containing block,
 *      so `position: fixed` chrome is anchored to the viewport.
 *   4. Because of 1 and 2 there is no ancestor scrollport for the chrome to
 *      stick to - `position: sticky` on it is inert by construction.
 *
 * Point 4 is the one that keeps being re-derived from scratch. "The navbar
 * disappears when I scroll, it just needs `position: sticky`" has been filed
 * twice against this repo, and acting on it would change nothing: a sticky
 * element offsets against its nearest ancestor scrollport, which for the chrome
 * is a document that cannot scroll. Worse, the `will-change: transform` that
 * comes with that theory would break the one mechanism that genuinely can hide
 * the chrome (point 3).
 *
 * These tests freeze the four facts, so the next report can be checked against
 * them in seconds instead of re-litigated, and so a future edit that quietly
 * adds a second scroller or a containing block fails here rather than in the
 * field.
 */

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(`${ROOT}${p}`, 'utf8');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

/** Every `.css` file under src/, so a new stylesheet cannot opt out silently. */
function cssFiles(dir = `${ROOT}src`, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(full, acc);
    else if (entry.name.endsWith('.css')) acc.push(full);
  }
  return acc;
}

interface Rule {
  /** Stylesheet the rule came from, relative to the repo root. */
  file: string;
  /** 1-based line of the rule's selector, within that stylesheet. */
  line: number;
  /** Comma-separated selector list, whitespace collapsed. */
  selector: string;
  /** The declaration block, comments stripped. */
  body: string;
}

/** At-rules whose block holds more rules. The project's full at-rule set. */
const GROUPING = new Set(['media', 'layer', 'container']);

/**
 * Enumerates every style rule in a stylesheet, descending through `@media` /
 * `@layer` / `@container` and skipping `@keyframes` steps.
 *
 * Recursive descent rather than a regex or a flat brace count: a flat scanner
 * reports `@layer base { ... }` as one rule and silently loses every rule inside
 * it, which is exactly where `html`, `body` and `.app-layout` are declared. No
 * CSS parser is used - that is a 30-line dependency for a guard - so this stays
 * exact only while the project uses no CSS nesting (no `&`, no nested
 * declarations). If that changes, `body` will start absorbing nested rules and
 * this file will need PostCSS instead.
 */
function parseRules(css: string, file: string, offset: number, out: Rule[]): void {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) return;

    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    const preludeRaw = css.slice(i, open);
    const prelude = preludeRaw.trim();
    const body = css.slice(open + 1, j - 1);

    if (prelude.startsWith('@')) {
      const keyword = /^@([\w-]+)/.exec(prelude)?.[1].toLowerCase() ?? '';
      if (GROUPING.has(keyword)) {
        parseRules(body, file, offset + open + 1, out);
      } else if (prelude.includes(';')) {
        // A statement at-rule (`@import ...;`) that happens to precede a block.
        // Step over the statement only, so the block behind it is still read.
        i = i + preludeRaw.indexOf(';') + 1;
        continue;
      }
      // `@keyframes`, `@page`, `@theme` and friends: a block that is not a list
      // of style rules. Skipped.
    } else if (prelude && !/^(\d+%|from|to)$/.test(prelude)) {
      const line = offset + i + (preludeRaw.length - preludeRaw.trimStart().length) + 1;
      out.push({
        file,
        line: css.slice(0, line - 1).split('\n').length,
        selector: prelude.replace(/\s+/g, ' '),
        body
      });
    }

    i = j;
  }
}

function rulesOf(absolutePath: string): Rule[] {
  const rel = absolutePath.slice(ROOT.length).replace(/\\/g, '/');
  const out: Rule[] = [];
  parseRules(stripComments(readFileSync(absolutePath, 'utf8')), rel, 0, out);
  return out;
}

const ALL_RULES: Rule[] = cssFiles().flatMap(rulesOf);

/** Values of one property in a rule body, lower-cased. */
function decls(rule: Rule, property: string): string[] {
  const re = new RegExp(`(?:^|[;{])\\s*(?:-\\w+-)?${property}\\s*:\\s*([^;]+)`, 'gi');
  return [...rule.body.matchAll(re)].map((m) => m[1].trim().toLowerCase());
}

/** The last compound of one selector-list part: `body` of `a > body, html`. */
function subjectOf(selectorPart: string): string {
  return selectorPart.trim().split(/\s*[>+~]\s*/).pop() ?? '';
}

/** True when the part targets the shell root itself rather than a descendant. */
function targetsShellRoot(selectorPart: string): boolean {
  const subject = subjectOf(selectorPart);
  return (
    subject === 'body' ||
    subject === 'html' ||
    subject === '#root' ||
    // `.app-layout` and its own variants (.app-layout.in-workout-session,
    // .app-layout.has-live-bar) - but not `.app-layout > .modern-navbar`.
    subject === '.app-layout' ||
    /^\.app-layout[.:[]/.test(subject)
  );
}

/** The shell boxes: the scroller, its ancestors and the chrome around it. */
const SHELL_BOX =
  /^(\.?(app-layout|main-content|content-area|modern-nav-wrapper|modern-navbar|mobile-top-bar|forma-ambient|forma-skip-link)|body|html)$/;

/**
 * Properties that turn an element into the containing block for its
 * `position: fixed` descendants.
 */
const CONTAINING_BLOCK_PROPERTIES = [
  'transform',
  'translate',
  'rotate',
  'scale',
  'filter',
  'backdrop-filter',
  'perspective',
  'will-change',
  'contain',
  'content-visibility'
];

function rulesMatching(selector: string): Rule[] {
  return ALL_RULES.filter((r) => r.selector.split(',').some((p) => subjectOf(p) === selector));
}

/**
 * The rule that actually decides a selector's desktop appearance: the first
 * match that is not an `!important` override (those all live in breakpoint
 * blocks). Taking a max across every match instead would let a mobile-only
 * value mask a broken desktop one.
 */
function baseRuleOf(selector: string): Rule {
  const base = rulesMatching(selector).find((r) => !r.body.includes('!important'));
  expect(base, `the base ${selector} rule disappeared`).toBeDefined();
  return base!;
}

describe('shell chrome / scroll contract', () => {
  describe('the scroller', () => {
    it('locks the document: body is overflow:hidden at a viewport height', () => {
      const body = rulesMatching('body');
      expect(body.length, 'no rule targets `body` - the root policy is gone').toBeGreaterThan(0);

      expect(
        body.flatMap((r) => decls(r, 'overflow')).some((v) => /hidden|clip/.test(v)),
        'body no longer clips: the document itself can scroll again'
      ).toBe(true);

      expect(
        body.flatMap((r) => [...decls(r, 'height'), ...decls(r, 'min-height')]).some((v) => /dvh|svh|lvh|vh/.test(v)),
        'body is no longer pinned to a viewport height'
      ).toBe(true);
    });

    it('keeps .content-area as the only shell box that scrolls vertically', () => {
      const scrollers = ALL_RULES.filter(
        (r) =>
          r.selector.split(',').some((p) => SHELL_BOX.test(subjectOf(p))) &&
          decls(r, 'overflow-y').some((v) => /auto|scroll/.test(v))
      );
      const label = (r: Rule) => `${r.file}:${r.line} ${r.selector}`;

      expect(
        scrollers.filter((r) => !r.selector.split(',').some((p) => subjectOf(p) === '.content-area')).map(label),
        'these declare a vertical scroller but are not .content-area; a second one in ' +
          'the shell means content and chrome can move independently'
      ).toEqual([]);
      expect(
        scrollers.some((r) => r.selector.split(',').some((p) => subjectOf(p) === '.content-area')),
        '.content-area stopped being the app scroller - the shell has none'
      ).toBe(true);
    });
  });

  describe('the chrome', () => {
    const APP_SHELL = 'src/app/AppShell.tsx';

    it('renders the navigation as a sibling of <main>, not inside the scroller', () => {
      // Comments are stripped first: the skip-link docblock talks about <main>.
      const src = stripComments(read(APP_SHELL));
      const nav = src.indexOf('<ModernNavigationBar');
      const main = src.indexOf('<main');
      const mainEnd = src.indexOf('</main>');
      const scroller = src.indexOf('className="content-area"');

      expect(nav, 'AppShell no longer renders <ModernNavigationBar>').toBeGreaterThan(-1);
      expect(main, 'AppShell no longer renders <main>').toBeGreaterThan(-1);
      expect(mainEnd).toBeGreaterThan(main);
      expect(
        nav < main,
        'the nav now renders inside <main>: it would scroll with the content, and only ' +
          'THEN would `position: sticky` be the right tool'
      ).toBe(true);
      expect(
        scroller > main && scroller < mainEnd,
        '.content-area must stay nested inside <main> to keep the scroller and the chrome out ' +
          'of each other'
      ).toBe(true);
    });

    it('gives the nav wrapper a position, so its z-index is not inert', () => {
      // `z-index` on a `position: static` box is ignored. The wrapper used to
      // declare 100 that way, which left the pill on `.modern-navbar`'s own
      // z-index: 50 - below `.ai-fab` (90) and `.ai-panel` (100), both of which
      // are fixed and rendered inside the scroller.
      const base = baseRuleOf('.modern-nav-wrapper');
      expect(
        decls(base, 'position').some((v) => /sticky|fixed|relative|absolute/.test(v)),
        '.modern-nav-wrapper is position: static again, so its z-index does nothing'
      ).toBe(true);
      expect(Number(decls(base, 'z-index')[0])).toBeGreaterThanOrEqual(100);
    });

    it('keeps the top chrome above every layer rendered inside the scroller', () => {
      // `.content-area` and `.main-content` are `z-index: auto`, so they are not
      // stacking contexts: every index inside the scroller competes with the
      // chrome at the root. The AI FAB and panel are `position: fixed` but
      // rendered inside `.content-area` (App.tsx:320-323), so they are exactly
      // such a competitor - and their index is an inline style, not CSS.
      const aiInline = Math.max(
        0,
        ...[...read('src/components/AIAssistant.tsx').matchAll(/zIndex:\s*(\d+)/g)].map((m) => Number(m[1]))
      );
      const fromCss = (selector: string) =>
        Math.max(0, ...rulesMatching(selector).map((r) => Number(decls(r, 'z-index')[0]) || 0));

      const inScroller = Math.max(aiInline, fromCss('.ai-fab'), fromCss('.ai-panel'));
      expect(inScroller, 'the AI FAB/panel lost their index - recompute the band').toBeGreaterThan(0);

      // The pill's own base rule, not the max over its rules: below 900px the
      // wrapper is the fixed bottom dock and carries 1000/1050 from another
      // file, which would make this assertion pass no matter what the desktop
      // rule said.
      const base = baseRuleOf('.modern-nav-wrapper');
      expect(fromCss('.mobile-top-bar'), 'the mobile top bar lost its z-index').toBeGreaterThan(inScroller);
      expect(Number(decls(base, 'z-index')[0]), 'the desktop pill is paintable-over').toBeGreaterThan(inScroller);
    });
  });

  describe('containing blocks', () => {
    it('never puts a containing block between the fixed chrome and the viewport', () => {
      const offenders: string[] = [];
      for (const rule of ALL_RULES) {
        if (!rule.selector.split(',').some(targetsShellRoot)) continue;
        for (const property of CONTAINING_BLOCK_PROPERTIES) {
          for (const value of decls(rule, property)) {
            // `none` and `auto` are the opt-outs, not the hazard.
            if (value === 'none' || value === 'auto') continue;
            offenders.push(`${rule.file}:${rule.line} ${rule.selector} { ${property}: ${value} }`);
          }
        }
      }
      expect(
        offenders,
        'a transform/filter/contain on body, html or .app-layout makes `position: fixed` ' +
          'chrome anchor to the shell box instead of the viewport - the one way the navbar ' +
          'really can scroll away in this app'
      ).toEqual([]);
    });
  });
});
