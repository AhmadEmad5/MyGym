import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Zap, Shield, Droplets, 
  Sparkles, Scale, Dumbbell, Clock
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { computeMuscleRecovery } from '../lib/recovery';
import { calculate1RM } from '../lib/api';

interface RadarAxis {
  id: 'strength' | 'endurance' | 'consistency' | 'balance' | 'fueling' | 'recovery';
  nameAr: string;
  nameEn: string;
  score: number; // 0 - 100
  icon: any;
  detailAr: string;
  detailEn: string;
  color: string;
}

export function AthleticPowerRadar() {
  const { data } = useData();
  const { isRTL } = useTranslation();
  const [selectedAxisId, setSelectedAxisId] = useState<string>('strength');

  // Compute 6 Real Pillars from Data
  const radarData = useMemo(() => {
    const history = data?.history || [];
    const sessions = data?.sessions || [];
    const meals = data?.meals || [];
    const waterLogs: Record<string, number> = data?.waterLogs || {};
    const insights = data?.insights;

    // 1. Max Strength Score (Based on peak estimated 1RMs)
    let peak1RM = 0;
    sessions.forEach(s => {
      s.exercises?.forEach(e => {
        e.sets?.forEach(set => {
          if (set.weight > 0 && set.repsActual > 0) {
            const wKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
            const oneRM = calculate1RM(wKg, set.repsActual);
            if (oneRM > peak1RM) peak1RM = oneRM;
          }
        });
      });
    });
    // Scale: 140kg 1RM = 100 score
    const strengthScore = Math.min(100, Math.max(35, Math.round((peak1RM / 140) * 100)));

    // 2. Muscular Endurance (High reps sets + cardio)
    let highRepSets = 0;
    let totalSets = 0;
    sessions.forEach(s => {
      s.exercises?.forEach(e => {
        e.sets?.forEach(set => {
          totalSets++;
          if (set.repsActual >= 12) highRepSets++;
        });
      });
    });
    const enduranceRatio = totalSets > 0 ? highRepSets / totalSets : 0.5;
    const enduranceScore = Math.min(100, Math.max(40, Math.round(enduranceRatio * 90) + 20));

    // 3. Consistency (Sessions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHistoryCount = history.filter(h => new Date(h.date) >= thirtyDaysAgo).length;
    // 16 workouts / 30 days = 100% consistency
    const consistencyScore = Math.min(100, Math.max(30, Math.round((recentHistoryCount / 16) * 100)));

    // 4. Muscle Balance (Upper vs Lower volume ratio)
    let upperCount = 0;
    let lowerCount = 0;
    sessions.forEach(s => {
      s.exercises?.forEach(e => {
        const m = (e.targetMuscle || '').toLowerCase();
        if (m.includes('leg') || m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('calf')) {
          lowerCount++;
        } else {
          upperCount++;
        }
      });
    });
    let balanceScore = 80;
    if (upperCount + lowerCount > 0) {
      const ratio = Math.min(upperCount, lowerCount) / Math.max(upperCount, lowerCount, 1);
      balanceScore = Math.min(100, Math.max(40, Math.round(ratio * 100) + 15));
    }

    // 5. Fueling & Hydration (Meals & Water goal adherence)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayWater = waterLogs[todayStr] || 0;
    const waterGoal = data?.nutritionGoals?.dailyWaterMl || 2500;
    const waterPct = Math.min(100, Math.round((todayWater / waterGoal) * 100));
    const recentMealsCount = meals.length;
    const fuelingScore = Math.min(100, Math.max(35, Math.round((waterPct * 0.6) + Math.min(40, recentMealsCount * 8))));

    // 6. Recovery Rate
    const recoveryCalc = computeMuscleRecovery(history, sessions);
    const sleepVal = insights?.sleepHours || 7;
    const sleepBonus = Math.min(100, Math.round((sleepVal / 8) * 100));
    const recoveryScore = Math.min(100, Math.max(30, Math.round((recoveryCalc.overallScore * 0.6) + (sleepBonus * 0.4))));

    const axes: RadarAxis[] = [
      {
        id: 'strength',
        nameAr: 'القوة القصوى',
        nameEn: 'Max Strength',
        score: strengthScore,
        icon: Dumbbell,
        detailAr: `الوزن الأقصى التقديري (1RM): ${Math.round(peak1RM)}kg. يعكس قوتك العضلية في الرفعات المركبة.`,
        detailEn: `Estimated 1RM: ${Math.round(peak1RM)}kg. Measures maximum force output on compound lifts.`,
        color: '#c6f432'
      },
      {
        id: 'endurance',
        nameAr: 'التحمل العضلي',
        nameEn: 'Endurance',
        score: enduranceScore,
        icon: Zap,
        detailAr: `نسبة التكرارات المرتفعة وتمارين الكارديو المسجلة: ${enduranceScore}%. يوضح مقاومة العضلات للإجهاد.`,
        detailEn: `High-rep volume & cardio density: ${enduranceScore}%. Indicates muscular fatigue resistance.`,
        color: '#38bdf8'
      },
      {
        id: 'consistency',
        nameAr: 'الاستمرارية',
        nameEn: 'Consistency',
        score: consistencyScore,
        icon: Clock,
        detailAr: `تم إكمال ${recentHistoryCount} تمرين خلال آخر 30 يوماً. الالتزام هو مفتاح التقدم الحقيقي.`,
        detailEn: `Completed ${recentHistoryCount} workouts in the last 30 days. Regularity drives progress.`,
        color: '#10b981'
      },
      {
        id: 'balance',
        nameAr: 'التناسق العضلي',
        nameEn: 'Muscle Balance',
        score: balanceScore,
        icon: Scale,
        detailAr: `التوازن بين الجزء العلوي والسفلي: ${balanceScore}%. توازن ممتاز لمنع الاختلالات المفصلية.`,
        detailEn: `Upper to lower body ratio: ${balanceScore}%. Essential for joint integrity and symmetry.`,
        color: '#f59e0b'
      },
      {
        id: 'fueling',
        nameAr: 'التغذية والترطيب',
        nameEn: 'Fueling',
        score: fuelingScore,
        icon: Droplets,
        detailAr: `تسجيل الوجبات والترطيب: ${fuelingScore}%. شرب الماء والبروتين الكافي وقود النمو العضلي.`,
        detailEn: `Hydration & meal adherence: ${fuelingScore}%. Crucial for muscle glycogen and performance.`,
        color: '#06b6d4'
      },
      {
        id: 'recovery',
        nameAr: 'التعافي والاستشفاء',
        nameEn: 'Recovery',
        score: recoveryScore,
        icon: Shield,
        detailAr: `مستوى استشفاء الألياف والنوم: ${recoveryScore}%. البناء العضلي يحدث أثناء الراحة والنوم العميق.`,
        detailEn: `Tissue repair & sleep quality: ${recoveryScore}%. True hypertrophy happens during deep rest.`,
        color: '#a855f7'
      }
    ];

    const overallScore = Math.round(
      (strengthScore + enduranceScore + consistencyScore + balanceScore + fuelingScore + recoveryScore) / 6
    );

    let athleteTier = { titleAr: 'رياضي صاعد 🌱', titleEn: 'RISING ATHLETE', color: '#38bdf8' };
    if (overallScore >= 90) {
      athleteTier = { titleAr: 'رياضي نخبوي أسطوري ⚡', titleEn: 'ELITE PRO ATHLETE', color: '#c6f432' };
    } else if (overallScore >= 80) {
      athleteTier = { titleAr: 'بطل متقدم 🏆', titleEn: 'MASTER ATHLETE', color: '#facc15' };
    } else if (overallScore >= 70) {
      athleteTier = { titleAr: 'محارب ملتزم 🔥', titleEn: 'ADVANCED WARRIOR', color: '#10b981' };
    } else if (overallScore >= 55) {
      athleteTier = { titleAr: 'متمرس صلب 💪', titleEn: 'INTERMEDIATE', color: '#38bdf8' };
    }

    return { axes, overallScore, athleteTier };
  }, [data]);

  const { axes, overallScore, athleteTier } = radarData;
  const selectedAxis = axes.find(a => a.id === selectedAxisId) || axes[0];

  // SVG Geometry for Hexagon (Radius = 90, Center = (140, 140))
  const cx = 140;
  const cy = 140;
  const maxR = 85;

  const getCoordinates = (index: number, scoreRatio: number) => {
    // 6 vertices separated by 60 degrees (PI / 3), start at top (-PI / 2)
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = maxR * Math.max(0.15, Math.min(1, scoreRatio));
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // Polygon string for active athlete scores
  const athletePolygonPoints = axes.map((a, i) => {
    const pt = getCoordinates(i, a.score / 100);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // Background grid level rings (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 18, 28, 0.9) 0%, rgba(8, 12, 20, 0.96) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '22px',
      padding: 'clamp(0.85rem, 2.5vw, 1.4rem)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      marginBottom: '1.75rem'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(198, 244, 50, 0.2))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
              {isRTL ? 'رادار القوة والأداء الرياضي الشامل' : 'Athletic Power Radar'}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'تحليل سداسي الأبعاد للياقة الرياضية والقوة' : '6-Pillar Biomechanical Performance Profile'}
            </span>
          </div>
        </div>

        {/* Athletic Tier Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${athleteTier.color}40`,
          boxShadow: `0 0 14px ${athleteTier.color}25`
        }}>
          <Sparkles size={14} style={{ color: athleteTier.color }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 850, color: athleteTier.color }}>
            {isRTL ? athleteTier.titleAr : athleteTier.titleEn}
          </span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            background: athleteTier.color,
            color: '#080c14',
            padding: '0.1rem 0.45rem',
            borderRadius: '6px'
          }}>
            {overallScore}
          </span>
        </div>
      </div>

      {/* Main Radar Display & Detailed Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: '1.25rem',
        alignItems: 'center'
      }}>
        {/* Left: SVG Hexagon Web Chart */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem 0',
          width: '100%',
          overflow: 'hidden'
        }}>
          <svg
            viewBox="-30 -25 340 330"
            style={{
              width: '100%',
              maxWidth: '300px',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              overflow: 'visible'
            }}
          >
            <defs>
              <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#c6f432" stopOpacity="0.3" />
              </linearGradient>
              <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Hexagon Rings */}
            {gridLevels.map((lvl, idx) => {
              const pts = [0, 1, 2, 3, 4, 5].map(i => {
                const pt = getCoordinates(i, lvl);
                return `${pt.x},${pt.y}`;
              }).join(' ');
              return (
                <polygon
                  key={idx}
                  points={pts}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray={idx < 3 ? '3 3' : undefined}
                />
              );
            })}

            {/* Axis Spokes radiating from center */}
            {[0, 1, 2, 3, 4, 5].map(i => {
              const pt = getCoordinates(i, 1.0);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={pt.x}
                  y2={pt.y}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Athlete Active Filled Polygon */}
            <motion.polygon
              points={athletePolygonPoints}
              fill="url(#radarFillGrad)"
              stroke="#38bdf8"
              strokeWidth="2.5"
              filter="url(#radarGlow)"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Vertex Nodes with Click Interactivity */}
            {axes.map((axis, idx) => {
              const pt = getCoordinates(idx, axis.score / 100);
              const labelPt = getCoordinates(idx, 1.25);
              const isSelected = selectedAxisId === axis.id;

              return (
                <g key={axis.id} cursor="pointer" onClick={() => setSelectedAxisId(axis.id)}>
                  {/* Glowing Vertex Circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6.5 : 4.5}
                    fill={isSelected ? '#ffffff' : axis.color}
                    stroke={isSelected ? axis.color : '#080c14'}
                    strokeWidth="2"
                    style={{ transition: 'all 0.2s' }}
                  />

                  {/* Axis Label Text */}
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : 'var(--text-secondary)'}
                    fontSize={isSelected ? '11.5' : '10'}
                    fontWeight={isSelected ? '800' : '600'}
                    style={{ transition: 'all 0.2s', userSelect: 'none' }}
                  >
                    {isRTL ? axis.nameAr : axis.nameEn}
                  </text>
                </g>
              );
            })}

            {/* Center Athlete Score Pill */}
            <circle cx={cx} cy={cy} r="18" fill="rgba(8, 12, 20, 0.85)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="900"
            >
              {overallScore}
            </text>
          </svg>
        </div>

        {/* Right: Selected Pillar Details & Athletic Advice */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAxis.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  padding: '0.4rem',
                  borderRadius: '10px',
                  background: `${selectedAxis.color}20`,
                  color: selectedAxis.color,
                  display: 'flex'
                }}>
                  <selectedAxis.icon size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    {isRTL ? selectedAxis.nameAr : selectedAxis.nameEn}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isRTL ? 'مؤشر أداء حي' : 'Live Athletic Metric'}
                  </span>
                </div>
              </div>

              {/* Score Value */}
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: selectedAxis.color,
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.2rem'
              }}>
                <span>{selectedAxis.score}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>

            {/* Score Track */}
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${selectedAxis.score}%`,
                background: selectedAxis.color,
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            {/* Physiological Breakdown Text */}
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isRTL ? selectedAxis.detailAr : selectedAxis.detailEn}
            </p>

            {/* Quick 6-Axis Mini Switcher Pills */}
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              flexWrap: 'wrap',
              marginTop: '0.35rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '0.65rem'
            }}>
              {axes.map(ax => (
                <button
                  key={ax.id}
                  type="button"
                  onClick={() => setSelectedAxisId(ax.id)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: selectedAxisId === ax.id ? `1px solid ${ax.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: selectedAxisId === ax.id ? `${ax.color}25` : 'rgba(255, 255, 255, 0.02)',
                    color: selectedAxisId === ax.id ? ax.color : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isRTL ? ax.nameAr : ax.nameEn}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
