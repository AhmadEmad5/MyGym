import { useEffect, useState } from 'react';
import { useReducedMotion } from '../components/performance/useReducedMotion';

export function AmbientBackground() {
  const reduceMotion = useReducedMotion();
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (reduceMotion) return null;

  return (
    <div
      className="forma-ambient"
      aria-hidden="true"
      data-paused={tabVisible ? 'false' : 'true'}
    >
      <span className="forma-ambient-orb is-a" />
      <span className="forma-ambient-orb is-b" />
      <span className="forma-ambient-orb is-c" />
      <span className="forma-ambient-grid" />
    </div>
  );
}
