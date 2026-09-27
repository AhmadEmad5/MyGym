import { motion } from 'framer-motion';
import { Droplet, Plus } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { gymAudio } from '../../lib/audio';

interface MobileFloorVitalsProps {
  waterAmount: number;
  waterGoal?: number;
  onQuickWater: (amount: number) => void;
  calories: number;
  calorieGoal?: number;
  protein: number;
  proteinGoal?: number;
  onOpenNutrition?: () => void;
}

export function MobileFloorVitals({
  waterAmount,
  waterGoal = 3000,
  onQuickWater,
  calories,
  calorieGoal = 2500,
  protein,
  proteinGoal = 150,
  onOpenNutrition,
}: MobileFloorVitalsProps) {
  const { isRTL } = useTranslation();

  const waterPercent = Math.min(100, Math.round((waterAmount / waterGoal) * 100));
  const calPercent = Math.min(100, Math.round((calories / (calorieGoal || 1)) * 100));

  const handleAddWater = (e: React.MouseEvent) => {
    e.stopPropagation();
    gymAudio.triggerSubtleHaptic([20]);
    onQuickWater(250);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.75rem',
      marginBottom: '1.25rem'
    }}>
      {/* Hydration Quick Pill */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'rgba(13, 27, 46, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '20px',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Fill level watermark */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${waterPercent}%`,
          background: 'linear-gradient(to top, rgba(6, 182, 212, 0.15), transparent)',
          pointerEvents: 'none',
          transition: 'height 0.4s ease'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 1 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Droplet className="w-5 h-5 fill-cyan-400 text-cyan-400" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
              {waterAmount} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ml</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>
              {waterPercent}% {isRTL ? 'الماء' : 'Goal'}
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={handleAddWater}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2
          }}
          title="+250ml water"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Macros / Nutrition Pill */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onOpenNutrition}
        style={{
          background: 'rgba(13, 27, 46, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '20px',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          cursor: onOpenNutrition ? 'pointer' : 'default',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
              {calories}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginInlineStart: '0.25rem' }}>
              kcal
            </span>
          </div>
          <div title={`Target: ${proteinGoal}g`}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
              {protein}g
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginInlineStart: '0.25rem' }}>
              /{proteinGoal}g
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '5px',
          borderRadius: '3px',
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${calPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #38bdf8)',
            borderRadius: '3px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </motion.div>
    </div>
  );
}
