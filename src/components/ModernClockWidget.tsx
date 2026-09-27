import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Sunrise, 
  Sun, 
  Moon, 
  Zap, 
  Calendar as CalendarIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Sparkles,
  Trophy,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface LapRecord {
  id: number;
  time: number;
  split: number;
}

const spring = { type: 'spring' as const, stiffness: 350, damping: 28 };

export function ModernClockWidget() {
  const { t, formatDate, isRTL } = useTranslation();

  // Time state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mygym_clock_is24h') === 'true';
    } catch {
      return false;
    }
  });

  // Mode: 'clock' or 'stopwatch'
  const [mode, setMode] = useState<'clock' | 'stopwatch'>('clock');

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  const stopwatchStartRef = useRef<number>(0);
  const stopwatchAccumulatedRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Synchronized Clock Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Format Persistence
  const toggleTimeFormat = () => {
    setIs24Hour(prev => {
      const next = !prev;
      try {
        localStorage.setItem('mygym_clock_is24h', String(next));
      } catch (e) {
        console.warn('Could not save clock format:', e);
      }
      return next;
    });
  };

  // Stopwatch Animation Frame Loop
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchStartRef.current = performance.now();

      const updateStopwatch = () => {
        const now = performance.now();
        const elapsed = stopwatchAccumulatedRef.current + (now - stopwatchStartRef.current);
        setStopwatchTime(elapsed);
        animFrameRef.current = requestAnimationFrame(updateStopwatch);
      };

      animFrameRef.current = requestAnimationFrame(updateStopwatch);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isStopwatchRunning]);

  const handleStartPauseStopwatch = () => {
    if (isStopwatchRunning) {
      // Pause
      stopwatchAccumulatedRef.current += performance.now() - stopwatchStartRef.current;
      setIsStopwatchRunning(false);
      if (isSoundEnabled) gymAudio.playCountdownBeep(false);
    } else {
      // Start
      stopwatchStartRef.current = performance.now();
      setIsStopwatchRunning(true);
      if (isSoundEnabled) gymAudio.playCountdownBeep(true);
    }
  };

  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false);
    stopwatchAccumulatedRef.current = 0;
    setStopwatchTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isStopwatchRunning && stopwatchTime === 0) return;
    
    const previousTotal = laps.length > 0 ? laps[0].time : 0;
    const split = stopwatchTime - previousTotal;
    
    const newLap: LapRecord = {
      id: laps.length + 1,
      time: stopwatchTime,
      split: split > 0 ? split : stopwatchTime
    };

    setLaps(prev => [newLap, ...prev]);
    if (isSoundEnabled) gymAudio.playCountdownBeep(false);
  };

  // Calculate fastest lap
  const fastestLapId = useMemo(() => {
    if (laps.length < 2) return null;
    let minSplit = Infinity;
    let bestId: number | null = null;
    laps.forEach(lap => {
      if (lap.split < minSplit) {
        minSplit = lap.split;
        bestId = lap.id;
      }
    });
    return bestId;
  }, [laps]);

  // Dynamic Day Phase & Energy
  const dayPhase = useMemo(() => {
    const hours = currentTime.getHours();

    if (hours >= 5 && hours < 11) {
      return {
        id: 'morning',
        title: t('morningPhase'),
        advice: t('morningAdvice'),
        icon: Sunrise,
        accent: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.28)',
        glow: 'rgba(245, 158, 11, 0.22)',
        gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.05))'
      };
    } else if (hours >= 11 && hours < 16) {
      return {
        id: 'midday',
        title: t('middayPhase'),
        advice: t('middayAdvice'),
        icon: Sun,
        accent: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.28)',
        glow: 'rgba(6, 182, 212, 0.22)',
        gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(14, 116, 144, 0.05))'
      };
    } else if (hours >= 16 && hours < 21) {
      return {
        id: 'evening',
        title: t('eveningPhase'),
        advice: t('eveningAdvice'),
        icon: Zap,
        accent: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: 'rgba(168, 85, 247, 0.28)',
        glow: 'rgba(168, 85, 247, 0.22)',
        gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(126, 34, 206, 0.05))'
      };
    } else {
      return {
        id: 'night',
        title: t('nightPhase'),
        advice: t('nightAdvice'),
        icon: Moon,
        accent: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.28)',
        glow: 'rgba(16, 185, 129, 0.22)',
        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(4, 120, 87, 0.05))'
      };
    }
  }, [currentTime, t]);

  // Formatted Clock Digits
  const clockDisplay = useMemo(() => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const milliseconds = currentTime.getMilliseconds();

    let period = '';
    if (!is24Hour) {
      period = hours >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM');
      hours = hours % 12 || 12;
    }

    return {
      hoursStr: hours.toString().padStart(2, '0'),
      minutesStr: minutes.toString().padStart(2, '0'),
      secondsStr: seconds.toString().padStart(2, '0'),
      period,
      exactSecondFrac: seconds + milliseconds / 1000
    };
  }, [currentTime, is24Hour, isRTL]);

  // Day percentage (0% to 100% of 24h passed)
  const dayProgressPercent = useMemo(() => {
    const totalSec = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    return Math.round((totalSec / 86400) * 100);
  }, [currentTime]);

  // Format stopwatch milliseconds into MM:SS.cs
  const formatStopwatch = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return {
      minStr: minutes.toString().padStart(2, '0'),
      secStr: seconds.toString().padStart(2, '0'),
      csStr: centiseconds.toString().padStart(2, '0')
    };
  };

  const PhaseIcon = dayPhase.icon;
  const swDisplay = formatStopwatch(stopwatchTime);

  // Circular gauge calculations (radius = 32, circumference ~ 201.06)
  const circleRadius = 32;
  const circumference = 2 * Math.PI * circleRadius;
  const secondStrokeOffset = circumference * (1 - clockDisplay.exactSecondFrac / 60);

  return (
    <motion.section
      className="modern-clock-widget"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, ...spring }}
      style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '1.25rem 1.45rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(16, 22, 38, 0.94), rgba(10, 14, 26, 0.98))',
        border: `1px solid ${dayPhase.border}`,
        boxShadow: `0 14px 40px -10px rgba(0, 0, 0, 0.55), 0 0 25px -8px ${dayPhase.glow}`,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      {/* Dynamic Aura Gradient in Background */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: isRTL ? 'auto' : '-40px',
          left: isRTL ? '-40px' : 'auto',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${dayPhase.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
          opacity: 0.65,
          zIndex: 0
        }}
      />

      {/* Top Header Controls */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          marginBottom: '1.15rem'
        }}
      >
        {/* Left / Start: Live Beacon + Day Phase Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Pulsing Live Beacon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.28rem 0.65rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                animation: 'livePulse 2s infinite ease-in-out'
              }}
            />
            <span>{t('liveTimeBadge')}</span>
          </div>

          {/* Dynamic Energy Phase Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.42rem',
              padding: '0.28rem 0.72rem',
              borderRadius: '999px',
              background: dayPhase.bg,
              border: `1px solid ${dayPhase.border}`,
              color: dayPhase.accent,
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <PhaseIcon size={14} />
            <span>{dayPhase.title}</span>
          </div>
        </div>

        {/* Right / End: Mode Switcher & Format Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.2rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              onClick={() => setMode('clock')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                background: mode === 'clock' ? dayPhase.accent : 'transparent',
                color: mode === 'clock' ? '#080d18' : 'var(--text-secondary, #94a3b8)',
                padding: '0.32rem 0.75rem',
                borderRadius: '9px',
                fontSize: '0.76rem',
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: mode === 'clock' ? `0 2px 10px ${dayPhase.glow}` : 'none'
              }}
            >
              <Clock size={13} />
              <span>{t('modeClock')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('stopwatch')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                background: mode === 'stopwatch' ? dayPhase.accent : 'transparent',
                color: mode === 'stopwatch' ? '#080d18' : 'var(--text-secondary, #94a3b8)',
                padding: '0.32rem 0.75rem',
                borderRadius: '9px',
                fontSize: '0.76rem',
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: mode === 'stopwatch' ? `0 2px 10px ${dayPhase.glow}` : 'none'
              }}
            >
              <Flag size={13} />
              <span>{t('modeStopwatch')}</span>
            </button>
          </div>

          {/* 12H / 24H Toggle (only visible in Clock Mode) */}
          {mode === 'clock' && (
            <button
              type="button"
              onClick={toggleTimeFormat}
              title={is24Hour ? 'Switch to 12-Hour format' : 'Switch to 24-Hour format'}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-primary, #e2e8f0)',
                padding: '0.35rem 0.65rem',
                borderRadius: '10px',
                fontSize: '0.74rem',
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = dayPhase.accent;
                e.currentTarget.style.color = dayPhase.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = 'var(--text-primary, #e2e8f0)';
              }}
            >
              {is24Hour ? '24H' : '12H'}
            </button>
          )}

          {/* Sound Toggle (in Stopwatch Mode) */}
          {mode === 'stopwatch' && (
            <button
              type="button"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              title={isSoundEnabled ? 'Disable Timer Sounds' : 'Enable Timer Sounds'}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: isSoundEnabled ? dayPhase.accent : '#64748b',
                padding: '0.35rem 0.55rem',
                borderRadius: '10px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Display */}
      <AnimatePresence mode="wait">
        {mode === 'clock' ? (
          <motion.div
            key="clock-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                alignItems: 'center',
                gap: '1.5rem',
                marginBottom: '1rem'
              }}
            >
              {/* Left Column: Big Glowing Digital Digits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.2rem',
                    flexWrap: 'nowrap'
                  }}
                >
                  {/* Hours */}
                  <span
                    style={{
                      fontSize: 'clamp(2.75rem, 6vw, 4.25rem)',
                      fontWeight: 850,
                      lineHeight: 1,
                      letterSpacing: '-0.05em',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                      background: 'linear-gradient(180deg, #ffffff 30%, #b0c4de 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: `0 0 35px ${dayPhase.glow}`
                    }}
                  >
                    {clockDisplay.hoursStr}
                  </span>

                  {/* Pulsing Colon */}
                  <span
                    style={{
                      fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: dayPhase.accent,
                      margin: '0 0.15rem',
                      animation: 'clockColonBlink 1s infinite steps(1, start)'
                    }}
                  >
                    :
                  </span>

                  {/* Minutes */}
                  <span
                    style={{
                      fontSize: 'clamp(2.75rem, 6vw, 4.25rem)',
                      fontWeight: 850,
                      lineHeight: 1,
                      letterSpacing: '-0.05em',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                      background: 'linear-gradient(180deg, #ffffff 30%, #b0c4de 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: `0 0 35px ${dayPhase.glow}`
                    }}
                  >
                    {clockDisplay.minutesStr}
                  </span>

                  {/* Seconds Super-script / Badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
                      fontWeight: 750,
                      color: dayPhase.accent,
                      marginInlineStart: '0.35rem',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                      opacity: 0.95
                    }}
                  >
                    :{clockDisplay.secondsStr}
                  </span>

                  {/* AM/PM Tag */}
                  {clockDisplay.period && (
                    <span
                      style={{
                        marginInlineStart: '0.65rem',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: dayPhase.accent,
                        letterSpacing: '0.04em'
                      }}
                    >
                      {clockDisplay.period}
                    </span>
                  )}
                </div>

                {/* Localized Full Date */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontSize: '0.92rem',
                    fontWeight: 600
                  }}
                >
                  <CalendarIcon size={15} style={{ color: dayPhase.accent, opacity: 0.85 }} />
                  <span>{formatDate(currentTime, 'EEEE · MMMM d, yyyy')}</span>
                </div>
              </div>

              {/* Right Column: Circular Second Radar + Advice Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap'
                }}
              >
                {/* SVG Circular Radar for Seconds */}
                <div
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    flexShrink: 0
                  }}
                >
                  <svg
                    viewBox="0 0 76 76"
                    style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
                  >
                    {/* Background Track */}
                    <circle
                      cx="38"
                      cy="38"
                      r={circleRadius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="4"
                    />
                    {/* Animated Seconds Arc */}
                    <circle
                      cx="38"
                      cy="38"
                      r={circleRadius}
                      fill="none"
                      stroke={dayPhase.accent}
                      strokeWidth="4.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={secondStrokeOffset}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dashoffset 0.2s linear',
                        filter: `drop-shadow(0 0 6px ${dayPhase.accent})`
                      }}
                    />
                  </svg>

                  {/* Inside Dial: Seconds Counter */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontVariantNumeric: 'tabular-nums lining-nums'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 850,
                        color: '#ffffff',
                        lineHeight: 1
                      }}
                    >
                      {clockDisplay.secondsStr}
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: dayPhase.accent,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginTop: '2px'
                      }}
                    >
                      sec
                    </span>
                  </div>
                </div>

                {/* Day Phase Advice Box */}
                <div
                  style={{
                    flex: '1 1 200px',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: dayPhase.accent,
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      marginBottom: '0.2rem'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{dayPhase.title}</span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary, #94a3b8)',
                      lineHeight: 1.35
                    }}
                  >
                    {dayPhase.advice}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Strip: 24h Day Progress Bar */}
            <div
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontWeight: 600
                }}
              >
                <span>{dayProgressPercent}% {t('dayElapsedLabel')}</span>
                <span style={{ color: dayPhase.accent, fontWeight: 700 }}>24H Cycle</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    width: `${dayProgressPercent}%`,
                    borderRadius: '999px',
                    background: `linear-gradient(90deg, ${dayPhase.accent}, #60a5fa)`
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          /* Stopwatch / Gym Timer Mode */
          <motion.div
            key="stopwatch-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0 1rem'
              }}
            >
              {/* Giant Stopwatch Digits */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '0.2rem',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  marginBottom: '1.25rem'
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(3rem, 7vw, 4.5rem)',
                    fontWeight: 850,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: `0 0 30px ${dayPhase.glow}`
                  }}
                >
                  {swDisplay.minStr}:{swDisplay.secStr}
                </span>

                <span
                  style={{
                    fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)',
                    fontWeight: 800,
                    color: dayPhase.accent,
                    marginInlineStart: '0.35rem'
                  }}
                >
                  .{swDisplay.csStr}
                </span>
              </div>

              {/* Stopwatch Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Start / Pause Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartPauseStopwatch}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.75rem 1.65rem',
                    borderRadius: '14px',
                    border: 'none',
                    background: isStopwatchRunning
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: isStopwatchRunning
                      ? '0 8px 24px rgba(245, 158, 11, 0.35)'
                      : '0 8px 24px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {isStopwatchRunning ? (
                    <>
                      <Pause size={18} fill="currentColor" />
                      <span>{t('stopwatchPause')}</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>{t('stopwatchStart')}</span>
                    </>
                  )}
                </motion.button>

                {/* Lap Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLap}
                  disabled={stopwatchTime === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.35rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: stopwatchTime === 0 ? '#475569' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: stopwatchTime === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Flag size={16} />
                  <span>{t('stopwatchLap')}</span>
                </motion.button>

                {/* Reset Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetStopwatch}
                  disabled={stopwatchTime === 0 && !isStopwatchRunning}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.75rem 1.15rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#f87171',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: stopwatchTime === 0 ? 'not-allowed' : 'pointer',
                    opacity: stopwatchTime === 0 ? 0.5 : 1
                  }}
                >
                  <RotateCcw size={16} />
                  <span>{t('stopwatchReset')}</span>
                </motion.button>
              </div>

              {/* Laps List */}
              {laps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    marginTop: '1.25rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '16px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    maxHeight: '160px',
                    overflowY: 'auto'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary, #94a3b8)',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      paddingBottom: '0.35rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <span>{t('stopwatchLapsTitle')} ({laps.length})</span>
                    <span>{t('splitDiff')}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {laps.map(lap => {
                      const isFastest = lap.id === fastestLapId;
                      const splitFormatted = formatStopwatch(lap.split);
                      const totalFormatted = formatStopwatch(lap.time);

                      return (
                        <div
                          key={lap.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '8px',
                            background: isFastest ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            border: isFastest ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                            fontSize: '0.82rem',
                            fontVariantNumeric: 'tabular-nums lining-nums'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary, #94a3b8)', fontWeight: 600 }}>
                              #{String(lap.id).padStart(2, '0')}
                            </span>
                            {isFastest && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  fontSize: '0.68rem',
                                  color: '#10b981',
                                  fontWeight: 800
                                }}
                              >
                                <Trophy size={11} />
                                {t('fastestLap')}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: '#ffffff', fontWeight: 700 }}>
                              {totalFormatted.minStr}:{totalFormatted.secStr}.{totalFormatted.csStr}
                            </span>
                            <span
                              style={{
                                color: isFastest ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                                fontSize: '0.76rem',
                                minWidth: '60px',
                                textAlign: 'end'
                              }}
                            >
                              +{splitFormatted.minStr}:{splitFormatted.secStr}.{splitFormatted.csStr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
