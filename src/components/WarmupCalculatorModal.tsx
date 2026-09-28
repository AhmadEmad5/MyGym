import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check, Flame, Minus, Plus, Sparkles, X } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

type Unit = 'kg' | 'lb';

interface WarmupStage {
  id: string;
  percent: number;
  weight: number;
  reps: number;
  restSec: number;
  description: string;
  selected: boolean;
}

interface WarmupCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  initialWeight: number;
  unit: Unit;
  onApplyWarmupSets: (
    warmupSets: { weight: number; repsTarget: number; unit: Unit; setType: 'warmup' }[]
  ) => void;
}

const STEP: Record<Unit, number> = { kg: 5, lb: 10 };
const BAR_WEIGHT: Record<Unit, number> = { kg: 20, lb: 45 };

export function WarmupCalculatorModal({
  isOpen,
  onClose,
  exerciseName,
  initialWeight,
  unit,
  onApplyWarmupSets
}: WarmupCalculatorModalProps) {
  const { t, isRTL, tExercise } = useTranslation();
  const [workingWeight, setWorkingWeight] = useState<number>(initialWeight > 0 ? initialWeight : unit === 'kg' ? 60 : 135);
  const [selectedStages, setSelectedStages] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true });
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialWeight > 0) setWorkingWeight(initialWeight);
  }, [initialWeight]);

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
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  const round = useCallback(
    (value: number) => {
      const increment = unit === 'kg' ? 2.5 : 5;
      return Math.max(increment, Math.round(value / increment) * increment);
    },
    [unit]
  );

  const stages: WarmupStage[] = useMemo(() => {
    const bar = BAR_WEIGHT[unit];
    const working = Math.max(bar, workingWeight);
    const definitions: { percent: number; reps: number; restSec: number; en: string; ar: string }[] = [
      {
        percent: 40,
        reps: 10,
        restSec: 45,
        en: 'Joint lubrication & groove the motor pattern with zero fatigue',
        ar: 'إحماء المفاصل وتنشيط مسار الحركة بدون أي إجهاد'
      },
      {
        percent: 60,
        reps: 5,
        restSec: 60,
        en: 'Recruit motor units and increase muscle blood flow',
        ar: 'تنشيط الوحدات الحركية وضخ الدم في العضلات المستهدفة'
      },
      {
        percent: 78,
        reps: 3,
        restSec: 90,
        en: 'CNS potentiation to prepare tendons for the working weight',
        ar: 'تحفيز الجهاز العصبي المركزي وتجهيز الأوتار للوزن الأساسي'
      },
      {
        percent: 90,
        reps: 1,
        restSec: 120,
        en: 'Single rep so the working weight feels substantially lighter',
        ar: 'تكرار واحد فقط يجعل الوزن الأساسي يشعر بخفة استثنائية'
      }
    ];

    return definitions.map((definition, index) => ({
      id: `warmup-${index + 1}`,
      percent: definition.percent,
      weight: index === 0 ? Math.min(bar, round(working * 0.4)) : round(working * (definition.percent / 100)),
      reps: definition.reps,
      restSec: definition.restSec,
      description: isRTL ? definition.ar : definition.en,
      selected: selectedStages[index] ?? true
    }));
  }, [workingWeight, unit, isRTL, round, selectedStages]);

  const activeStages = stages.filter(stage => stage.selected);
  const totalVolume = activeStages.reduce((sum, stage) => sum + stage.weight * stage.reps, 0);
  const totalTime = activeStages.reduce((sum, stage) => sum + stage.reps * 4 + stage.restSec, 0);

  const toggleStage = (index: number) => {
    setSelectedStages(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleApply = () => {
    if (activeStages.length === 0) return;
    onApplyWarmupSets(
      activeStages.map(stage => ({
        weight: stage.weight,
        repsTarget: stage.reps,
        unit,
        setType: 'warmup' as const
      }))
    );
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="warmup-calc-backdrop" onClick={onClose} role="presentation">
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('warmupCalculatorTitle')}
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={event => event.stopPropagation()}
        className="warmup-calc-dialog"
      >
        <header className="warmup-calc-header">
          <div className="warmup-calc-heading">
            <span className="warmup-calc-icon" aria-hidden="true">
              <Flame width={18} height={18} />
            </span>
            <div>
              <h2>{t('warmupCalculatorTitle')}</h2>
              <p>{tExercise(exerciseName)}</p>
            </div>
          </div>
          <button type="button" className="warmup-calc-close" onClick={onClose} aria-label={t('cancel')}>
            <X width={18} height={18} aria-hidden="true" />
          </button>
        </header>

        <div className="warmup-calc-target">
          <div>
            <span className="warmup-calc-label">{t('targetWorkingWeight')}</span>
            <div className="warmup-calc-target-value">
              <input
                data-autofocus="true"
                type="number"
                inputMode="decimal"
                min={BAR_WEIGHT[unit]}
                step={STEP[unit]}
                value={workingWeight}
                aria-label={t('targetWorkingWeight')}
                onChange={event => setWorkingWeight(Number(event.target.value) || BAR_WEIGHT[unit])}
              />
              <span>{unit}</span>
            </div>
          </div>
          <div className="warmup-calc-target-steps">
            <button
              type="button"
              onClick={() => setWorkingWeight(prev => Math.max(BAR_WEIGHT[unit], prev - STEP[unit]))}
              aria-label={`${isRTL ? 'أنقص' : 'Decrease'} ${STEP[unit]} ${unit}`}
            >
              <Minus size={16} aria-hidden="true" />
              <span>-{STEP[unit]}</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkingWeight(prev => prev + STEP[unit])}
              aria-label={`${isRTL ? 'زد' : 'Increase'} ${STEP[unit]} ${unit}`}
            >
              <Plus size={16} aria-hidden="true" />
              <span>+{STEP[unit]}</span>
            </button>
          </div>
        </div>

        <div className="warmup-calc-body">
          <p className="warmup-calc-tip">
            <Sparkles size={15} aria-hidden="true" />
            <span>{t('warmupScienceTip')}</span>
          </p>

          <ul className="warmup-calc-stages">
            {stages.map((stage, index) => (
              <li key={stage.id}>
                <button
                  type="button"
                  className="warmup-calc-stage"
                  aria-pressed={stage.selected}
                  onClick={() => toggleStage(index)}
                >
                  <span className="warmup-calc-stage-check" aria-hidden="true">
                    {stage.selected && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="warmup-calc-stage-body">
                    <span className="warmup-calc-stage-title">
                      {isRTL ? `المرحلة ${index + 1}` : `Stage ${index + 1}`}
                      <em>{stage.percent}%</em>
                    </span>
                    <span className="warmup-calc-stage-desc">{stage.description}</span>
                  </span>
                  <span className="warmup-calc-stage-load">
                    <strong className="tabular-nums">
                      {stage.weight} {unit}
                    </strong>
                    <span>
                      {stage.reps} {t('repsWord')}
                    </span>
                    <span className="warmup-calc-stage-rest tabular-nums">{stage.restSec}s {isRTL ? 'راحة' : 'rest'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="warmup-calc-table-wrap">
            <table className="warmup-calc-table">
              <caption className="sr-only">{isRTL ? 'جدول جولات الإحماء' : 'Warm-up set table'}</caption>
              <thead>
                <tr>
                  <th scope="col">{isRTL ? 'الجولة' : 'Set'}</th>
                  <th scope="col">{isRTL ? 'النسبة' : '%'}</th>
                  <th scope="col">{t('weight')}</th>
                  <th scope="col">{t('reps')}</th>
                  <th scope="col">{isRTL ? 'الراحة' : 'Rest'}</th>
                </tr>
              </thead>
              <tbody>
                {activeStages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="is-empty">
                      {isRTL ? 'لم يتم اختيار أي مرحلة' : 'No warm-up stage selected'}
                    </td>
                  </tr>
                ) : (
                  activeStages.map(stage => (
                    <tr key={stage.id}>
                      <th scope="row">{isRTL ? 'إحماء' : 'WU'}</th>
                      <td className="tabular-nums">{stage.percent}%</td>
                      <td className="tabular-nums">
                        {stage.weight} {unit}
                      </td>
                      <td className="tabular-nums">{stage.reps}</td>
                      <td className="tabular-nums">{stage.restSec}s</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>
                    {isRTL ? 'الإجمالي' : 'Total'}
                  </th>
                  <td className="tabular-nums">{Math.round(totalVolume)} {unit}</td>
                  <td className="tabular-nums">{activeStages.reduce((sum, stage) => sum + stage.reps, 0)}</td>
                  <td className="tabular-nums">~{Math.round(totalTime / 60)}m</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <footer className="warmup-calc-footer">
          <span className="warmup-calc-footer-hint">
            {isRTL ? 'سيتم إدراج الجولات قبل الجولات الأساسية' : 'Sets are inserted before your working sets'}
          </span>
          <div className="warmup-calc-footer-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              disabled={activeStages.length === 0}
            >
              <Flame size={16} aria-hidden="true" />
              <span>{t('applyWarmupSetsBtn')}</span>
            </button>
          </div>
        </footer>
      </motion.div>
    </div>,
    document.body
  );
}
