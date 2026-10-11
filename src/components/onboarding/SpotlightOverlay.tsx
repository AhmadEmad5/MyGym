import { useCallback, useEffect, useRef, useState } from 'react';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightOverlayProps {
  targetSelector: string;
  isActive: boolean;
  onTargetMeasured?: (box: BoundingBox | null) => void;
  onClickBackdrop?: () => void;
}

export function SpotlightOverlay({
  targetSelector,
  isActive,
  onTargetMeasured,
  onClickBackdrop,
}: SpotlightOverlayProps) {
  const [box, setBox] = useState<BoundingBox | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Measure and scroll target into view
  const measureTarget = useCallback(() => {
    if (!isActive || !targetSelector) {
      setBox(null);
      onTargetMeasured?.(null);
      return;
    }

    const selectors = targetSelector.split(',').map((s) => s.trim());
    let targetEl: HTMLElement | null = null;

    for (const sel of selectors) {
      const found = document.querySelector<HTMLElement>(sel);
      if (found && found.offsetWidth > 0 && found.offsetHeight > 0) {
        targetEl = found;
        break;
      }
    }

    if (!targetEl) {
      setBox(null);
      onTargetMeasured?.(null);
      return;
    }

    targetElementRef.current = targetEl;

    // Viewport-aware scroll:
    // On mobile (< 768px), scroll target into upper 35% so bottom sheet doesn't obscure it
    const isMobile = window.innerWidth < 768;
    const rect = targetEl.getBoundingClientRect();

    const isVisibleInUpperViewport =
      rect.top >= 40 &&
      rect.bottom <= (isMobile ? window.innerHeight * 0.55 : window.innerHeight - 80);

    if (!isVisibleInUpperViewport) {
      if (isMobile) {
        const targetScrollY =
          window.scrollY + rect.top - Math.max(60, window.innerHeight * 0.12);
        window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }

    // Measure bounding rect with comfortable padding
    const updatedRect = targetEl.getBoundingClientRect();
    const pad = isMobile ? 8 : 12;

    const measuredBox: BoundingBox = {
      x: Math.max(0, updatedRect.left - pad),
      y: Math.max(0, updatedRect.top - pad),
      width: Math.min(window.innerWidth, updatedRect.width + pad * 2),
      height: Math.min(window.innerHeight, updatedRect.height + pad * 2),
    };

    setBox(measuredBox);
    onTargetMeasured?.(measuredBox);
  }, [isActive, onTargetMeasured, targetSelector]);

  // Set up resize observer and scroll listeners
  useEffect(() => {
    if (!isActive) return;

    // Small delay to allow tab/layout transitions to complete
    const initialTimer = setTimeout(measureTarget, 160);

    const handleScrollOrResize = () => {
      requestAnimationFrame(measureTarget);
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });

    // Active DOM ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        requestAnimationFrame(measureTarget);
      });
      if (document.body) {
        resizeObserverRef.current.observe(document.body);
      }
    }

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize);
      resizeObserverRef.current?.disconnect();
    };
  }, [isActive, measureTarget]);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {/* SVG Spotlight Cutout Mask */}
      <svg
        className="w-full h-full pointer-events-auto"
        width="100%"
        height="100%"
        onClick={onClickBackdrop}
      >
        <defs>
          <mask id="forma-tour-spotlight-mask">
            {/* White covers entire background */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout reveals the targeted element */}
            {box && (
              <rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                rx="16"
                ry="16"
                fill="black"
                style={{
                  transition: 'x 0.28s cubic-bezier(0.16, 1, 0.3, 1), y 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s cubic-bezier(0.16, 1, 0.3, 1), height 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            )}
          </mask>
        </defs>

        {/* Dimming Scrim with Mask Cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(3, 7, 18, 0.76)"
          mask="url(#forma-tour-spotlight-mask)"
        />
      </svg>

      {/* Subtle Brand Glow Ring around target */}
      {box && (
        <div
          className="fixed pointer-events-none rounded-2xl"
          style={{
            transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            border: '2px solid rgba(56, 189, 248, 0.85)',
            boxShadow:
              '0 0 25px rgba(56, 189, 248, 0.5), inset 0 0 15px rgba(56, 189, 248, 0.25)',
            transition:
              'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s cubic-bezier(0.16, 1, 0.3, 1), height 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform, width, height',
          }}
        />
      )}
    </div>
  );
}
