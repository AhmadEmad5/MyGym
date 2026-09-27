import { useMemo, useState } from 'react';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { Flame } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import type { HistoryRecord, WorkoutSession } from '../lib/api';

interface WeeklyProgressChartProps {
  history: HistoryRecord[];
  sessions: WorkoutSession[];
}

export function WeeklyProgressChart({ history, sessions }: WeeklyProgressChartProps) {
  const { t, formatDate, isRTL } = useTranslation();
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  // Compute 7 days up to today
  const weekData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const dayDate = subDays(today, i);
      
      // Check history and sessions for this day
      const dayHistory = (history || []).filter(h => isSameDay(new Date(h.date), dayDate));
      const daySessions = (sessions || []).filter(s => isSameDay(new Date(s.date), dayDate) && s.isCompleted);
      
      const isCompleted = dayHistory.length > 0 || daySessions.length > 0;
      
      // Calculate minutes and calories
      const historyMinutes = dayHistory.reduce((acc, h) => acc + (h.snapshot?.duration || 30), 0);
      const sessionMinutes = daySessions.reduce((acc, s) => acc + (s.duration || 30), 0);
      const duration = Math.max(historyMinutes, sessionMinutes);

      const calories = dayHistory.reduce((acc, h) => acc + (h.burnedCalories || 0), 0) || (isCompleted ? duration * 7.5 : 0);

      // Volume lifted in kg
      let volumeKg = 0;
      const allExercises = [
        ...dayHistory.flatMap(h => h.snapshot?.exercises || []),
        ...daySessions.flatMap(s => s.exercises || [])
      ];

      allExercises.forEach(ex => {
        ex.sets?.forEach(set => {
          if (set.isCompleted || set.weight > 0) {
            const w = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
            const r = set.repsActual || set.repsTarget || 0;
            volumeKg += Math.round(w * r);
          }
        });
      });

      days.push({
        date: dayDate,
        dayNameShort: formatDate(dayDate, 'EEE'),
        dayNumber: format(dayDate, 'd'),
        isToday: i === 0,
        isCompleted,
        duration: Math.round(duration),
        calories: Math.round(calories),
        volumeKg: Math.round(volumeKg)
      });
    }

    return days;
  }, [history, sessions, formatDate]);

  // Compute streak
  const streak = useMemo(() => {
    let count = 0;
    const today = startOfDay(new Date());

    // Check if worked out today or yesterday to start streak
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasWorkout = (history || []).some(h => isSameDay(new Date(h.date), checkDate)) ||
                         (sessions || []).some(s => s.isCompleted && isSameDay(new Date(s.date), checkDate));
      
      if (hasWorkout) {
        count++;
      } else {
        // If today hasn't been worked out yet, give grace for yesterday
        if (i === 0) continue;
        break;
      }
    }
    return count;
  }, [history, sessions]);

  // Summary stats for the 7-day window
  const totals = useMemo(() => {
    return weekData.reduce((acc, d) => ({
      completedDays: acc.completedDays + (d.isCompleted ? 1 : 0),
      duration: acc.duration + d.duration,
      calories: acc.calories + d.calories,
      volumeKg: acc.volumeKg + d.volumeKg
    }), { completedDays: 0, duration: 0, calories: 0, volumeKg: 0 });
  }, [weekData]);

  // Max duration or volume for scaling bars
  const maxDuration = Math.max(...weekData.map(d => d.duration), 60);

  return (
    <div className="card weekly-chart-card" style={{
      padding: '1.25rem',
      borderRadius: '20px',
      background: 'linear-gradient(145deg, rgba(26, 32, 44, 0.85), rgba(15, 20, 30, 0.95))',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      marginBottom: '1.5rem',
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        [isRTL ? 'left' : 'right']: '-40px',
        width: '140px',
        height: '140px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            padding: '0.5rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2))',
            borderRadius: '12px',
            color: '#f97316',
            display: 'flex'
          }}>
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {isRTL ? 'النشاط الأسبوعي والاستمرارية' : 'Weekly Activity & Streak'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'آخر 7 أيام من أدائك البدني' : 'Last 7 days of training performance'}
            </p>
          </div>
        </div>

        {/* Streak Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '999px',
          background: streak > 0 
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2))'
            : 'rgba(255, 255, 255, 0.06)',
          border: streak > 0 ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
          color: streak > 0 ? '#fb923c' : 'var(--text-muted)',
          fontSize: '0.82rem',
          fontWeight: 700
        }}>
          <Flame size={15} />
          <span>
            {streak > 0 
              ? (isRTL ? `${streak} أيام متتالية!` : `${streak} Day Streak!`) 
              : (isRTL ? 'ابدأ سلسلتك اليوم!' : 'Start your streak!')}
          </span>
        </div>
      </div>

      {/* Quick stat chips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))',
        gap: '0.65rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          padding: '0.65rem 0.8rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isRTL ? 'التمارين' : 'Sessions'}
          </span>
          <strong style={{ fontSize: '1.15rem', color: '#60a5fa', fontWeight: 800 }}>
            {totals.completedDays} / 7
          </strong>
        </div>

        <div style={{
          padding: '0.65rem 0.8rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isRTL ? 'الوقت الإجمالي' : 'Total Time'}
          </span>
          <strong style={{ fontSize: '1.15rem', color: '#a78bfa', fontWeight: 800 }}>
            {totals.duration} <small style={{ fontSize: '0.7rem', fontWeight: 500 }}>{t('min')}</small>
          </strong>
        </div>

        <div style={{
          padding: '0.65rem 0.8rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isRTL ? 'السعرات' : 'Calories'}
          </span>
          <strong style={{ fontSize: '1.15rem', color: '#f87171', fontWeight: 800 }}>
            {totals.calories} <small style={{ fontSize: '0.7rem', fontWeight: 500 }}>kcal</small>
          </strong>
        </div>

        {totals.volumeKg > 0 && (
          <div style={{
            padding: '0.65rem 0.8rem',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              {isRTL ? 'إجمالي الحجم' : 'Total Volume'}
            </span>
            <strong style={{ fontSize: '1.15rem', color: '#34d399', fontWeight: 800 }}>
              {totals.volumeKg > 1000 ? `${(totals.volumeKg / 1000).toFixed(1)}t` : `${totals.volumeKg}kg`}
            </strong>
          </div>
        )}
      </div>

      {/* 7-Day Chart Bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '110px',
        padding: '0 0.5rem 0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '0.5rem'
      }}>
        {weekData.map((d, index) => {
          const heightPercent = d.isCompleted 
            ? Math.max(25, Math.min(100, Math.round((d.duration / maxDuration) * 100))) 
            : 8;
          const isSelected = activeDayIndex === index;

          return (
            <div
              key={index}
              onClick={() => setActiveDayIndex(isSelected ? null : index)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {/* Tooltip on hover/click */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: '105%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.72rem',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  zIndex: 20,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                  pointerEvents: 'none',
                  textAlign: 'center'
                }}>
                  <div><strong>{d.dayNameShort} {d.dayNumber}</strong></div>
                  <div>{d.isCompleted ? `${d.duration} ${t('min')} · ${d.calories} kcal` : (isRTL ? 'يوم راحة' : 'Rest Day')}</div>
                </div>
              )}

              {/* Bar */}
              <div style={{
                width: '100%',
                maxWidth: '28px',
                height: `${heightPercent}%`,
                borderRadius: '8px 8px 4px 4px',
                background: d.isToday
                  ? 'linear-gradient(180deg, #38bdf8, #2563eb)'
                  : d.isCompleted
                  ? 'linear-gradient(180deg, #10b981, #059669)'
                  : 'rgba(255, 255, 255, 0.08)',
                boxShadow: d.isToday
                  ? '0 0 14px rgba(56, 189, 248, 0.4)'
                  : d.isCompleted
                  ? '0 0 10px rgba(16, 185, 129, 0.25)'
                  : 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isSelected ? 'scaleX(1.15)' : 'none'
              }} />

              {/* Day Label */}
              <div style={{
                marginTop: '0.45rem',
                fontSize: '0.72rem',
                fontWeight: d.isToday ? 700 : 500,
                color: d.isToday ? '#38bdf8' : d.isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {d.dayNameShort}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
