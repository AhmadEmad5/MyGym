import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Droplets, 
  Flame, 
  Camera, 
  Check, 
  Smartphone,
  Zap
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { HistoryRecord, WorkoutSession } from '../lib/api';

interface HomeScreenQuickActionsWidgetProps {
  todaySessions: WorkoutSession[];
  history: HistoryRecord[];
  onLogWater: (amount: number) => Promise<void>;
  onOpenQuickWorkout: () => void;
  burnedCaloriesToday: number;
}

export function HomeScreenQuickActionsWidget({
  todaySessions,
  onLogWater,
  onOpenQuickWorkout,
  burnedCaloriesToday
}: HomeScreenQuickActionsWidgetProps) {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [waterLoggedAnim, setWaterLoggedAnim] = useState(false);
  const [showShortcutTip, setShowShortcutTip] = useState(false);

  const uncompletedToday = todaySessions.find(s => !s.isCompleted);

  const handleStartWorkout = () => {
    gymAudio.triggerVibration([20]);
    if (uncompletedToday) {
      navigate(`/session/${uncompletedToday.id}`);
    } else {
      onOpenQuickWorkout();
    }
  };

  const handleQuickWater = async () => {
    gymAudio.triggerVibration([25, 40]);
    setWaterLoggedAnim(true);
    await onLogWater(500);
    setTimeout(() => setWaterLoggedAnim(false), 2200);
  };

  const handleScanMeal = () => {
    gymAudio.triggerVibration([15]);
    navigate('/nutrition?action=scan-meal');
  };

  return (
    <motion.section
      className="home-quick-actions-widget"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginBottom: '1.75rem',
        padding: '1.15rem 1.25rem',
        borderRadius: '1.25rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.75))',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ambient background glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-30px',
          right: isRTL ? 'auto' : '-30px',
          left: isRTL ? '-30px' : 'auto',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.35)'
          }}>
            <Zap size={17} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('quickWidgetsTitle')}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'اختصارات سريعة بنقرة واحدة للهاتف' : '1-tap instant mobile shortcuts'}
            </span>
          </div>
        </div>

        {/* Today Burned Calories Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.14)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.76rem',
          fontWeight: 700
        }}>
          <Flame size={14} className="animate-pulse" />
          <span>{burnedCaloriesToday > 0 ? `${burnedCaloriesToday} kcal` : '0 kcal'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{t('todayBurnedCalories')}</span>
        </div>
      </div>

      {/* Grid of 3 Main Quick Action Buttons */}
      <div className="home-quick-actions-grid">
        {/* 1. Start Workout Action */}
        <motion.button
          type="button"
          className="quick-action-card-btn"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleStartWorkout}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '0.85rem 0.95rem',
            minHeight: '82px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(59, 130, 246, 0.22))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            cursor: 'pointer',
            textAlign: isRTL ? 'right' : 'left',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '0.35rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Play size={14} fill="currentColor" />
            </div>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#38bdf8'
            }}>
              {uncompletedToday ? t('startWorkout') : (isRTL ? 'تمرين سريع' : 'Quick')}
            </span>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>
              {t('quickWidgetWorkout')}
            </strong>
            <small style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {uncompletedToday ? uncompletedToday.title : (isRTL ? 'ابدأ الآن بنقرة' : 'Tap to start')}
            </small>
          </div>
        </motion.button>

        {/* 2. Quick +500ml Water */}
        <motion.button
          type="button"
          className="quick-action-card-btn"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleQuickWater}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '0.85rem 0.95rem',
            minHeight: '82px',
            borderRadius: '14px',
            background: waterLoggedAnim
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.3))'
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(14, 165, 233, 0.2))',
            border: waterLoggedAnim ? '1px solid #10b981' : '1px solid rgba(6, 182, 212, 0.35)',
            cursor: 'pointer',
            textAlign: isRTL ? 'right' : 'left',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '0.35rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: waterLoggedAnim ? '#10b981' : '#0891b2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              {waterLoggedAnim ? <Check size={15} /> : <Droplets size={15} />}
            </div>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: waterLoggedAnim ? '#10b981' : '#67e8f9'
            }}>
              +500 ml
            </span>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>
              {waterLoggedAnim ? (isRTL ? 'تم تسجيل +500ml! 💧' : '+500ml Added! 💧') : t('quickWidgetWater')}
            </strong>
            <small style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {isRTL ? 'تسجيل ترطيب سريع' : 'Instant hydration'}
            </small>
          </div>
        </motion.button>

        {/* 3. AI Meal Scanner */}
        <motion.button
          type="button"
          className="quick-action-card-btn"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleScanMeal}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '0.85rem 0.95rem',
            minHeight: '82px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(236, 72, 153, 0.2))',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            cursor: 'pointer',
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '0.35rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Camera size={14} />
            </div>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#f472b6'
            }}>
              AI Vision
            </span>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>
              {t('quickWidgetScanMeal')}
            </strong>
            <small style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {isRTL ? 'مسح الوجبة بالكاميرا' : 'Instant macro analysis'}
            </small>
          </div>
        </motion.button>
      </div>

      {/* PWA Home Screen Long-Press Tip Bar */}
      <div style={{
        marginTop: '0.85rem',
        paddingTop: '0.65rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.73rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Smartphone size={13} style={{ color: '#38bdf8' }} />
          <span>{t('pwaShortcutTip')}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowShortcutTip(!showShortcutTip)}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.2rem 0.4rem'
          }}
        >
          {showShortcutTip ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'تفاصيل' : 'Details')}
        </button>
      </div>

      {/* Expanded PWA Shortcut Tip details */}
      <AnimatePresence>
        {showShortcutTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
              marginTop: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}
          >
            {isRTL ? (
              <p style={{ margin: 0 }}>
                📱 <strong>اختصارات الشاشة الرئيسية (App Shortcuts):</strong> يمكنك تثبيت التطبيق على شاشة هاتفك (إضافة إلى الشاشة الرئيسية)، ثم الضغط مطولاً على أيقونة التطبيق للوصول فوراً إلى: <strong>بدء تمرين اليوم</strong>، <strong>تسجيل 500ml ماء</strong>، أو <strong>مسح وجبة ذكي</strong> دون الحاجة لفتح القوائم!
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                📱 <strong>Home Screen App Shortcuts:</strong> Install FORMA as a PWA on your home screen, then press & hold the app icon to access quick actions: <strong>Start Workout</strong>, <strong>+500ml Water</strong>, or <strong>AI Meal Scanner</strong> instantly!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
