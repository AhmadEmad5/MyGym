import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useFormaReducedMotion } from '../components/TodayBentoGrid';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export interface UseGsapStaggerOptions {
  selector?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  yOffset?: number;
}

/**
 * High-performance GSAP staggered entrance hook.
 * Animates strictly GPU-composited properties (transform & opacity)
 * with automatic scoping, cleanup, and reduced-motion bypass.
 */
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  options: UseGsapStaggerOptions = {}
) {
  const containerRef = useRef<T>(null);
  const reduceMotion = useFormaReducedMotion();
  const {
    selector = '.gsap-stagger-item',
    delay = 0.05,
    stagger = 0.05,
    duration = 0.35,
    yOffset = 12
  } = options;

  useGSAP(
    () => {
      if (reduceMotion || !containerRef.current) return;

      const items = containerRef.current.querySelectorAll(selector);
      if (!items.length) return;

      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: yOffset,
          willChange: 'transform, opacity'
        },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          delay,
          ease: 'power2.out',
          force3D: true,
          clearProps: 'willChange'
        }
      );
    },
    { scope: containerRef, dependencies: [reduceMotion, selector] }
  );

  return containerRef;
}
