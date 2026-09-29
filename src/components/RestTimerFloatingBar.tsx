import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Check, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { useWorkoutTimer, workoutTimer } from '../lib/workoutTimer';
import { useReducedMotion } from './performance/useReducedMotion';
import { GYM_FLOOR_HAPTICS, pulseHaptic } from './mobile/gymFloorHaptics';

interface RestTimerFloatingBarProps {
  secondsLeft?: number | null;
  totalSeconds?: number;
  exerciseName?: string;
  onAdjust?: (delta: number) => void;
  onSkip?: () => void;
  onQuickWater?: () => void;
  waterLogged?: boolean;
  bottomOffset?: string;
}

const SAFE_BOTTOM = 'calc(0.75rem + max(0.75rem, var(--shell-safe-bottom, env(safe-area-inset-bottom, 0px))))';

export function RestTimerFloatingBar({
  secondsLeft: propsSecondsLeft,
  totalSeconds: propsTotalSeconds,
  exerciseName: propsExerciseName,
  onAdjust: propsOnAdjust,
  onSkip: propsOnSkip,
  onQuickWater,
  waterLogged,
  bottomOffset
}: RestTimerFloatingBarProps) {
  const { t, tExercise, isRTL } = useTranslation();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const reducedMotion = useReducedMotion();
  const restStartAnnounced = useRef(false);

  const timerState = useWorkoutTimer();
  const secondsLeft = propsSecondsLeft !== undefined ? propsSecondsLeft : timerState.secondsLeft;
  const totalSeconds = propsTotalSeconds !== undefined ? propsTotalSeconds : timerState.totalSeconds;
  const exerciseName = propsExerciseName !== undefined ? propsExerciseName : timerState.exerciseName;
  const onAdjust = propsOnAdjust || ((delta: number) => workoutTimer.adjust(delta));
  const onSkip = propsOnSkip || (() => workoutTimer.stop());

  useEffect(() => {
    if (secondsLeft !== null && secondsLeft >= 0) {
      gymAudio.startMediaSessionRestTimer({
        secondsLeft,
        totalSeconds,
        exerciseName,
        onAdjust,
        onSkip
      });
    } else {
      gymAudio.stopMediaSessionRestTimer();
    }

    return () => {
      gymAudio.stopMediaSessionRestTimer();
    };
  }, [secondsLeft !== null]);

  useEffect(() => {
    if (secondsLeft !== null && secondsLeft >= 0) {
      gymAudio.updateMediaSessionRestTimer(secondsLeft, exerciseName);
    }
  }, [secondsLeft, exerciseName]);

  useEffect(() => {
    if (secondsLeft === 10) {
      gymAudio.triggerSubtleHaptic([25]);
    } else if (secondsLeft === 0) {
      gymAudio.triggerSubtleHaptic([45, 60, 45]);
      pulseHaptic(GYM_FLOOR_HAPTICS.pr);
      if (isVoiceEnabled) {
        gymAudio.playRestTimerChime();
        gymAudio.speakVoiceCoach(
          isRTL ? 'انتهت الراحة! حان وقت الجولة التالية' : 'Rest complete! Time for the next set',
          isRTL ? 'ar' : 'en'
        );
      }
    }
  }, [secondsLeft, isVoiceEnabled, isRTL]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft < 0) {
      restStartAnnounced.current = false;
      return;
    }
    if (restStartAnnounced.current) return;
    if (secondsLeft > 0 && secondsLeft >= totalSeconds) {
      restStartAnnounced.current = true;
      pulseHaptic(GYM_FLOOR_HAPTICS.restStarted);
    }
  }, [secondsLeft, totalSeconds]);

  const spokenTime = useMemo(() => {
    if (secondsLeft === null || secondsLeft < 0) return '';
    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    if (isRTL) return `${minutes} دقيقة و${secs} ثانية متبقية من الراحة`;
    return `${minutes} minutes and ${secs} seconds of rest remaining`;
  }, [secondsLeft, isRTL]);

  if (secondsLeft === null || secondsLeft < 0) return null;

  const validTotal = totalSeconds > 0 ? totalSeconds : 90;
  const remainingFraction = Math.max(0, Math.min(1, secondsLeft / validTotal));

  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - remainingFraction);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isFinished = secondsLeft === 0;

  return (
    <AnimatePresence>
      <motion.aside
        className="rest-timer-floating-hud"
        initial={reducedMotion ? { opacity: 0 } : { y: 50, opacity: 0, scale: 0.96 }}
        animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.96 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
        role="region"
        aria-label={t('restTimer')}
        style={{
          position: 'fixed',
          bottom: bottomOffset || SAFE_BOTTOM,
          left: 0,
          right: 0,
          marginInline: 'auto',
          zIndex: 999,
          maxWidth: 'calc(100vw - 1.5rem)',
          width: '450px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'var(--premium-surface)',
          border: '1.5px solid color-mix(in srgb, var(--accent-primary) 45%, transparent)',
          borderRadius: '26px',
          boxShadow: '0 18px 48px -8px rgba(0, 0, 0, 0.65)',
          padding: '0.7rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          color: 'var(--text-primary)',
          userSelect: 'none',
          overflowAnchor: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 56 56"
              aria-hidden="true"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            >
              <defs>
                <linearGradient id="restRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2.5" />
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke={isFinished ? 'var(--success)' : 'url(#restRingGrad)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isFinished ? (
                <Check size={24} style={{ color: 'var(--success)' }} aria-hidden="true" />
              ) : (
                <span
                  className="session-countdown"
                  style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}
                >
                  {formattedTime}
                </span>
              )}
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: isFinished ? 'var(--success)' : 'var(--text-secondary)' }}>
                {isFinished ? (isRTL ? 'جاهز للجولة' : t('restComplete')) : (isRTL ? 'فترة الراحة' : t('resting'))}
              </span>

              <button
                type="button"
                className="rest-timer-voice-toggle rest-timer-control"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                aria-pressed={isVoiceEnabled}
                aria-label={isVoiceEnabled ? (isRTL ? 'كتم المدرب الصوتي' : 'Mute Voice Coach') : (isRTL ? 'تشغيل المدرب الصوتي' : 'Enable Voice Coach')}
                style={{
                  background: isVoiceEnabled ? 'var(--premium-soft)' : 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
                  border: `1px solid ${isVoiceEnabled ? 'color-mix(in srgb, var(--accent-primary) 30%, transparent)' : 'var(--premium-line)'}`,
                  color: isVoiceEnabled ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  padding: '0.12rem 0.6rem',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isVoiceEnabled ? <Volume2 size={13} aria-hidden="true" /> : <VolumeX size={13} aria-hidden="true" />}
                <span>{isRTL ? 'صوت' : 'Voice'}</span>
              </button>

              <span
                className="rest-timer-lockscreen-chip"
                style={{
                  background: 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
                  border: '1px solid var(--premium-line)',
                  color: 'var(--accent-primary)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}
                title={isRTL ? 'التحكم بالراحة معروض على شاشة القفل والإشعارات' : 'Rest timer active on lockscreen'}
              >
                <Smartphone size={11} aria-hidden="true" />
                <span>{isRTL ? 'شاشة القفل' : 'Lockscreen'}</span>
              </span>
            </div>

            {exerciseName && (
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {tExercise(exerciseName)}
              </p>
            )}
          </div>
        </div>

        <div className="rest-timer-control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="rest-timer-control"
            onClick={() => onAdjust(-15)}
            aria-label={isRTL ? 'إنقاص 15 ثانية' : 'Remove 15 seconds'}
            style={{
              minWidth: '48px',
              minHeight: '48px',
              padding: '0 0.6rem',
              fontSize: '0.78rem',
              fontWeight: 750,
              borderRadius: '12px',
              border: '1px solid var(--premium-line)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              cursor: 'pointer'
            }}
          >
            <Minus size={14} aria-hidden="true" />
            <span>15</span>
          </button>

          <button
            type="button"
            className="rest-timer-control"
            onClick={() => onAdjust(30)}
            aria-label={isRTL ? 'إضافة 30 ثانية' : 'Add 30 seconds'}
            style={{
              minWidth: '48px',
              minHeight: '48px',
              padding: '0 0.6rem',
              fontSize: '0.78rem',
              fontWeight: 750,
              borderRadius: '12px',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              background: 'var(--premium-soft)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} aria-hidden="true" />
            <span>30</span>
          </button>

          {onQuickWater && (
            <button
              type="button"
              className="rest-timer-control"
              onClick={onQuickWater}
              aria-pressed={waterLogged}
              aria-label={isRTL ? 'تسجيل شرب 250 مل ماء' : 'Log 250ml water'}
              style={{
                minWidth: '52px',
                minHeight: '48px',
                padding: '0 0.5rem',
                fontSize: '0.78rem',
                fontWeight: 750,
                borderRadius: '12px',
                border: '1px solid color-mix(in srgb, var(--accent-cyan) 35%, transparent)',
                background: waterLogged ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--premium-soft)',
                color: waterLogged ? 'var(--success)' : 'var(--accent-cyan)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                cursor: 'pointer'
              }}
            >
              <span aria-hidden="true">💧</span>
              <span>{waterLogged ? '✓' : '+250'}</span>
            </button>
          )}

          <button
            type="button"
            className="rest-timer-control"
            onClick={onSkip}
            aria-label={isRTL ? 'تخطي الراحة' : t('skipRest')}
            style={{
              minWidth: '52px',
              minHeight: '48px',
              padding: '0 0.6rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '12px',
              border: '1px solid var(--premium-line)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              cursor: 'pointer'
            }}
          >
            <X size={14} aria-hidden="true" />
            <span>{isRTL ? 'تخطي' : t('skipRest')}</span>
          </button>
        </div>

        <span className="forma-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {spokenTime}
        </span>
        <span className="forma-sr-only">{`${Math.round((1 - remainingFraction) * 100)}% ${isRTL ? 'من الراحة انقضى' : 'of rest elapsed'}`}</span>
      </motion.aside>
    </AnimatePresence>
  );
}
