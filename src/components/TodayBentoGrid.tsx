import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, Dumbbell, Droplet, Trophy, 
  ArrowUpRight, Zap, Camera, 
  Moon, CheckCircle2, ShieldCheck, Activity
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { WorkoutSession } from '../lib/api';

interface TodayBentoGridProps {
  todayBurnedCalories: number;
  calorieBurnTarget?: number;
  workoutMinutes: number;
  workoutMinutesTarget?: number;
  todayWater: number;
  waterGoal?: number;
  todayCalories: number;
  dailyCaloriesTarget: number;
  todayProtein: number;
  dailyProteinTarget: number;
  activeSession: WorkoutSession | null;
  recoveryScore: number;
  streakDays: number;
  history: any[];
  sessions: WorkoutSession[];
  isFriday: boolean;
  onLogWater: (amount: number) => void;
  onOpenQuickWorkout: () => void;
  onNavigatePlan: () => void;
  onNavigateNutrition: () => void;
  onScrollToHologram: () => void;
}

export function TodayBentoGrid({
  todayBurnedCalories,
  calorieBurnTarget = 500,
  workoutMinutes,
  workoutMinutesTarget = 45,
  todayWater,
  waterGoal = 2500,
  todayCalories,
  dailyCaloriesTarget,
  todayProtein,
  dailyProteinTarget,
  activeSession,
  recoveryScore,
  streakDays,
  history,
  sessions,
  isFriday,
  onLogWater,
  onOpenQuickWorkout,
  onNavigatePlan,
  onNavigateNutrition,
  onScrollToHologram,
}: TodayBentoGridProps) {
  const { isRTL } = useTranslation();
  const [activeRing, setActiveRing] = useState<'calories' | 'workout' | 'water' | null>(null);

  // Calculate Ring Progresses (0 to 1+)
  const calProgress = Math.min(todayBurnedCalories / (calorieBurnTarget || 1), 1);
  const workoutProgress = Math.min(workoutMinutes / (workoutMinutesTarget || 1), 1);
  const waterProgress = Math.min(todayWater / (waterGoal || 1), 1);
  const allRingsClosed = calProgress >= 1 && workoutProgress >= 1 && waterProgress >= 1;

  // Ring Radii & Circumferences for concentric SVG rings
  // Outer (Calories): r=66, Middle (Workout): r=50, Inner (Water): r=34
  const rCal = 66;
  const cCal = 2 * Math.PI * rCal; // ~414.69
  const offsetCal = cCal * (1 - calProgress);

  const rWork = 50;
  const cWork = 2 * Math.PI * rWork; // ~314.16
  const offsetWork = cWork * (1 - workoutProgress);

  const rWater = 34;
  const cWater = 2 * Math.PI * rWater; // ~213.63
  const offsetWater = cWater * (1 - waterProgress);

  // Derive Focus Muscle from Active Session
  const focusMuscleInfo = useMemo(() => {
    if (isFriday) {
      return {
        nameAr: 'استشفاء كامل (عطلة الجمعة)',
        nameEn: 'Full Recovery (Friday Off-Day)',
        badge: '🛌 Rest & Grow',
        tone: 'amber',
        statusTextAr: 'الجيم مغلق — ركز على التغذية وإعادة بناء الألياف العضلية',
        statusTextEn: 'Gym is closed — prioritize nutrition & tissue regeneration'
      };
    }

    if (!activeSession) {
      return {
        nameAr: 'يوم استشفاء نشط',
        nameEn: 'Active Recovery Day',
        badge: '🌱 Mobility & Rest',
        tone: 'cyan',
        statusTextAr: 'لا توجد جلسة مجدولة لليوم — جاهزية الجسم ممتازة',
        statusTextEn: 'No session planned today — physical readiness is high'
      };
    }

    const titleLower = activeSession.title.toLowerCase();
    const exercisesText = (activeSession.exercises || []).map(e => e.name.toLowerCase()).join(' ');

    if (titleLower.includes('chest') || titleLower.includes('push') || exercisesText.includes('bench') || exercisesText.includes('press')) {
      return {
        nameAr: 'عضلات الصدر والدفع (Chest & Push)',
        nameEn: 'Chest & Push Muscles',
        badge: '🛡️ Pectorals / Triceps',
        tone: 'rose',
        statusTextAr: `مستهدف اليوم عبر ${activeSession.exercises?.length || 0} تمارين متخصصة`,
        statusTextEn: `Targeted today across ${activeSession.exercises?.length || 0} dedicated exercises`
      };
    } else if (titleLower.includes('back') || titleLower.includes('pull') || exercisesText.includes('row') || exercisesText.includes('pull')) {
      return {
        nameAr: 'عضلات الظهر والسحب (Back & Pull)',
        nameEn: 'Back & Pull Muscles',
        badge: '🦅 Lats / Rhomboids',
        tone: 'cyan',
        statusTextAr: `مستهدف اليوم عبر ${activeSession.exercises?.length || 0} تمارين متخصصة`,
        statusTextEn: `Targeted today across ${activeSession.exercises?.length || 0} dedicated exercises`
      };
    } else if (titleLower.includes('leg') || exercisesText.includes('squat') || exercisesText.includes('leg')) {
      return {
        nameAr: 'عضلات الأرجل والقوة (Legs & Quads)',
        nameEn: 'Legs & Lower Body',
        badge: '⚡ Quads / Hamstrings',
        tone: 'lime',
        statusTextAr: `مستهدف اليوم عبر ${activeSession.exercises?.length || 0} تمارين متخصصة`,
        statusTextEn: `Targeted today across ${activeSession.exercises?.length || 0} dedicated exercises`
      };
    } else if (titleLower.includes('shoulder') || exercisesText.includes('delt')) {
      return {
        nameAr: 'الأكتاف والمثلثات (Shoulders & Delts)',
        nameEn: 'Shoulders & Deltoids',
        badge: '🎯 Deltoids',
        tone: 'indigo',
        statusTextAr: `مستهدف اليوم عبر ${activeSession.exercises?.length || 0} تمارين متخصصة`,
        statusTextEn: `Targeted today across ${activeSession.exercises?.length || 0} dedicated exercises`
      };
    }

    return {
      nameAr: activeSession.title,
      nameEn: activeSession.title,
      badge: '💪 ' + activeSession.type,
      tone: 'cyan',
      statusTextAr: `${activeSession.exercises?.length || 0} تمارين مخطط لها اليوم`,
      statusTextEn: `${activeSession.exercises?.length || 0} exercises planned today`
    };
  }, [activeSession, isFriday]);

  // Compute 7-day Weekly consistency dots (starting Saturday for Middle East / Arab or Monday for en)
  const weekDays = useMemo(() => {
    const now = new Date();
    // Week start: Saturday (day 6 of previous week) or standard
    const start = startOfWeek(now, { weekStartsOn: 6 }); // Starts Saturday
    const days = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(start, i);
      const isPast = dayDate < now && !isSameDay(dayDate, now);
      const isCurrentDay = isSameDay(dayDate, now);
      const dayIsFriday = dayDate.getDay() === 5;

      const hasWorkout = history.some(h => isSameDay(new Date(h.date), dayDate)) ||
                         sessions.some(s => s.isCompleted && isSameDay(new Date(s.date), dayDate));

      const isScheduled = sessions.some(s => !s.isCompleted && isSameDay(new Date(s.date), dayDate));

      days.push({
        date: dayDate,
        dayName: format(dayDate, 'EEE'),
        dayNumber: format(dayDate, 'd'),
        isPast,
        isCurrentDay,
        dayIsFriday,
        hasWorkout,
        isScheduled
      });
    }
    return days;
  }, [history, sessions]);

  // Net energy calculation
  const netCalories = todayCalories - todayBurnedCalories;

  return (
    <div className="forma-bento-section" style={{ marginBottom: '1.5rem' }}>
      <div 
        className="forma-bento-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'stretch'
        }}
      >
        {/* ========================================================
            CARD 1: CONCENTRIC FITNESS ACTIVITY RINGS WIDGET
           ======================================================== */}
        <motion.div
          className="forma-bento-card bento-card-rings"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          style={{
            gridColumn: 'span 1',
            minHeight: '230px',
            padding: '1.25rem',
            borderRadius: '1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: isRTL ? 'auto' : '-20%',
            left: isRTL ? '-20%' : 'auto',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: allRingsClosed 
              ? 'radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Top Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity className="w-3.5 h-3.5 text-rose-500" style={{ color: '#f43f5e' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {isRTL ? 'حلقات النشاط اليومي' : 'Daily Activity Rings'}
              </span>
            </div>

            {allRingsClosed ? (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Trophy className="w-3 h-3" />
                <span>{isRTL ? 'مكتملة 100%' : '100% Closed!'}</span>
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {format(new Date(), 'EEEE')}
              </span>
            )}
          </div>

          {/* Rings & Legend Layout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            {/* SVG Concentric Rings */}
            <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
              <svg width="136" height="136" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background tracks */}
                <circle cx="80" cy="80" r={rCal} fill="none" stroke="#f43f5e" strokeWidth="10" strokeOpacity="0.16" />
                <circle cx="80" cy="80" r={rWork} fill="none" stroke="#bef264" strokeWidth="10" strokeOpacity="0.16" />
                <circle cx="80" cy="80" r={rWater} fill="none" stroke="#38bdf8" strokeWidth="10" strokeOpacity="0.16" />

                {/* Animated Progress Rings */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r={rCal}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={cCal}
                  initial={{ strokeDashoffset: cCal }}
                  animate={{ strokeDashoffset: offsetCal }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    filter: activeRing === 'calories' ? 'drop-shadow(0 0 6px #f43f5e)' : 'none'
                  }}
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r={rWork}
                  fill="none"
                  stroke="#bef264"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={cWork}
                  initial={{ strokeDashoffset: cWork }}
                  animate={{ strokeDashoffset: offsetWork }}
                  transition={{ duration: 1, delay: 0.15, ease: 'easeOut' }}
                  style={{
                    filter: activeRing === 'workout' ? 'drop-shadow(0 0 6px #bef264)' : 'none'
                  }}
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r={rWater}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={cWater}
                  initial={{ strokeDashoffset: cWater }}
                  animate={{ strokeDashoffset: offsetWater }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  style={{
                    filter: activeRing === 'water' ? 'drop-shadow(0 0 6px #38bdf8)' : 'none'
                  }}
                />
              </svg>

              {/* Center Icon in Ring */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <Flame className="w-5 h-5" style={{ color: '#f43f5e' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {Math.round(calProgress * 100)}%
                </span>
              </div>
            </div>

            {/* Interactive Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
              {/* Calories Item */}
              <div 
                onMouseEnter={() => setActiveRing('calories')}
                onMouseLeave={() => setActiveRing(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: activeRing === 'calories' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{isRTL ? 'حرق السعرات' : 'Move (Cal)'}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr' }}>
                  {todayBurnedCalories} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ {calorieBurnTarget}</span>
                </span>
              </div>

              {/* Exercise Minutes Item */}
              <div 
                onMouseEnter={() => setActiveRing('workout')}
                onMouseLeave={() => setActiveRing(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: activeRing === 'workout' ? 'rgba(190, 242, 100, 0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#bef264' }} />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{isRTL ? 'التمارين' : 'Exercise'}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr' }}>
                  {workoutMinutes} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ {workoutMinutesTarget}m</span>
                </span>
              </div>

              {/* Water Item */}
              <div 
                onMouseEnter={() => setActiveRing('water')}
                onMouseLeave={() => setActiveRing(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: activeRing === 'water' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{isRTL ? 'الترطيب' : 'Water'}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr' }}>
                  {todayWater} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ {waterGoal}ml</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================
            CARD 2: TODAY'S FOCUS TARGET MUSCLE & READINESS
           ======================================================== */}
        <motion.div
          className="forma-bento-card bento-card-muscle"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          style={{
            gridColumn: 'span 1',
            minHeight: '230px',
            padding: '1.25rem',
            borderRadius: '1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Title & Score */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(190, 242, 100, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Dumbbell className="w-3.5 h-3.5" style={{ color: '#bef264' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isRTL ? 'العضلة المستهدفة اليوم' : 'Target Focus Muscle'}
                </span>
              </div>

              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <ShieldCheck className="w-3 h-3" />
                <span>{isRTL ? `جاهزية ${recoveryScore}%` : `${recoveryScore}% Ready`}</span>
              </span>
            </div>

            {/* Muscle Name Highlight */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {isRTL ? focusMuscleInfo.nameAr : focusMuscleInfo.nameEn}
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                {isRTL ? focusMuscleInfo.statusTextAr : focusMuscleInfo.statusTextEn}
              </p>
            </div>
          </div>

          {/* Muscle Anatomy Mini Badge & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.85rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.3rem 0.65rem',
              borderRadius: '0.6rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)'
            }}>
              {focusMuscleInfo.badge}
            </span>

            <button
              onClick={() => {
                gymAudio.triggerSubtleHaptic([15]);
                onScrollToHologram();
              }}
              className="btn btn-ghost"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.4rem 0.75rem',
                borderRadius: '0.6rem',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--accent-primary)'
              }}
            >
              <span>{isRTL ? 'فحص المجسم 3D' : '3D Hologram'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
            </button>
          </div>
        </motion.div>

        {/* ========================================================
            CARD 3: ATHLETE STREAK & 7-DAY WEEK COMMITMENT TRACKER
           ======================================================== */}
        <motion.div
          className="forma-bento-card bento-card-streak"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          style={{
            gridColumn: 'span 1',
            minHeight: '230px',
            padding: '1.25rem',
            borderRadius: '1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Flame className="w-3.5 h-3.5 text-orange-500" style={{ color: '#f97316' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isRTL ? 'الالتزام والستريك' : 'Consistency Streak'}
                </span>
              </div>

              <span style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: streakDays > 0 ? '#f97316' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                🔥 {streakDays} {isRTL ? 'يوم' : 'Days'}
              </span>
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              {streakDays > 0 
                ? (isRTL ? 'أداء رائع! حافظ على الزخم وسلسلة التمارين.' : 'Crushing it! Keep the training momentum going.')
                : (isRTL ? 'ابدأ جلستك التدريبية اليوم لبدء سلسلتك الجديدة!' : 'Start today\'s session to ignite your new streak!')}
            </p>
          </div>

          {/* 7-Day Dot Tracker */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.35rem',
            padding: '0.65rem 0.5rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center'
          }}>
            {weekDays.map((d, index) => {
              const bg = d.hasWorkout 
                ? 'rgba(16, 185, 129, 0.2)' 
                : d.dayIsFriday 
                ? 'rgba(56, 189, 248, 0.12)' 
                : d.isCurrentDay 
                ? 'rgba(249, 115, 22, 0.15)' 
                : 'rgba(255, 255, 255, 0.04)';

              const border = d.isCurrentDay 
                ? '1px solid #f97316' 
                : d.hasWorkout 
                ? '1px solid #10b981' 
                : '1px solid transparent';

              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.64rem', color: d.isCurrentDay ? '#f97316' : 'var(--text-muted)', fontWeight: d.isCurrentDay ? 700 : 500 }}>
                    {d.dayName}
                  </span>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: bg,
                    border: border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: d.hasWorkout ? '#10b981' : d.dayIsFriday ? '#38bdf8' : 'var(--text-primary)'
                  }}>
                    {d.hasWorkout ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : d.dayIsFriday ? (
                      <Moon className="w-3 h-3 text-sky-400" />
                    ) : (
                      <span>{d.dayNumber}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'الجمعة عطلة استشفاء 🌙' : 'Friday Recovery 🌙'}
            </span>
            <button
              onClick={onNavigatePlan}
              className="text-xs"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.72rem',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {isRTL ? 'الجدول الكامل ←' : 'Full Schedule →'}
            </button>
          </div>
        </motion.div>

        {/* ========================================================
            CARD 4: QUICK FUEL SNAPSHOT & SPEED ACTIONS
           ======================================================== */}
        <motion.div
          className="forma-bento-card bento-card-fuel"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          style={{
            gridColumn: 'span 1',
            minHeight: '230px',
            padding: '1.25rem',
            borderRadius: '1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap className="w-3.5 h-3.5 text-emerald-500" style={{ color: '#10b981' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isRTL ? 'توازن الطاقة والبروتين' : 'Energy & Protein Balance'}
                </span>
              </div>

              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: netCalories <= dailyCaloriesTarget ? '#10b981' : '#f59e0b' }}>
                {netCalories <= dailyCaloriesTarget ? (isRTL ? 'في نطاق الهدف ✓' : 'On Track ✓') : (isRTL ? 'فائض سعرات' : 'Surplus')}
              </span>
            </div>

            {/* Protein Progress Pill */}
            <div style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '0.65rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  🥩 {isRTL ? 'البروتين المحقق' : 'Protein Target'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {todayProtein} / {dailyProteinTarget}g
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min((todayProtein / (dailyProteinTarget || 1)) * 100, 100)}%`, 
                    height: '100%', 
                    borderRadius: '9999px', 
                    backgroundColor: '#10b981',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
              {isRTL ? 'إجراءات سريعة بنقرة واحدة:' : 'Quick Actions:'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  gymAudio.triggerVibration([15]);
                  onLogWater(250);
                }}
                className="btn btn-ghost"
                style={{
                  padding: '0.45rem 0.3rem',
                  fontSize: '0.7rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  color: '#38bdf8'
                }}
                title={isRTL ? 'تسجيل 250 مل ماء' : 'Log 250ml water'}
              >
                <Droplet className="w-3.5 h-3.5" />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>+250ml</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateNutrition();
                }}
                className="btn btn-ghost"
                style={{
                  padding: '0.45rem 0.3rem',
                  fontSize: '0.7rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  color: '#10b981'
                }}
                title={isRTL ? 'تسجيل وجبة غذائية' : 'Log a meal'}
              >
                <Camera className="w-3.5 h-3.5" />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{isRTL ? 'مسح وجبة' : 'Scan Meal'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenQuickWorkout();
                }}
                className="btn btn-ghost"
                style={{
                  padding: '0.45rem 0.3rem',
                  fontSize: '0.7rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  color: 'var(--accent-primary)'
                }}
                title={isRTL ? 'تمرين حر سريع' : 'Quick workout'}
              >
                <Zap className="w-3.5 h-3.5" />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{isRTL ? 'تمرين حر' : 'Quick'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TodayBentoGrid;
