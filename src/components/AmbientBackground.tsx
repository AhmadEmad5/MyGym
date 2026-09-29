import { useEffect, useState } from 'react';
import { useReducedMotion } from '../components/performance/useReducedMotion';

export function AmbientBackground() {
  const reduceMotion = useReducedMotion();
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <div
      className="forma-ambient"
      aria-hidden="true"
      data-paused={tabVisible ? 'false' : 'true'}
      data-static={reduceMotion ? 'true' : 'false'}
    >
      <span className="forma-ambient-aurora" />
      <span className="forma-ambient-orb is-a" />
      <span className="forma-ambient-orb is-b" />
      <span className="forma-ambient-orb is-c" />
      <span className="forma-ambient-grid" />
    </div>
  );
}
