import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X, Printer, Dumbbell, Trophy,
  Activity, Flame, Clock, Award, ShieldCheck
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfWeek } from 'date-fns';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { computeAllPersonalRecords, estimateWorkoutCalories } from '../lib/api';
import { useReducedMotion } from './performance/useReducedMotion';
import { useModalA11y } from './AIMealVisionModal';

interface AthleteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DateRangeFilter = 'all' | '30days' | 'month' | 'week';

export function AthleteReportModal({ isOpen, onClose }: AthleteReportModalProps) {
  const { data } = useData();
  const { isRTL, formatDate, tTitle, tMuscle } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('30days');
  const [coachNotes, setCoachNotes] = useState('');

  const now = new Date();

  const filteredHistory = useMemo(() => {
    const list = (data?.history || []).slice().reverse();
    if (rangeFilter === 'all') return list;

    let cutoffDate: Date;
    if (rangeFilter === 'week') {
      cutoffDate = startOfWeek(now, { weekStartsOn: 6 }); // Saturday or Monday
    } else if (rangeFilter === 'month') {
      cutoffDate = startOfMonth(now);
    } else {
      cutoffDate = subDays(now, 30);
    }

    return list.filter(h => new Date(h.date).getTime() >= cutoffDate.getTime());
  }, [data?.history, rangeFilter]);

  const filteredMeals = useMemo(() => {
    const list = (data?.meals || []).slice().reverse();
    if (rangeFilter === 'all') return list;

    let cutoffDate: Date;
    if (rangeFilter === 'week') {
      cutoffDate = startOfWeek(now, { weekStartsOn: 6 });
    } else if (rangeFilter === 'month') {
      cutoffDate = startOfMonth(now);
    } else {
      cutoffDate = subDays(now, 30);
    }

    return list.filter(m => new Date(m.date).getTime() >= cutoffDate.getTime());
  }, [data?.meals, rangeFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    let totalVolumeKg = 0;
    let totalMinutes = 0;
    let totalCaloriesBurned = 0;
    const muscleMap: Record<string, number> = {};

    filteredHistory.forEach(h => {
      totalCaloriesBurned += h.burnedCalories || estimateWorkoutCalories(h.snapshot);
      totalMinutes += h.snapshot?.duration || 45;

      h.snapshot?.exercises?.forEach(ex => {
        const muscle = ex.targetMuscle || 'Other';
        muscleMap[muscle] = (muscleMap[muscle] || 0) + 1;

        ex.sets?.forEach(s => {
          if (s.isCompleted || s.repsActual > 0) {
            const w = s.unit === 'lb' ? s.weight * 0.453592 : s.weight;
            const r = s.repsActual || s.repsTarget || 0;
            totalVolumeKg += Math.round(w * r);
          }
        });
      });
    });

    const totalTons = (totalVolumeKg / 1000).toFixed(1);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      workoutCount: filteredHistory.length,
      totalVolumeKg,
      totalTons,
      totalMinutes,
      totalHours,
      totalCaloriesBurned,
      muscleMap
    };
  }, [filteredHistory]);

  // Personal Records
  const personalRecordsList = useMemo(() => {
    const recordsMap = computeAllPersonalRecords(data?.history || [], data?.sessions || []);
    return Object.values(recordsMap).sort((a, b) => (b.maxWeight || 0) - (a.maxWeight || 0));
  }, [data?.history, data?.sessions]);

  // Nutrition Averages
  const nutritionAvg = useMemo(() => {
    if (filteredMeals.length === 0) return null;
    const totalCal = filteredMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const totalPro = filteredMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    const totalCarb = filteredMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
    const totalFat = filteredMeals.reduce((acc, m) => acc + (m.fats || 0), 0);

    return {
      avgCal: Math.round(totalCal / filteredMeals.length),
      avgProtein: Math.round(totalPro / filteredMeals.length),
      avgCarbs: Math.round(totalCarb / filteredMeals.length),
      avgFats: Math.round(totalFat / filteredMeals.length),
      loggedCount: filteredMeals.length
    };
  }, [filteredMeals]);

  // Escape, focus containment, focus restore and the scroll lock all come from
  // the shared hook so this dialog behaves like every other FORMA modal.
  const { panelRef } = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getRangeLabel = () => {
    switch (rangeFilter) {
      case 'week': return isRTL ? 'تقرير الأسبوع الحالي' : 'This Week Report';
      case 'month': return isRTL ? 'تقرير الشهر الحالي' : 'This Month Report';
      case '30days': return isRTL ? 'تقرير آخر 30 يوماً' : 'Last 30 Days Report';
      default: return isRTL ? 'تقرير شامل لكل الفترات' : 'All-Time Comprehensive Report';
    }
  };

  return createPortal(
    <div
      className="modal-backdrop athlete-report-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
    >
      <motion.div
        ref={panelRef}
        className="card athlete-report-modal"
        role="dialog"
        aria-modal="true"
        aria-label={getRangeLabel()}
        tabIndex={-1}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 15 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94dvh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          borderRadius: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Top Action Bar (hidden when printing) */}
        <div 
          className="report-no-print"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Award size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {isRTL ? 'تصدير تقرير التدريب والتطور (PDF)' : 'Athlete Performance Report (PDF)'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'جاهز للطباعة أو الإرسال للمدرب وأخصائي التغذية' : 'Ready to print or send to personal trainer & dietitian'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Filter Buttons */}
            <div
              role="group"
              aria-label={isRTL ? 'نطاق التقرير' : 'Report range'}
              style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '0.2rem', border: '1px solid var(--border-color)' }}
            >
              {[
                { id: '30days', labelAr: '30 يوم', labelEn: '30D' },
                { id: 'month', labelAr: 'الشهر', labelEn: 'Month' },
                { id: 'week', labelAr: 'الأسبوع', labelEn: 'Week' },
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={rangeFilter === f.id}
                  onClick={() => setRangeFilter(f.id as DateRangeFilter)}
                  className="touch-target"
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: rangeFilter === f.id ? '1px solid #6366f1' : '1px solid transparent',
                    background: rangeFilter === f.id ? '#6366f1' : 'transparent',
                    color: rangeFilter === f.id ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isRTL ? f.labelAr : f.labelEn}
                </button>
              ))}
            </div>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                border: 'none',
                color: '#fff',
                padding: '0.55rem 1.15rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Printer size={16} aria-hidden="true" />
              <span>{isRTL ? 'طباعة / حفظ كـ PDF' : 'Print / Export PDF'}</span>
            </button>

            <button
              type="button"
              className="btn-icon btn-ghost touch-target"
              onClick={onClose}
              aria-label={isRTL ? 'إغلاق التقرير' : 'Close report'}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div 
          className="printable-athlete-report"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 2.5rem',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Printable Document Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '1.75rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <div style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em'
                }}>
                  FORMA PRO
                </div>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                  {isRTL ? 'تقرير الأداء الرياضي والتطور البدني' : 'Athlete Athletic Performance Report'}
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {getRangeLabel()} · {format(now, 'MMMM d, yyyy')}
              </p>
            </div>

            <div style={{ textAlign: isRTL ? 'left' : 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div><strong>{isRTL ? 'اللاعب:' : 'Athlete:'}</strong> {data?.user?.name || (isRTL ? 'متدرب FORMA' : 'FORMA Athlete')}</div>
              <div><strong>{isRTL ? 'الهدف:' : 'Primary Goal:'}</strong> {isRTL ? 'بناء القوة والكتلة وتطوير الأداء' : 'Strength, Hypertrophy & Performance'}</div>
              <div><strong>{isRTL ? 'المستوى:' : 'Experience Level:'}</strong> {isRTL ? 'متقدم (Pro Athlete)' : 'Pro Athlete'}</div>
            </div>
          </div>

          {/* 4 Executive KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            {/* Workouts */}
            <div style={{
              padding: '1.15rem',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#6366f1', marginBottom: '0.4rem' }}>
                <Activity size={22} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#6366f1', lineHeight: 1 }}>
                {stats.workoutCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 600 }}>
                {isRTL ? 'تمارين مكتملة' : 'Workouts Completed'}
              </div>
            </div>

            {/* Total Tonnage Lifted */}
            <div style={{
              padding: '1.15rem',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#06b6d4', marginBottom: '0.4rem' }}>
                <Dumbbell size={22} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06b6d4', lineHeight: 1 }}>
                {Number(stats.totalTons) > 0 ? `${stats.totalTons}t` : `${stats.totalVolumeKg}kg`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 600 }}>
                {isRTL ? 'الحجم الإجمالي المرفوع' : 'Total Volume Lifted'}
              </div>
            </div>

            {/* Total Training Hours */}
            <div style={{
              padding: '1.15rem',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#10b981', marginBottom: '0.4rem' }}>
                <Clock size={22} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                {stats.totalHours}h
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 600 }}>
                {isRTL ? 'ساعات التمرين الفعلي' : 'Total Training Hours'}
              </div>
            </div>

            {/* Burned Energy */}
            <div style={{
              padding: '1.15rem',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#f59e0b', marginBottom: '0.4rem' }}>
                <Flame size={22} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                {stats.totalCaloriesBurned}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 600 }}>
                {isRTL ? 'سعرات محروقة (kcal)' : 'Calories Burned'}
              </div>
            </div>
          </div>

          {/* Personal Records & Benchmark Lifts */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Trophy size={18} style={{ color: '#facc15' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {isRTL ? 'الأرقام القياسية المحطمة وقوة التحمل (Personal Records)' : 'Broken PRs & Benchmark Strength'}
              </h3>
            </div>

            {personalRecordsList.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem'
              }}>
                {personalRecordsList.slice(0, 6).map((pr) => (
                  <div
                    key={pr.exerciseName}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                        {pr.exerciseName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {pr.date ? formatDate(pr.date, 'yyyy-MM-dd') : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#facc15' }}>
                        {pr.maxWeight} {pr.unit}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        1RM: ~{pr.estimated1RM} {pr.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'لا توجد أرقام قياسية مسجلة بعد في هذه الفترة.' : 'No PR records recorded in this period yet.'}
              </div>
            )}
          </div>

          {/* Muscle Focus Breakdown */}
          {Object.keys(stats.muscleMap).length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
                {isRTL ? 'توزيع التمارين حسب المجموعات العضلية' : 'Target Muscle Distribution'}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.entries(stats.muscleMap).map(([muscle, count]) => (
                  <div
                    key={muscle}
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{tMuscle(muscle)}:</span>
                    <strong style={{ color: '#38bdf8' }}>{count} {isRTL ? 'تمرين' : 'ex'}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition Summary if available */}
          {nutritionAvg && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
                {isRTL ? 'متوسطات التغذية والماكروز في هذه الفترة' : 'Nutrition & Macro Averages'}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem'
              }}>
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{isRTL ? 'متوسط السعرات' : 'Avg Calories'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{nutritionAvg.avgCal} kcal</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#06b6d4' }}>{isRTL ? 'متوسط البروتين' : 'Avg Protein'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#06b6d4' }}>{nutritionAvg.avgProtein}g</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>{isRTL ? 'متوسط الكارب' : 'Avg Carbs'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{nutritionAvg.avgCarbs}g</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#ec4899' }}>{isRTL ? 'متوسط الدهون' : 'Avg Fats'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899' }}>{nutritionAvg.avgFats}g</div>
                </div>
              </div>
            </div>
          )}

          {/* Workout History Table */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
              {isRTL ? 'جدول الجلسات التدريبية المكتملة' : 'Completed Workout Sessions Log'}
            </h3>
            <div style={{
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              background: 'var(--bg-secondary)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', textAlign: isRTL ? 'right' : 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>{isRTL ? 'التاريخ' : 'Date'}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{isRTL ? 'اسم التمرين' : 'Workout Name'}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{isRTL ? 'المدة' : 'Duration'}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{isRTL ? 'التمارين' : 'Exercises'}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{isRTL ? 'الحجم المرفوع' : 'Volume'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.slice(0, 10).map((h, idx) => {
                    let sessVol = 0;
                    h.snapshot?.exercises?.forEach(e => {
                      e.sets?.forEach(s => {
                        const w = s.unit === 'lb' ? s.weight * 0.453592 : s.weight;
                        const r = s.repsActual || s.repsTarget || 0;
                        sessVol += Math.round(w * r);
                      });
                    });

                    return (
                      <tr key={h.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {format(new Date(h.date), 'yyyy-MM-dd')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                          {tTitle(h.title)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {h.snapshot?.duration || 45}m
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {h.snapshot?.exercises?.length || 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                          {sessVol > 0 ? `${sessVol} kg` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coach & Nutritionist Notes / Endorsement */}
          <div style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#10b981' }}>
              <ShieldCheck size={18} aria-hidden="true" />
              <strong style={{ fontSize: '0.9rem' }}>
                {isRTL ? 'ملاحظات وتوصيات المدرب الشخصي / أخصائي التغذية' : 'Coach & Nutritionist Evaluation / Recommendations'}
              </strong>
            </div>

            <textarea
              aria-label={isRTL ? 'ملاحظات المدرب' : 'Coach notes'}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder={isRTL ? 'اكتب هنا ملاحظاتك، إرشادات الأسابيع القادمة، أو خطة زيادة الأحمال التدريبية والتغذية...' : 'Write athlete progress feedback, progressive overload recommendations, or adjustments for upcoming weeks...'}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                resize: 'vertical',
                lineHeight: 1.4
              }}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px dashed var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <div>{isRTL ? 'اعتماد المدرب: ___________________' : 'Coach Signature: ___________________'}</div>
              <div>{isRTL ? 'تاريخ التوقيع: ___________________' : 'Date: ___________________'}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
