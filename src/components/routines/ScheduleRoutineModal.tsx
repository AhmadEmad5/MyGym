import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Info, Zap } from 'lucide-react';
import { Button, Modal } from '../ui';
import { CLOSED_DAY_VALUE, DAYS_OF_WEEK } from './data';
import type { ProgramDraft } from './types';

const REPEAT_OPTIONS = [
  { weeks: 1, labelEn: '1 Week', labelAr: 'أسبوع 1', descEn: 'Trial', descAr: 'تجربة', isDefault: false },
  { weeks: 4, labelEn: '4 Weeks', labelAr: '4 أسابيع', descEn: 'Standard', descAr: 'شائع', isDefault: true },
  { weeks: 8, labelEn: '8 Weeks', labelAr: '8 أسابيع', descEn: 'Mesocycle', descAr: 'دورة تدريب', isDefault: false },
  { weeks: 12, labelEn: '12 Weeks', labelAr: '12 أسبوع', descEn: 'Full Block', descAr: 'برنامج كامل', isDefault: false }
] as const;

type ScheduleRoutineModalProps = {
  isOpen: boolean;
  program: ProgramDraft | null;
  programTitle: string;
  initialDays: number[];
  isRTL: boolean;
  t: (key: any) => string;
  onClose: () => void;
  onConfirm: (days: number[], repeatWeeks: number, replaceExisting: boolean, scheduleStart: 'thisWeek' | 'nextWeek') => Promise<void>;
  onNotify: (message: string, tone: 'success' | 'error' | 'info' | 'warning') => void;
};

export function ScheduleRoutineModal({
  isOpen,
  program,
  programTitle,
  initialDays,
  isRTL,
  t,
  onClose,
  onConfirm,
  onNotify
}: ScheduleRoutineModalProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleStart, setScheduleStart] = useState<'thisWeek' | 'nextWeek'>('thisWeek');
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const submittingRef = useRef(false);

  const daysRequired = program?.daysRequired ?? 0;
  const initialDaysKey = `${isOpen ? '1' : '0'}:${initialDays.join(',')}`;

  useEffect(() => {
    if (!isOpen) return;
    setScheduleStart('thisWeek');
    setRepeatWeeks(4);
    setReplaceExisting(true);
    setSelectedDays(initialDays.filter(day => day !== CLOSED_DAY_VALUE).slice(0, daysRequired));
  }, [initialDaysKey, isOpen, daysRequired, initialDays]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, [isOpen]);

  const currentWeekSaturday = useMemo(() => startOfWeek(today, { weekStartsOn: 6 }), [today]);

  const sortedDays = useMemo(() => [...selectedDays].sort((a, b) => a - b), [selectedDays]);

  const preview = useMemo(() => {
    if (!program || sortedDays.length === 0) return null;
    let baseStart = scheduleStart === 'nextWeek' ? addDays(currentWeekSaturday, 7) : currentWeekSaturday;
    let startsNextWeekAutomatically = false;
    if (scheduleStart === 'thisWeek') {
      const remaining = sortedDays.filter(offset => addDays(currentWeekSaturday, offset) >= today);
      if (remaining.length === 0) {
        baseStart = addDays(currentWeekSaturday, 7);
        startsNextWeekAutomatically = true;
      }
    }
    let firstDateObj: Date | null = null;
    let totalWorkouts = 0;
    for (let w = 0; w < repeatWeeks; w++) {
      for (let i = 0; i < sortedDays.length; i++) {
        if (i >= program.sessions.length) break;
        const targetDate = addDays(baseStart, w * 7 + sortedDays[i]);
        targetDate.setHours(18, 0, 0, 0);
        if (targetDate >= today) {
          totalWorkouts += 1;
          if (!firstDateObj) firstDateObj = targetDate;
        }
      }
    }
    return {
      totalWorkouts,
      firstDate: firstDateObj,
      startsNextWeekAutomatically,
      hasExcludedPastDays:
        scheduleStart === 'thisWeek' &&
        !startsNextWeekAutomatically &&
        sortedDays.some(offset => addDays(currentWeekSaturday, offset) < today)
    };
  }, [program, sortedDays, repeatWeeks, scheduleStart, currentWeekSaturday, today]);

  const toggleDay = (dayValue: number) => {
    if (dayValue === CLOSED_DAY_VALUE) {
      onNotify(
        isRTL ? 'الجمعة عطلة أسبوعية والجيم مغلق دائماً!' : 'Friday is an off-day — the gym is closed every Friday!',
        'warning'
      );
      return;
    }
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(prev => prev.filter(day => day !== dayValue));
      return;
    }
    if (selectedDays.length < daysRequired) {
      setSelectedDays(prev => [...prev, dayValue]);
    } else {
      onNotify(
        isRTL
          ? `يمكنك اختيار ${daysRequired} أيام فقط لهذا الجدول.`
          : `You can only select ${daysRequired} days for this routine.`,
        'warning'
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!program || selectedDays.length !== daysRequired) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsScheduling(true);
    try {
      await onConfirm(sortedDays, repeatWeeks, replaceExisting, scheduleStart);
      onClose();
    } catch {
      return;
    } finally {
      setIsScheduling(false);
      submittingRef.current = false;
    }
  };

  const isReady = Boolean(program) && selectedDays.length === daysRequired && daysRequired > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isScheduling && onClose()}
      size="lg"
      title={isRTL ? `تطبيق ${programTitle}` : `Apply ${programTitle}`}
      description={
        isRTL
          ? 'اختر أيام التمرين، ثم مدة البرنامج قبل إضافته إلى التقويم.'
          : 'Pick your training days and program length before pushing it to the calendar.'
      }
    >
      <form onSubmit={handleSubmit} className="routine-schedule-form">
        <fieldset className="routine-fieldset">
          <legend className="routine-fieldset-legend">
            <span>{isRTL ? '1. اختر أيام التمرين' : '1. Select workout days'}</span>
            <span
              className="routine-fieldset-counter tabular-nums"
              data-ready={selectedDays.length === daysRequired}
            >
              {selectedDays.length} / {daysRequired} {isRTL ? 'محدد' : 'selected'}
            </span>
          </legend>
          <p className="routine-fieldset-hint">
            {isRTL ? (
              <>
                اختر <strong>{daysRequired} أيام</strong> في الأسبوع لجدولة الجلسات عليها.
              </>
            ) : (
              <>
                Pick <strong>{daysRequired} days</strong> per week to schedule this routine on.
              </>
            )}
          </p>
          <div className="routine-day-grid" role="group" aria-label={isRTL ? 'أيام الأسبوع' : 'Days of the week'}>
            {DAYS_OF_WEEK.map(day => {
              const selected = selectedDays.includes(day.value);
              const closed = day.value === CLOSED_DAY_VALUE;
              const disabled = closed || (!selected && selectedDays.length >= daysRequired);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className="routine-day-button"
                  data-selected={selected}
                  data-closed={closed}
                >
                  <span className="routine-day-button-main">
                    {selected && <CheckCircle width={14} height={14} aria-hidden="true" />}
                    <span>{isRTL ? day.shortAr : day.shortEn}</span>
                  </span>
                  <span className="routine-day-button-sub">
                    {closed ? (isRTL ? '🔒 مغلق' : '🔒 Closed') : isRTL ? day.labelAr : day.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="routine-fieldset">
          <legend className="routine-fieldset-legend">
            {isRTL ? '2. موعد البدء' : '2. When to start'}
          </legend>
          <div className="routine-choice-grid">
            <button
              type="button"
              onClick={() => setScheduleStart('thisWeek')}
              aria-pressed={scheduleStart === 'thisWeek'}
              className="routine-choice"
              data-selected={scheduleStart === 'thisWeek'}
            >
              <span className="routine-choice-head">
                <span>{isRTL ? 'هذا الأسبوع' : 'This Week'}</span>
                <span className="routine-choice-badge">{isRTL ? 'موصى به' : 'RECOMMENDED'}</span>
              </span>
              <span className="routine-choice-body">
                {isRTL ? 'يبدأ فوراً في أسبوعك الحالي.' : 'Starts immediately in your current week.'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleStart('nextWeek')}
              aria-pressed={scheduleStart === 'nextWeek'}
              className="routine-choice"
              data-selected={scheduleStart === 'nextWeek'}
            >
              <span className="routine-choice-head">
                <span>{isRTL ? 'الأسبوع القادم' : 'Next Week'}</span>
              </span>
              <span className="routine-choice-body">
                {isRTL ? 'يبدأ اعتباراً من السبت القادم.' : 'Begins from next Saturday.'}
              </span>
            </button>
          </div>
        </fieldset>

        <fieldset className="routine-fieldset">
          <legend className="routine-fieldset-legend">
            {isRTL ? '3. مدة البرنامج التدريبي' : '3. Program duration'}
          </legend>
          <div className="routine-choice-grid is-four">
            {REPEAT_OPTIONS.map(option => {
              const selected = repeatWeeks === option.weeks;
              return (
                <button
                  key={option.weeks}
                  type="button"
                  onClick={() => setRepeatWeeks(option.weeks)}
                  aria-pressed={selected}
                  className="routine-choice is-compact"
                  data-selected={selected}
                >
                  <span className="routine-choice-head is-centered">
                    {isRTL ? option.labelAr : option.labelEn}
                  </span>
                  <span className="routine-choice-body is-centered">
                    {option.isDefault
                      ? isRTL
                        ? 'الأكثر طلباً'
                        : 'Popular'
                      : isRTL
                        ? option.descAr
                        : option.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="routine-switch-row">
          <span>
            <span className="routine-switch-title">
              {isRTL ? 'استبدال التمارين السابقة في هذه الأيام' : 'Replace existing workouts on these days'}
            </span>
            <span className="routine-switch-desc">
              {isRTL
                ? 'يمنع تكرار الجلسات إذا أعدت الجدولة أو غيّرت البرنامج.'
                : 'Prevents duplicate sessions if you re-schedule or change programs.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={event => setReplaceExisting(event.target.checked)}
            style={{ width: 20, height: 20, accentColor: 'var(--accent-primary)' }}
          />
        </label>

        {preview && (
          <motion.div
            className="routine-schedule-summary"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="routine-schedule-summary-main">
              <Zap width={16} height={16} aria-hidden="true" />
              <span>
                {isRTL ? (
                  <>
                    جاهز لجدولة <strong>{preview.totalWorkouts} جلسة</strong> عبر {repeatWeeks}{' '}
                    {repeatWeeks === 1 ? 'أسبوع' : 'أسابيع'}. أول جلسة في{' '}
                    <strong>{preview.firstDate ? format(preview.firstDate, 'EEEE, d MMMM') : '—'}</strong>.
                  </>
                ) : (
                  <>
                    Ready to schedule <strong>{preview.totalWorkouts} sessions</strong> across {repeatWeeks}{' '}
                    {repeatWeeks === 1 ? 'week' : 'weeks'}. First session lands on{' '}
                    <strong>{preview.firstDate ? format(preview.firstDate, 'EEEE, d MMMM') : '—'}</strong>.
                  </>
                )}
              </span>
            </div>
            {preview.startsNextWeekAutomatically && (
              <p className="routine-schedule-summary-note">
                <Info width={13} height={13} aria-hidden="true" />
                {isRTL ? 'كل أيام هذا الأسبوع مضت، لذلك تم الجدولة من الأسبوع القادم.' : 'Every day this week has passed, so scheduling rolled to next week.'}
              </p>
            )}
            {preview.hasExcludedPastDays && !preview.startsNextWeekAutomatically && (
              <p className="routine-schedule-summary-note">
                <Info width={13} height={13} aria-hidden="true" />
                {isRTL ? 'تم استبعاد الأيام التي مضت من الجدولة.' : 'Days that already passed were excluded from the schedule.'}
              </p>
            )}
          </motion.div>
        )}

        <div className="routine-modal-actions">
          <Button type="button" variant="secondary" disabled={isScheduling} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isScheduling} disabled={!isReady}>
            <Calendar width={15} height={15} aria-hidden="true" />
            <span>{isRTL ? 'تطبيق على التقويم' : 'Apply to Calendar'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
