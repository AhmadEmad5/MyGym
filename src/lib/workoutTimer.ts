import { useSyncExternalStore } from 'react';
import { gymAudio } from './audio';

export interface WorkoutTimerState {
  secondsLeft: number | null;
  totalSeconds: number;
  exerciseName: string;
  isRunning: boolean;
  showCompleteToast: boolean;
}

class WorkoutTimerManager {
  private state: WorkoutTimerState = {
    secondsLeft: null,
    totalSeconds: 90,
    exerciseName: '',
    isRunning: false,
    showCompleteToast: false
  };

  private listeners = new Set<() => void>();
  private intervalId: any = null;
  private toastTimeoutId: any = null;

  public getState = (): WorkoutTimerState => {
    return this.state;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  public start(seconds: number, exerciseName: string = '', soundAlerts: boolean = true, vibrationAlerts: boolean = true) {
    this.stop();

    const validSeconds = Math.max(1, Math.round(seconds));
    this.state = {
      secondsLeft: validSeconds,
      totalSeconds: validSeconds,
      exerciseName,
      isRunning: true,
      showCompleteToast: false
    };
    this.notify();

    // Initialize Lockscreen MediaSession HUD
    gymAudio.startMediaSessionRestTimer({
      secondsLeft: validSeconds,
      totalSeconds: validSeconds,
      exerciseName,
      onAdjust: (delta) => this.adjust(delta),
      onSkip: () => this.stop()
    });

    // Start 1-second interval ticker
    this.intervalId = setInterval(() => {
      if (this.state.secondsLeft === null || this.state.secondsLeft <= 0) {
        this.handleComplete(soundAlerts, vibrationAlerts);
      } else {
        const nextSeconds = this.state.secondsLeft - 1;
        this.state = {
          ...this.state,
          secondsLeft: nextSeconds
        };
        this.notify();

        // Update Lockscreen controls with live countdown
        gymAudio.updateMediaSessionRestTimer(nextSeconds, this.state.exerciseName);

        // 10-second silent haptic warning
        if (nextSeconds === 10 && vibrationAlerts) {
          gymAudio.triggerSubtleHaptic([25]);
        }

        // Pre-set countdown pip at seconds 3, 2, 1
        if (nextSeconds <= 3 && nextSeconds > 0) {
          if (soundAlerts) gymAudio.playCountdownBeep(false);
          if (vibrationAlerts) gymAudio.triggerSubtleHaptic([28]);
        }

        if (nextSeconds <= 0) {
          this.handleComplete(soundAlerts, vibrationAlerts);
        }
      }
    }, 1000);
  }

  public adjust(delta: number) {
    if (this.state.secondsLeft === null) return;
    const newSeconds = Math.max(0, this.state.secondsLeft + delta);
    this.state = {
      ...this.state,
      secondsLeft: newSeconds,
      totalSeconds: Math.max(this.state.totalSeconds, newSeconds)
    };
    this.notify();
    gymAudio.updateMediaSessionRestTimer(newSeconds, this.state.exerciseName);
  }

  public stop() {
    gymAudio.stopMediaSessionRestTimer();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
    this.state = {
      ...this.state,
      secondsLeft: null,
      isRunning: false
    };
    this.notify();
  }

  private handleComplete(soundAlerts: boolean, vibrationAlerts: boolean) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (soundAlerts) {
      gymAudio.playRestTimerChime();
    }
    if (vibrationAlerts) {
      // Dual-pulse rhythmic vibration designed specifically for loud gyms
      gymAudio.triggerDualPulseHaptic();
    }

    // Keep completion state on lockscreen widget for 3.5s then clear
    gymAudio.updateMediaSessionRestTimer(0, this.state.exerciseName);
    setTimeout(() => {
      gymAudio.stopMediaSessionRestTimer();
    }, 3500);

    this.state = {
      ...this.state,
      secondsLeft: 0,
      isRunning: false,
      showCompleteToast: true
    };
    this.notify();

    this.toastTimeoutId = setTimeout(() => {
      this.state = {
        ...this.state,
        secondsLeft: null,
        showCompleteToast: false
      };
      this.notify();
    }, 4500);
  }

  public dismissToast() {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
    this.state = {
      ...this.state,
      showCompleteToast: false
    };
    this.notify();
  }
}

export const workoutTimer = new WorkoutTimerManager();

/**
 * Hook that returns the full workout timer state.
 * Subscribes to changes (re-renders only when timer ticks).
 */
export function useWorkoutTimer(): WorkoutTimerState {
  return useSyncExternalStore(
    workoutTimer.subscribe,
    workoutTimer.getState,
    workoutTimer.getState
  );
}

/**
 * Selector hook: Only re-renders when isRunning changes (starts or stops).
 * Does NOT re-render on every second tick! Perfect for parent/HUD shells.
 */
export function useIsWorkoutTimerRunning(): boolean {
  return useSyncExternalStore(
    workoutTimer.subscribe,
    () => workoutTimer.getState().isRunning,
    () => workoutTimer.getState().isRunning
  );
}

/**
 * Selector hook: Only re-renders when showCompleteToast changes.
 * Avoids any parent view re-render during timer ticks.
 */
export function useWorkoutRestToast() {
  const showToast = useSyncExternalStore(
    workoutTimer.subscribe,
    () => workoutTimer.getState().showCompleteToast,
    () => workoutTimer.getState().showCompleteToast
  );
  return {
    showToast,
    dismissToast: () => workoutTimer.dismissToast()
  };
}
