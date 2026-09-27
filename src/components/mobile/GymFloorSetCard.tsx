import { motion } from 'framer-motion';
import { Check, Trash2, Zap } from 'lucide-react';
import type { SetRecord } from '../../lib/api';
import type { PreviousSetReference } from '../../types/ui';
import { useTranslation } from '../../lib/i18n';

interface GymFloorSetCardProps {
  set: SetRecord;
  setIndex: number;
  totalSets: number;
  previousRecord: PreviousSetReference | null;
  onUpdateSet: (field: 'weight' | 'repsActual' | 'unit', value: any) => void;
  onToggleComplete: () => void;
  onQuickWeightAdjust: (delta: number) => void;
  onQuickRepAdjust: (delta: number) => void;
  onDeleteSet?: () => void;
  isCompact?: boolean;
  onSelectSet?: () => void;
}

export function GymFloorSetCard({
  set,
  setIndex,
  totalSets,
  previousRecord,
  onUpdateSet,
  onToggleComplete,
  onQuickWeightAdjust,
  onQuickRepAdjust,
  onDeleteSet,
  isCompact = false,
  onSelectSet,
}: GymFloorSetCardProps) {
  const { isRTL } = useTranslation();

  // If rendered in compact mode (for secondary sets in list)
  if (isCompact) {
    return (
      <motion.div
        layout
        onClick={onSelectSet}
        style={{
          borderRadius: '16px',
          padding: '0.75rem 1rem',
          background: set.isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          border: set.isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: set.isCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 800
          }}>
            {setIndex + 1}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {set.weight || 0} {set.unit} × {set.repsActual || set.repsTarget || 10} {isRTL ? 'عدة' : 'reps'}
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`gym-floor-check-circle ${set.isCompleted ? 'completed' : 'uncompleted'}`}
          style={{ width: '38px', height: '38px' }}
        >
          <Check className="w-4 h-4" />
        </motion.button>
      </motion.div>
    );
  }

  // Full Gym Floor Mode Current Set Focus Card (Matches the Approved Mockup)
  return (
    <motion.div
      layout
      className={`gym-floor-current-set-card ${set.isCompleted ? 'is-completed' : ''}`}
      style={{ marginBottom: '1rem' }}
    >
      {/* Top Header: Set Counter & Prev Reference */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div className="gym-floor-set-heading" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
            {isRTL ? `الجولة ${setIndex + 1} من ${totalSets}` : `Set ${setIndex + 1} of ${totalSets}`}
          </div>
          {previousRecord ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, marginTop: '0.15rem' }}>
              <Zap className="w-3.5 h-3.5 fill-cyan-400" />
              <span>
                {isRTL ? 'السابق' : 'Prev'}: {previousRecord.weight} {previousRecord.unit} × {previousRecord.reps} {isRTL ? 'عدة' : 'reps'}
              </span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
              {isRTL ? 'الجولة الأولى المسجلة' : 'Target: Clean form & steady tempo'}
            </div>
          )}
        </div>

        {totalSets > 1 && onDeleteSet && (
          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={onDeleteSet}
            style={{ color: 'var(--text-muted)', padding: '0.35rem' }}
            title="Delete Set"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Floor Steppers & Values */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {/* Weight Row: -2.5 | [Big Weight Input] | +2.5 | +5 */}
        <div className="gym-floor-input-row" style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '16px',
          padding: '0.65rem 0.85rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          {/* Minus Stepper */}
          <button
            type="button"
            className="gym-floor-thumb-stepper"
            onClick={() => onQuickWeightAdjust(-2.5)}
            title="-2.5"
          >
            -2.5
          </button>

          {/* Central Weight Display & Input */}
          <div className="gym-floor-input-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <input
                type="number"
                inputMode="decimal"
                value={set.weight === 0 ? '' : set.weight}
                placeholder="0"
                onChange={(e) => onUpdateSet('weight', parseFloat(e.target.value) || 0)}
                style={{
                  width: '90px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'center',
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums'
                }}
              />
              <button
                type="button"
                className="gym-floor-unit-toggle"
                onClick={() => onUpdateSet('unit', set.unit === 'kg' ? 'lb' : 'kg')}
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  padding: '0.15rem 0.45rem',
                  cursor: 'pointer'
                }}
              >
                {set.unit}
              </button>
            </div>
            <span className="gym-floor-input-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isRTL ? 'الوزن' : 'Weight'}
            </span>
          </div>

          {/* Plus Steppers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="gym-floor-thumb-stepper stepper-cyan"
              onClick={() => onQuickWeightAdjust(2.5)}
              title="+2.5"
            >
              +2.5
            </button>
            <button
              type="button"
              className="gym-floor-thumb-stepper stepper-cyan"
              onClick={() => onQuickWeightAdjust(5)}
              title="+5"
            >
              +5
            </button>
          </div>
        </div>

        {/* Reps Row: -1 | [Big Reps Input] | +1 */}
        <div className="gym-floor-input-row" style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '16px',
          padding: '0.65rem 0.85rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          {/* Minus 1 Rep */}
          <button
            type="button"
            className="gym-floor-thumb-stepper"
            onClick={() => onQuickRepAdjust(-1)}
            title="-1 Rep"
          >
            -1
          </button>

          {/* Central Reps Display & Input */}
          <div className="gym-floor-input-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <input
                type="number"
                inputMode="numeric"
                value={set.repsActual || set.repsTarget || ''}
                placeholder="10"
                onChange={(e) => onUpdateSet('repsActual', parseInt(e.target.value) || 0)}
                style={{
                  width: '80px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'center',
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums'
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {isRTL ? 'عدة' : 'reps'}
              </span>
            </div>
            <span className="gym-floor-input-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isRTL ? 'التكرار' : 'Repetitions'}
            </span>
          </div>

          {/* Plus 1 Rep */}
          <button
            type="button"
            className="gym-floor-thumb-stepper stepper-green"
            onClick={() => onQuickRepAdjust(1)}
            title="+1 Rep"
          >
            +1
          </button>
        </div>
      </div>

      {/* Prominent Circular Check Button Centered */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onToggleComplete}
          className={`gym-floor-check-circle ${set.isCompleted ? 'completed' : 'uncompleted'}`}
          style={{ width: '60px', height: '60px' }}
        >
          <Check className="w-7 h-7" />
        </motion.button>
      </div>
    </motion.div>
  );
}
