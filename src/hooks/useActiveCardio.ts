import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActiveCardioTimer,
  getActiveCardio,
  getCardioRemainingSeconds,
  formatCardioTime,
  startCardioTimer,
  pauseCardioTimer,
  resumeCardioTimer,
  addCardioSeconds,
  stopCardioTimer,
  completeCardioTimer,
  CARDIO_TIMER_EVENT
} from '../lib/cardioTimer';

export function useActiveCardio() {
  const [activeCardio, setActiveCardio] = useState<ActiveCardioTimer | null>(() => getActiveCardio());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => getCardioRemainingSeconds(activeCardio));

  // Sync with localStorage and CustomEvent changes
  useEffect(() => {
    const handleTimerChange = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveCardioTimer | null>;
      const timer = customEvent.detail ?? getActiveCardio();
      setActiveCardio(timer);
      setRemainingSeconds(getCardioRemainingSeconds(timer));
    };

    window.addEventListener(CARDIO_TIMER_EVENT, handleTimerChange);
    window.addEventListener('storage', handleTimerChange);

    return () => {
      window.removeEventListener(CARDIO_TIMER_EVENT, handleTimerChange);
      window.removeEventListener('storage', handleTimerChange);
    };
  }, []);

  // Tick interval for active timer
  useEffect(() => {
    if (!activeCardio) {
      setRemainingSeconds(0);
      return;
    }

    if (!activeCardio.isRunning) {
      setRemainingSeconds(getCardioRemainingSeconds(activeCardio));
      return;
    }

    // Set initial remaining immediately
    const initialRem = getCardioRemainingSeconds(activeCardio);
    setRemainingSeconds(initialRem);

    if (initialRem <= 0) {
      completeCardioTimer(activeCardio);
      return;
    }

    const interval = setInterval(() => {
      const rem = getCardioRemainingSeconds(activeCardio);
      setRemainingSeconds(rem);

      if (rem <= 0) {
        clearInterval(interval);
        completeCardioTimer(activeCardio);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCardio]);

  const progressPercent = useMemo(() => {
    if (!activeCardio || activeCardio.totalDurationSeconds <= 0) return 0;
    const elapsed = activeCardio.totalDurationSeconds - remainingSeconds;
    return Math.min(100, Math.max(0, Math.round((elapsed / activeCardio.totalDurationSeconds) * 100)));
  }, [activeCardio, remainingSeconds]);

  const formattedTime = useMemo(() => {
    return formatCardioTime(remainingSeconds);
  }, [remainingSeconds]);

  const start = useCallback((params: {
    sessionId: string;
    exerciseId: string;
    exerciseIndex: number;
    exerciseName: string;
    sessionTitle: string;
    durationMinutes: number;
  }) => {
    const timer = startCardioTimer(params);
    setActiveCardio(timer);
    setRemainingSeconds(getCardioRemainingSeconds(timer));
  }, []);

  const pause = useCallback(() => {
    const updated = pauseCardioTimer();
    setActiveCardio(updated);
    if (updated) setRemainingSeconds(getCardioRemainingSeconds(updated));
  }, []);

  const resume = useCallback(() => {
    const updated = resumeCardioTimer();
    setActiveCardio(updated);
    if (updated) setRemainingSeconds(getCardioRemainingSeconds(updated));
  }, []);

  const addTime = useCallback((seconds: number) => {
    const updated = addCardioSeconds(seconds);
    setActiveCardio(updated);
    if (updated) setRemainingSeconds(getCardioRemainingSeconds(updated));
  }, []);

  const stop = useCallback(() => {
    stopCardioTimer();
    setActiveCardio(null);
    setRemainingSeconds(0);
  }, []);

  const complete = useCallback(async () => {
    if (activeCardio) {
      await completeCardioTimer(activeCardio);
      setActiveCardio(null);
      setRemainingSeconds(0);
    }
  }, [activeCardio]);

  return {
    activeCardio,
    remainingSeconds,
    formattedTime,
    progressPercent,
    isRunning: activeCardio?.isRunning ?? false,
    start,
    pause,
    resume,
    addTime,
    stop,
    complete
  };
}
