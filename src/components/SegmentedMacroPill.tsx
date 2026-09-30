import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { useReducedMotion } from './performance/useReducedMotion';

interface SegmentedMacroPillProps {
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fats: number;
  targetFats: number;
  compact?: boolean;
}

type MacroKey = 'protein' | 'carbs' | 'fats';

const MACRO_STYLE: Record<MacroKey, { color: string; tint: string; label: string; labelAr: string; role: string; roleAr: string }> = {
  protein: { color: '#06b6d4', tint: 'rgba(6, 182, 212, 0.12)', label: 'Protein', labelAr: 'بروتين', role: 'Build & repair', roleAr: 'بناء وترميم' },
  carbs: { color: '#f59e0b', tint: 'rgba(245, 158, 11, 0.12)', label: 'Carbs', labelAr: 'كارب', role: 'Fuel & glycogen', roleAr: 'طاقة وجليكوجين' },
  fats: { color: '#ec4899', tint: 'rgba(236, 72, 153, 0.12)', label: 'Fats', labelAr: 'دهون', role: 'Hormones', roleAr: 'هرمونات' }
};

const OVER_COLOR = '#f43f5e';

function safeRatio(value: number, target: number) {
  if (!target || target <= 0) return 0;
  return value / target;
}

export function SegmentedMacroPill({
  protein,
  targetProtein,
  carbs,
  targetCarbs,
  fats,
  targetFats,
  compact = false
}: SegmentedMacroPillProps) {
  const { isRTL } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [selectedMacro, setSelectedMacro] = useState<MacroKey | null>(null);

  const rows: { key: MacroKey; value: number; target: number }[] = [
    { key: 'protein', value: protein, target: targetProtein },
    { key: 'carbs', value: carbs, target: targetCarbs },
    { key: 'fats', value: fats, target: targetFats }
  ];

  const fills = rows.map(row => Math.min(safeRatio(row.value, row.target), 1));
  const fillSum = fills.reduce((acc, cur) => acc + cur, 0);
  const allOver = rows.every((_row, i) => fills[i] >= 1);
  const totalCapped = fillSum > 1;
  const scale = totalCapped ? 1 / fillSum : 1;

  const handleSelect = (key: MacroKey) => {
    gymAudio.triggerVibration([10]);
    setSelectedMacro(prev => (prev === key ? null : key));
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.5rem' : '0.7rem' }}
      role="group"
      aria-label={isRTL ? 'توزيع الماكروز مقابل الأهداف' : 'Macro distribution against targets'}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: compact ? 14 : 18,
          borderRadius: '999px',
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          direction: isRTL ? 'rtl' : 'ltr',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.35)'
        }}
      >
        {rows.map((row, index) => {
          const fill = fills[index];
          if (fill <= 0) return null;
          const style = MACRO_STYLE[row.key];
          const isOver = row.value > row.target && row.target > 0;
          return (
            <motion.button
              key={row.key}
              type="button"
              onClick={() => handleSelect(row.key)}
              whileTap={reducedMotion ? undefined : { scaleY: 0.9 }}
              aria-label={`${isRTL ? style.labelAr : style.label}: ${Math.round(row.value)} / ${row.target} g`}
              title={`${isRTL ? style.labelAr : style.label}: ${Math.round(row.value)}g / ${row.target}g`}
              style={{
                position: 'relative',
                width: `${fill * scale * 100}%`,
                height: '100%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                backgroundColor: isOver ? OVER_COLOR : style.color,
                opacity: selectedMacro && selectedMacro !== row.key ? 0.35 : 1,
                transition: 'opacity 0.2s ease',
                backgroundImage: isOver
                  ? `repeating-linear-gradient(${isRTL ? -45 : 45}deg, rgba(255,255,255,0.28) 0 3px, transparent 3px 7px)`
                  : `linear-gradient(${isRTL ? '270deg' : '90deg'}, ${style.color}, ${style.color}dd)`,
                borderInlineEnd: '1px solid rgba(0, 0, 0, 0.25)'
              }}
            />
          );
        })}
        {fillSum <= 0 && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.62rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          >
            {isRTL ? 'لم تُسجَّل ماكروز بعد' : 'No macros logged yet'}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          // minmax(0, 1fr), NOT 1fr. A bare `1fr` is `minmax(auto, 1fr)`, and
          // an `auto` minimum refuses to shrink below the track's min-content
          // width. With `nowrap` labels inside, each of the three tracks
          // demanded its full text width and the cards overflowed into each
          // other instead of truncating.
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: compact ? '0.4rem' : '0.5rem'
        }}
      >
        {rows.map(row => {
          const style = MACRO_STYLE[row.key];
          const ratio = safeRatio(row.value, row.target);
          const pct = Math.round(ratio * 100);
          const over = row.target > 0 && row.value > row.target;
          const reached = row.target > 0 && ratio >= 1;
          const hasTarget = row.target > 0;
          const delta = Math.abs(Math.round(row.value - row.target));
          const deltaLabel = !hasTarget
            ? isRTL ? 'بدون هدف' : 'No target'
            : over
              ? `${isRTL ? 'تجاوز' : '+'}${delta}g`
              : `${isRTL ? 'متبقٍ' : ''} ${delta}g`.trim();
          const isSelected = selectedMacro === row.key;
          const barColor = over ? OVER_COLOR : style.color;

          return (
            <motion.button
              key={row.key}
              type="button"
              onClick={() => handleSelect(row.key)}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              aria-pressed={isSelected}
              aria-label={`${isRTL ? style.labelAr : style.label}: ${Math.round(row.value)} of ${Math.round(row.target)} grams, ${pct} percent`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                padding: compact ? '0.5rem' : '0.6rem',
                textAlign: 'start',
                background: isSelected ? style.tint : 'var(--bg-tertiary)',
                borderRadius: '12px',
                border: `1px solid ${isSelected || over ? (over ? OVER_COLOR : style.color) : `${style.color}44`}`,
                cursor: 'pointer',
                color: 'inherit',
                minWidth: 0,
                overflow: 'hidden',
                transition: 'background-color 0.18s ease, border-color 0.18s ease'
              }}
            >
              {/* Row 1 - identity. minWidth 0 on the flex item is what lets the
                  ellipsis engage instead of the row refusing to shrink. */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  minWidth: 0,
                  fontSize: compact ? '0.66rem' : '0.7rem',
                  fontWeight: 700,
                  color: over ? OVER_COLOR : style.color,
                  lineHeight: 1.2
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    inlineSize: 6,
                    blockSize: 6,
                    borderRadius: '50%',
                    background: 'currentColor',
                    flexShrink: 0
                  }}
                />
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isRTL ? style.labelAr : style.label}
                </span>
              </span>

              {/* Row 2 - the number. This is the datum, so it gets the size and
                  the full width; the target is a quiet reference beside it. */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.2rem',
                  minWidth: 0,
                  lineHeight: 1.05
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: compact ? '1rem' : '1.15rem',
                    fontWeight: 800,
                    color: over ? OVER_COLOR : 'var(--text-primary)',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  {Math.round(row.value)}
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    marginInlineStart: 'auto',
                    direction: 'ltr'
                  }}
                >
                  /{Math.round(row.target)}g
                </span>
              </span>

              {/* Row 3 - absolute progress against this macro's own target, so
                  it cannot be confused with the distribution bar above. */}
              <span
                style={{
                  display: 'block',
                  blockSize: 4,
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden'
                }}
                aria-hidden="true"
              >
                <motion.span
                  initial={false}
                  animate={{ inlineSize: `${Math.min(100, ratio * 100)}%` }}
                  transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22 }}
                  style={{
                    display: 'block',
                    blockSize: '100%',
                    borderRadius: '999px',
                    background: over
                      ? OVER_COLOR
                      : `linear-gradient(${isRTL ? '270deg' : '90deg'}, ${barColor}, ${style.color})`
                  }}
                />
              </span>

              {/* Row 4 - status. One consistent line: percent, then the gap to
                  target. Previously this swapped between a percentage and a
                  role string, so the row meant different things per macro. */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '0.25rem',
                  minWidth: 0,
                  fontSize: compact ? '0.6rem' : '0.64rem',
                  fontWeight: 700,
                  lineHeight: 1.2
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    color: over ? OVER_COLOR : reached ? style.color : 'var(--text-secondary)',
                    flexShrink: 0
                  }}
                >
                  {hasTarget ? `${pct}%` : '—'}
                </span>
                <span
                  style={{
                    color: over ? OVER_COLOR : 'var(--text-muted)',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {deltaLabel}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {allOver && (
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: OVER_COLOR,
            textAlign: 'center'
          }}
        >
          {isRTL ? 'كل الماكروز تجاوزت أهدافك اليوم' : 'All three macros are over target today'}
        </span>
      )}
    </div>
  );
}

export default SegmentedMacroPill;
