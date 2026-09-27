// Lightweight Web Audio & Vibration utility for FORMA

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
   * Plays a crisp, pleasant chime when completing a set
   */
  playSetCompleteChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // G5 (783.99Hz) -> C6 (1046.50Hz) - Crisp, encouraging athletic "Ding!"
      const notes = [
        { freq: 783.99, start: now, duration: 0.08, gain: 0.15 },
        { freq: 1046.50, start: now + 0.07, duration: 0.22, gain: 0.18 }
      ];

      notes.forEach(({ freq, start, duration, gain: targetGain }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(targetGain, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (err) {
      console.warn('Set complete chime error:', err);
    }
  }

  /**
   * Plays an assertive, multi-harmonic athletic chime for gym environments
   * Blends fundamental tones with piercing high harmonics (up to 1318Hz)
   * to cut through Bluetooth earbuds and loud gym background music.
   */
  playRestTimerChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // D5 (587.33Hz), A5 (880.00Hz), D6 (1174.66Hz), E6 (1318.51Hz) - Energizing, penetrating fanfare
      const notes = [
        { freq: 587.33, start: now, duration: 0.15, type: 'triangle' as OscillatorType, gain: 0.24 },
        { freq: 880.00, start: now + 0.12, duration: 0.18, type: 'triangle' as OscillatorType, gain: 0.26 },
        { freq: 1174.66, start: now + 0.24, duration: 0.22, type: 'sine' as OscillatorType, gain: 0.28 },
        { freq: 1318.51, start: now + 0.36, duration: 0.45, type: 'sine' as OscillatorType, gain: 0.32 }
      ];

      notes.forEach(({ freq, start, duration, type, gain: targetGain }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(targetGain, start + 0.02);
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

   * Plays a triumphant, warm victory fanfare for finishing a workout
   */
  playCelebrationFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz) - Victory Arpeggio
      const notes = [
        { freq: 523.25, start: now, duration: 0.2 },
        { freq: 659.25, start: now + 0.12, duration: 0.2 },
        { freq: 783.99, start: now + 0.24, duration: 0.25 },
        { freq: 1046.50, start: now + 0.38, duration: 0.65 }
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Warmer, brassier tone
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (err) {
      console.warn('Audio celebration playback error:', err);
    }
  }

  /**
   * Plays a crisp countdown beep for rest timer last 3 seconds
   */
  playCountdownBeep(isFinal: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.2 : 0.09));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (isFinal ? 0.22 : 0.1));
    } catch (err) {
      console.warn('Countdown beep error:', err);
    }
  }

  /**
   * Athletic Voice Coach using SpeechSynthesis API
   */
  speakVoiceCoach(text: string, lang: 'ar' | 'en' = 'ar') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice coach error:', e);
    }
  }

  /**
   * Subtle, gentle haptic feedback pattern for calm timer completion & micro-interactions
   * Gentle double-tap feel instead of an intense vibration buzzer
   */
  triggerSubtleHaptic(pattern: number[] = [45, 60, 45]) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on desktop/unsupported platforms
    }
  }

  /**
   * Dual-pulse rhythmic vibration pattern designed specifically for noisy gyms
   * Two powerful distinct pulses with ramped intensity that cut through pockets, waistbands, and loud music
   */
  triggerDualPulseHaptic() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        // [pulse 1, silence, pulse 2, silence, final strong punch]
        navigator.vibrate([100, 70, 150, 80, 260]);
      }
    } catch {
      // Ignore vibration errors on desktop/unsupported platforms
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

  private silentAudio: HTMLAudioElement | null = null;
  private isMediaSessionActive: boolean = false;
  private currentAdjustHandler: ((delta: number) => void) | null = null;
  private currentSkipHandler: (() => void) | null = null;

  private getSilentAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.silentAudio) {
      try {
        // 1-second silent WAV data URI to keep mobile browser audio context and lockscreen alive
        const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.silentAudio = new Audio(silentWav);
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.001;
      } catch (e) {
        console.warn('Silent audio creation failed:', e);
      }
    }
    return this.silentAudio;
  }

  /**
   * Initializes Media Session API for Lockscreen and Notification center controls
   */
  startMediaSessionRestTimer(options: {
    secondsLeft: number;
    totalSeconds: number;
    exerciseName?: string;
    onAdjust: (delta: number) => void;
    onSkip: () => void;
  }) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    this.currentAdjustHandler = options.onAdjust;
    this.currentSkipHandler = options.onSkip;

    // Start silent keep-alive audio so mobile OS keeps lockscreen widget visible
    const audio = this.getSilentAudio();
    if (audio && audio.paused) {
      audio.play().catch(() => {
        // User gesture may be needed on first play
      });
    }

    this.isMediaSessionActive = true;
    this.updateMediaSessionRestTimer(options.secondsLeft, options.exerciseName);

    try {
      navigator.mediaSession.playbackState = 'playing';

      // Skip rest -> Next Track
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.currentSkipHandler) this.currentSkipHandler();
      });

      // +30 seconds -> Previous Track
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.currentAdjustHandler) this.currentAdjustHandler(30);
      });

      // Seek actions
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (this.currentAdjustHandler) this.currentAdjustHandler(30);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (this.currentAdjustHandler) this.currentAdjustHandler(-15);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.currentSkipHandler) this.currentSkipHandler();
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audio && audio.paused) {
          audio.play().catch(() => {});
        }
      });
    } catch (err) {
      console.warn('MediaSession handler registration error:', err);
    }
  }

  /**
   * Updates the remaining time and label on the lockscreen widget
   */
  updateMediaSessionRestTimer(secondsLeft: number, exerciseName?: string) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('mediaSession' in navigator) || !this.isMediaSessionActive) {
      return;
    }

    try {
      const minutes = Math.floor(Math.max(0, secondsLeft) / 60);
      const seconds = Math.max(0, secondsLeft) % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const title = secondsLeft > 0 ? `راحة: ${timeStr} ⏱️` : 'انتهت الراحة! حان وقت الجولة ⚡';
      const artist = exerciseName ? `التالي: ${exerciseName}` : 'FORMA Live Activity';

      if ('MediaMetadata' in window) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album: 'FORMA Live Rest Timer',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
      }
    } catch (err) {
      console.warn('MediaSession update error:', err);
    }
  }

  /**
   * Stops lockscreen media widget when rest completes or is dismissed
   */
  stopMediaSessionRestTimer() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    this.isMediaSessionActive = false;
    this.currentAdjustHandler = null;
    this.currentSkipHandler = null;

    if (this.silentAudio) {
      this.silentAudio.pause();
      this.silentAudio.currentTime = 0;
    }

    try {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('play', null);
    } catch {
      // Ignore cleanup error
    }
  }
}

export const gymAudio = new GymAudioController();
