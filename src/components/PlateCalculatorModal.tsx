import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../lib/i18n';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialUnit?: 'kg' | 'lb';
  unit?: 'kg' | 'lb';
  onApply?: (weight: number, unit: 'kg' | 'lb') => void;
}

interface PlateConfig {
  weight: number;
  color: string;
  textColor: string;
  heightPercent: number;
}

type Unit = 'kg' | 'lb';

const KG_PLATES: PlateConfig[] = [
  { weight: 25, color: '#ef4444', textColor: '#ffffff', heightPercent: 95 },
  { weight: 20, color: '#3b82f6', textColor: '#ffffff', heightPercent: 95 },
  { weight: 15, color: '#eab308', textColor: '#000000', heightPercent: 82 },
  { weight: 10, color: '#10b981', textColor: '#ffffff', heightPercent: 72 },
  { weight: 5, color: '#f8fafc', textColor: '#0f172a', heightPercent: 58 },
  { weight: 2.5, color: '#475569', textColor: '#ffffff', heightPercent: 46 },
  { weight: 1.25, color: '#94a3b8', textColor: '#0f172a', heightPercent: 36 }
];

const LB_PLATES: PlateConfig[] = [
  { weight: 45, color: '#3b82f6', textColor: '#ffffff', heightPercent: 95 },
  { weight: 35, color: '#eab308', textColor: '#000000', heightPercent: 84 },
  { weight: 25, color: '#10b981', textColor: '#ffffff', heightPercent: 74 },
  { weight: 10, color: '#f8fafc', textColor: '#0f172a', heightPercent: 60 },
  { weight: 5, color: '#475569', textColor: '#ffffff', heightPercent: 48 },
  { weight: 2.5, color: '#94a3b8', textColor: '#0f172a', heightPercent: 38 }
];

const STEP: Record<Unit, number> = { kg: 2.5, lb: 5 };
const DEFAULT_TARGET: Record<Unit, number> = { kg: 60, lb: 135 };

const CONVERSION: Record<Unit, number> = { kg: 1, lb: 2.20462 };

export function PlateCalculatorModal({
  isOpen,
  onClose,
  initialWeight = 60,
  initialUnit,
  unit = 'kg',
  onApply
}: PlateCalculatorModalProps) {
  const { t, isRTL } = useTranslation();
  const [activeUnit, setActiveUnit] = useState<Unit>(initialUnit || unit);
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight || DEFAULT_TARGET[unit]);
  const [barWeight, setBarWeight] = useState<number>((initialUnit || unit) === 'kg' ? 20 : 45);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const resolved = initialUnit || unit;
    setActiveUnit(resolved);
    setTargetWeight(initialWeight && initialWeight > 0 ? initialWeight : DEFAULT_TARGET[resolved]);
    setBarWeight(resolved === 'kg' ? 20 : 45);
  }, [isOpen, initialWeight, initialUnit, unit]);

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  const availablePlates = activeUnit === 'kg' ? KG_PLATES : LB_PLATES;

  const calculation = useMemo(() => {
    const perSideRaw = Math.max(0, (targetWeight - barWeight) / 2);
    let remaining = perSideRaw;
    const rows: { plate: PlateConfig; count: number }[] = [];
    const ordered: PlateConfig[] = [];

    for (const plate of availablePlates) {
      if (remaining + 1e-9 < plate.weight) continue;
      const count = Math.floor((remaining + 1e-9) / plate.weight);
      if (count <= 0) continue;
      rows.push({ plate, count });
      for (let i = 0; i < count; i++) ordered.push(plate);
      remaining = Number((remaining - count * plate.weight).toFixed(2));
    }

    const perSideTotal = Number(rows.reduce((sum, row) => sum + row.plate.weight * row.count, 0).toFixed(2));
    return {
      rows,
      ordered,
      perSideTotal,
      actualLoaded: Number((barWeight + perSideTotal * 2).toFixed(2)),
      remainder: Number(Math.max(0, remaining).toFixed(2))
    };
  }, [targetWeight, barWeight, availablePlates]);

  const barOptions: { label: string; weight: number }[] =
    activeUnit === 'kg'
      ? [
          { label: t('olympicBar'), weight: 20 },
          { label: t('womensBar'), weight: 15 },
          { label: t('ezBar'), weight: 10 },
          { label: t('noBar'), weight: 0 }
        ]
      : [
          { label: isRTL ? 'بار أولمبي (45 رطل)' : 'Olympic Bar (45 lb)', weight: 45 },
          { label: isRTL ? 'بار نسائي (35 رطل)' : 'Women’s Bar (35 lb)', weight: 35 },
          { label: isRTL ? 'بار EZ (25 رطل)' : 'EZ Curl Bar (25 lb)', weight: 25 },
          { label: isRTL ? 'بدون بار' : 'No Bar (0 lb)', weight: 0 }
        ];

  const switchUnit = useCallback(
    (next: Unit) => {
      if (next === activeUnit) return;
      const converted = Number(((targetWeight / CONVERSION[activeUnit]) * CONVERSION[next]).toFixed(1));
      setActiveUnit(next);
      setTargetWeight(Number((Math.round(converted / STEP[next]) * STEP[next]).toFixed(2)));
      setBarWeight(next === 'kg' ? 20 : 45);
    },
    [activeUnit, targetWeight]
  );

  const stepWeight = useCallback(
    (direction: -1 | 1) => {
      setTargetWeight(current => Math.max(barWeight, Number((current + direction * STEP[activeUnit]).toFixed(2))));
    },
    [activeUnit, barWeight]
  );

  if (!isOpen) return null;

  const summary = isRTL
    ? `${calculation.rows.length ? calculation.rows.map(row => `${row.count}×${row.plate.weight}`).join(' + ') + ' ' + activeUnit + ' لكل جانب' : 'بار فارغ'} • الإجمالي ${calculation.actualLoaded} ${activeUnit}`
    : `${calculation.rows.length ? calculation.rows.map(row => `${row.count}×${row.plate.weight}`).join(' + ') + ' ' + activeUnit + ' per side' : 'Empty barbell'} • ${calculation.actualLoaded} ${activeUnit} total`;

  return createPortal(
    <div
      className="plate-calc-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('plateCalculator')}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={event => event.stopPropagation()}
        className="plate-calc-dialog"
      >
        <header className="plate-calc-header">
          <div className="plate-calc-header-title">
            <h2>{t('plateCalculator')}</h2>
            <p>{t('exactPlatesNeeded')}</p>
          </div>
          <div className="plate-calc-unit-toggle" role="group" aria-label={isRTL ? 'وحدة الوزن' : 'Weight unit'}>
            {(['kg', 'lb'] as Unit[]).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={activeUnit === option}
                onClick={() => switchUnit(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button type="button" className="plate-calc-close" onClick={onClose} aria-label={t('cancel')}>
            <X width={18} height={18} aria-hidden="true" />
          </button>
        </header>

        <div className="plate-calc-body">
          <div className="plate-calc-target">
            <span className="plate-calc-label">{t('targetWeight')}</span>
            <div className="plate-calc-target-row">
              <button
                type="button"
                className="plate-calc-step"
                onClick={() => stepWeight(-1)}
                aria-label={`${isRTL ? 'أنقص' : 'Decrease'} ${STEP[activeUnit]} ${activeUnit}`}
              >
                <Minus size={18} aria-hidden="true" />
              </button>
              <div className="plate-calc-target-value">
                <input
                  data-autofocus="true"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={STEP[activeUnit]}
                  value={targetWeight}
                  aria-label={t('targetWeight')}
                  onChange={event => setTargetWeight(Number(event.target.value) || 0)}
                />
                <span>{activeUnit}</span>
              </div>
              <button
                type="button"
                className="plate-calc-step"
                onClick={() => stepWeight(1)}
                aria-label={`${isRTL ? 'زد' : 'Increase'} ${STEP[activeUnit]} ${activeUnit}`}
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="plate-calc-quick">
              {[1, 2, 4].map(multiplier => (
                <button
                  key={multiplier}
                  type="button"
                  onClick={() => setTargetWeight(current => Number((current + STEP[activeUnit] * multiplier).toFixed(2)))}
                >
                  +{STEP[activeUnit] * multiplier} {activeUnit}
                </button>
              ))}
              <button type="button" onClick={() => setTargetWeight(barWeight)}>
                <RotateCcw size={12} aria-hidden="true" />
                <span>{isRTL ? 'البار فقط' : 'Bar only'}</span>
              </button>
            </div>
          </div>

          <div className="plate-calc-barbell" role="img" aria-label={summary}>
            <span className="plate-calc-label">
              {t('platesEachSide')} ({calculation.perSideTotal} {activeUnit})
            </span>
            <div className="plate-calc-barbell-visual" aria-hidden="true">
              <span className="plate-calc-shaft" />
              <span className="plate-calc-sleeve plate-calc-sleeve-start">
                {[...calculation.ordered].reverse().map((plate, index) => (
                  <i
                    key={`start-${index}`}
                    style={{ height: `${plate.heightPercent}%`, background: plate.color, color: plate.textColor }}
                  >
                    {plate.weight}
                  </i>
                ))}
              </span>
              <span className="plate-calc-collar" />
              <span className="plate-calc-sleeve plate-calc-sleeve-end">
                {calculation.ordered.map((plate, index) => (
                  <i
                    key={`end-${index}`}
                    style={{ height: `${plate.heightPercent}%`, background: plate.color, color: plate.textColor }}
                  >
                    {plate.weight}
                  </i>
                ))}
              </span>
            </div>
          </div>

          <div className="plate-calc-table-wrap">
            <table className="plate-calc-table">
              <caption className="sr-only">
                {isRTL ? 'جدول الأقراص المحملة لكل جانب' : 'Plates loaded per side'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{isRTL ? 'القرص' : 'Plate'}</th>
                  <th scope="col">{isRTL ? 'العدد لكل جانب' : 'Count / side'}</th>
                  <th scope="col">{isRTL ? 'المجموع لكل جانب' : 'Total / side'}</th>
                </tr>
              </thead>
              <tbody>
                {calculation.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="is-empty">
                      {isRTL ? 'البار فارغ بدون أطباق' : 'Empty barbell (no plates)'}
                    </td>
                  </tr>
                ) : (
                  calculation.rows.map(row => (
                    <tr key={row.plate.weight}>
                      <th scope="row">
                        <span className="plate-calc-swatch" style={{ background: row.plate.color }} aria-hidden="true" />
                        {row.plate.weight} {activeUnit}
                      </th>
                      <td className="tabular-nums">×{row.count}</td>
                      <td className="tabular-nums">
                        {Number((row.plate.weight * row.count).toFixed(2))} {activeUnit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <fieldset className="plate-calc-bars">
            <legend className="plate-calc-label">{t('barWeight')}</legend>
            <div className="plate-calc-bar-options">
              {barOptions.map(option => (
                <button
                  key={option.weight}
                  type="button"
                  aria-pressed={barWeight === option.weight}
                  onClick={() => setBarWeight(option.weight)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="plate-calc-total">
            <div>
              <span className="plate-calc-label">{t('totalLoaded')}</span>
              <strong className="tabular-nums">
                {calculation.actualLoaded} {activeUnit}
              </strong>
              {calculation.remainder > 0 && (
                <span className="plate-calc-remainder">
                  {isRTL ? 'فرق غير قابل للتحميل' : 'Unloadable remainder'}: {calculation.remainder} {activeUnit}
                </span>
              )}
            </div>
            {onApply && (
              <button type="button" className="btn btn-primary" onClick={() => onApply(calculation.actualLoaded, activeUnit)}>
                <Check size={16} aria-hidden="true" />
                <span>{t('applyToSet')}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
