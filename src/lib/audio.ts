// Lightweight Web Audio & Vibration utility for MyGym

class GymAudioController {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Plays a pleasant, athletic 3-tone chime for timer completion
   */
  playRestTimerChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // D5 (587.33Hz), F#5 (739.99Hz), A5 (880.00Hz) - Major triad
      const notes = [
        { freq: 587.33, start: now, duration: 0.16 },
        { freq: 739.99, start: now + 0.14, duration: 0.16 },
        { freq: 880.00, start: now + 0.28, duration: 0.35 }
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  /**
   * Triggers device vibration pattern if supported
   */
  triggerVibration(pattern: number[] = [200, 100, 250]) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on desktop/unsupported platforms
    }
  }
}

export const gymAudio = new GymAudioController();
