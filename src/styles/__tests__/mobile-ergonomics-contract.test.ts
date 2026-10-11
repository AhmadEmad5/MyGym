import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(`${ROOT}${p}`, 'utf8');

describe('mobile ergonomics and viewport contracts', () => {
  const indexCss = read('src/index.css');
  const tokensCss = read('src/styles/design-tokens.css');
  const shellCss = read('src/styles/shell.css');
  const modalTsx = read('src/components/Modal.tsx');

  describe('touch ergonomics and forms', () => {
    it('enforces min 16px font-size on form inputs to prevent iOS Safari auto-zoom', () => {
      expect(tokensCss).toMatch(/font-size:\s*16px\s*!important/);
    });

    it('defines 44px and 48px touch targets in design tokens', () => {
      expect(tokensCss).toMatch(/--space-touch-min:\s*44px/);
      expect(tokensCss).toMatch(/--space-touch-comfortable:\s*48px/);
    });

    it('enforces touch-action: manipulation on interactive controls for 0ms tap delay', () => {
      expect(indexCss).toMatch(/button,\s*input,\s*select,\s*textarea,\s*a[\s\S]*?touch-action:\s*manipulation/);
    });

    it('enforces tactile active press scale on button primitives', () => {
      expect(indexCss).toMatch(/\.btn:active:not\(:disabled\)[\s\S]*?transform:\s*scale\(0\.98\)/);
    });
  });

  describe('viewport hardening and zero-horizontal-overflow', () => {
    it('locks horizontal overflow defensively on the shell wrapper with overflow-x: clip', () => {
      expect(shellCss).toMatch(/\.app-layout[\s\S]*?overflow-x:\s*clip/);
    });

    it('enforces full width bounding and overflow clipping on #root and body', () => {
      expect(indexCss).toMatch(/#root[\s\S]*?overflow-x:\s*clip/);
      expect(indexCss).toMatch(/body[\s\S]*?overflow-x:\s*clip/);
    });

    it('supports compact mobile viewports down to 360px and 380px in shell rules', () => {
      expect(shellCss).toMatch(/@media\s*\(max-width:\s*380px\)/);
    });
  });

  describe('mobile components, bottom sheets and timers', () => {
    it('provides global tabular-nums utility class for jitter-free timers and counters', () => {
      expect(tokensCss).toMatch(/\.tabular-nums[\s\S]*?font-variant-numeric:\s*tabular-nums/);
    });

    it('provides bottom safe clearance padding for floating HUD and bottom dock controls', () => {
      expect(shellCss).toMatch(/--hud-bottom-offset/);
      expect(shellCss).toMatch(/--shell-dock-inset/);
    });

    it('implements native touch swipe-to-dismiss gesture tracking in Modal bottom sheets', () => {
      expect(modalTsx).toContain('handleTouchStart');
      expect(modalTsx).toContain('handleTouchMove');
      expect(modalTsx).toContain('handleTouchEnd');
      expect(modalTsx).toContain('translateY(100%)');
    });
  });

  describe('motion accessibility', () => {
    it('provides a reduced motion guard in design tokens', () => {
      expect(tokensCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    });
  });
});
