import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Check, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { useWorkoutTimer, workoutTimer } from '../lib/workoutTimer';

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

  // Consume from isolated external store by default to avoid re-rendering parent view
  const timerState = useWorkoutTimer();
  const secondsLeft = propsSecondsLeft !== undefined ? propsSecondsLeft : timerState.secondsLeft;
  const totalSeconds = propsTotalSeconds !== undefined ? propsTotalSeconds : timerState.totalSeconds;
  const exerciseName = propsExerciseName !== undefined ? propsExerciseName : timerState.exerciseName;
  const onAdjust = propsOnAdjust || ((delta: number) => workoutTimer.adjust(delta));
  const onSkip = propsOnSkip || (() => workoutTimer.stop());

  // Synchronize Media Session API for Lockscreen live controls
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

  // Silent Haptic Focus: single pulse at 10s, double pulse at 0s
  useEffect(() => {
    if (secondsLeft === 10) {
      // 10-second warning haptic pulse
      gymAudio.triggerSubtleHaptic([25]);
    } else if (secondsLeft === 0) {
      // Double confirmation haptic pulse at 0s
      gymAudio.triggerSubtleHaptic([45, 60, 45]);
      if (isVoiceEnabled) {
        gymAudio.playRestTimerChime();
        gymAudio.speakVoiceCoach(
          isRTL ? 'انتهت الراحة! حان وقت الجولة التالية' : 'Rest complete! Time for the next set',
          isRTL ? 'ar' : 'en'
        );
      }
    }
  }, [secondsLeft, isVoiceEnabled, isRTL]);

  if (secondsLeft === null || secondsLeft < 0) return null;

  const validTotal = totalSeconds > 0 ? totalSeconds : 90;
  // Calculate remaining fraction (1 down to 0)
  const remainingFraction = Math.max(0, Math.min(1, secondsLeft / validTotal));

  // Circular progress ring geometry (56x56 viewBox, radius 23, strokeWidth 2.5)
  const radius = 23;
  const circumference = 2 * Math.PI * radius; // ~144.51
  const strokeDashoffset = circumference * (1 - remainingFraction);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isFinished = secondsLeft === 0;

  return (
    <AnimatePresence>
      <motion.aside
        className="rest-timer-floating-hud"
        initial={{ y: 50, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        role="region"
        aria-label={t('restTimer')}
        style={{
          position: 'fixed',
          bottom: bottomOffset || '1.5rem',
          left: 0,
          right: 0,
          marginInline: 'auto',
          zIndex: 999,
          maxWidth: 'calc(100vw - 1.5rem)',
          width: '450px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(11, 17, 30, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '26px',
          boxShadow: '0 18px 48px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 189, 248, 0.12)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
          color: 'var(--text-primary)',
          userSelect: 'none'
        }}
      >
        {/* Subtle, calm circular progress ring with centered countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            >
              <defs>
                <linearGradient id="restRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              {/* Calm, quiet background track */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="2.5"
              />
              {/* Thin, tranquil progress ring */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke={isFinished ? '#10b981' : 'url(#restRingGrad)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease'
                }}
              />
            </svg>

            {/* Calm, focused time display inside the ring - no flashing or blinking */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              {isFinished ? (
                <Check size={18} style={{ color: '#10b981' }} />
              ) : (
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    color: '#f8fafc'
                  }}
                >
                  {formattedTime}
                </span>
              )}
            </div>
          </div>

          {/* Exercise Info & Subtle Status */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: isFinished ? '#10b981' : 'var(--text-secondary)'
                }}
              >
                {isFinished ? (isRTL ? 'جاهز للجولة' : t('restComplete')) : (isRTL ? 'فترة الراحة' : t('resting'))}
              </span>

              {/* Minimal Voice Coach toggle button */}
              <button
                type="button"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                style={{
                  background: isVoiceEnabled ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isVoiceEnabled ? 'rgba(56, 189, 248, 0.28)' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: isVoiceEnabled ? '#38bdf8' : 'var(--text-muted)',
                  padding: '0.12rem 0.38rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.22rem',
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={isVoiceEnabled ? (isRTL ? 'كتم المدرب الصوتي' : 'Mute Voice Coach') : (isRTL ? 'تشغيل المدرب الصوتي' : 'Enable Voice Coach')}
              >
                {isVoiceEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                <span>{isRTL ? 'صوت' : 'Voice'}</span>
              </button>

              {/* Lockscreen Media Session active badge */}
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#38bdf8',
                  padding: '0.12rem 0.38rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.22rem',
                  fontSize: '0.62rem',
                  fontWeight: 600
                }}
                title={isRTL ? 'التحكم بالراحة معروض على شاشة القفل والإشعارات' : 'Rest timer active on lockscreen'}
              >
                <Smartphone size={9} />
                <span>{isRTL ? 'شاشة القفل' : 'Lockscreen'}</span>
              </span>
            </div>

            {exerciseName && (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3
                }}
              >
                {tExercise(exerciseName)}
              </p>
            )}
          </div>
        </div>

        {/* Quiet, calm stepper adjustments and skip button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: '0.35rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}
            onClick={() => onAdjust(-15)}
            title="-15s"
          >
            <Minus size={11} />
            <span>15</span>
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: '0.35rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              background: 'rgba(56, 189, 248, 0.08)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}
            onClick={() => onAdjust(30)}
            title="+30s"
          >
            <Plus size={11} />
            <span>30</span>
          </button>

          {onQuickWater && (
            <button
              type="button"
              className="btn-ghost"
              style={{
                padding: '0.35rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                background: waterLogged ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.12)',
                color: waterLogged ? '#10b981' : '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                cursor: 'pointer'
              }}
              onClick={onQuickWater}
              title={isRTL ? 'تسجيل شرب 250 مل ماء' : 'Log 250ml water'}
            >
              <span>💧</span>
              <span>{waterLogged ? '✓' : '+250'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              cursor: 'pointer'
            }}
            onClick={onSkip}
            title={t('skipRest')}
          >
            <X size={12} />
            <span>{isRTL ? 'تخطي' : t('skipRest')}</span>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
