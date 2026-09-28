import { useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Check, Minus, Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import type { BodyMetricEntry } from '../lib/api';
import { Button } from './ui/Button';
import { WidgetFrame, WidgetSkeleton, WidgetState } from './TodayBentoGrid';

const MIN_WEIGHT = 20;
const MAX_WEIGHT = 350;

export function BodyWeightWidget() {
  const { data, loading, saveBodyMetric } = useData();
  const { t, formatDate, isRTL } = useTranslation();

  const [isLogging, setIsLogging] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const unit = data?.settings?.weightUnit || 'kg';

  const sortedMetrics = useMemo(
    () => [...(data?.bodyMetrics || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data?.bodyMetrics],
  );

  const latestEntry = sortedMetrics[0];
  const previousEntry = sortedMetrics[1];

  const weightDiff = useMemo(() => {
    if (!latestEntry || !previousEntry) return null;
    return Number((latestEntry.weight - previousEntry.weight).toFixed(1));
  }, [latestEntry, previousEntry]);

  const loggedToday = useMemo(
    () => Boolean(latestEntry) && isSameDay(new Date(latestEntry!.date), new Date()),
    [latestEntry],
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = parseFloat(inputWeight);
    if (!Number.isFinite(value) || value < MIN_WEIGHT || value > MAX_WEIGHT) {
      setSaveError(isRTL ? `أدخل وزناً بين ${MIN_WEIGHT} و${MAX_WEIGHT} ${unit}.` : `Enter a weight between ${MIN_WEIGHT} and ${MAX_WEIGHT} ${unit}.`);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const now = new Date();
      const existingToday = sortedMetrics.find((entry) => isSameDay(new Date(entry.date), now));
      const entry: BodyMetricEntry = {
        id: existingToday ? existingToday.id : Date.now().toString(),
        date: now.toISOString(),
        weight: value,
        unit: unit as 'kg' | 'lb',
        bodyFat: existingToday?.bodyFat,
      };
      await saveBodyMetric(entry);
      setIsLogging(false);
      setInputWeight('');
    } catch {
      setSaveError(isRTL ? 'تعذّر حفظ الوزن. حاول مرة أخرى.' : 'Could not save your weight. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const status = loading && !latestEntry ? 'loading' : 'ready';
  const subtitle = latestEntry
    ? loggedToday
      ? isRTL ? 'تم التسجيل اليوم' : 'Recorded today'
      : `${isRTL ? 'آخر تسجيل' : 'Last'}: ${formatDate(new Date(latestEntry.date), 'MMM d')}`
    : isRTL ? 'لم يتم تسجيل وزنك بعد' : 'No weight logged yet';

  return (
    <WidgetFrame
      title={isRTL ? 'مؤشر وزن الجسم' : 'Body weight'}
      icon={<Scale size={15} aria-hidden="true" />}
      tone="emerald"
      trailing={
        !isLogging && status === 'ready' ? (
          <button
            type="button"
            className="forma-quiet-button"
            onClick={() => {
              setInputWeight(latestEntry ? String(latestEntry.weight) : '');
              setSaveError(null);
              setIsLogging(true);
            }}
          >
            <Plus size={14} aria-hidden="true" />
            <span>{isRTL ? 'تسجيل الوزن' : 'Log weight'}</span>
          </button>
        ) : undefined
      }
    >
      {status === 'loading' ? (
        <WidgetSkeleton rows={2} label={isRTL ? 'جارٍ تحميل سجل الوزن' : 'Loading weight log'} />
      ) : !latestEntry ? (
        <WidgetState
          title={isRTL ? 'لم يتم تسجيل وزنك بعد' : 'No weight logged yet'}
          description={isRTL ? 'سجّل وزنك لتتبع الاتجاه مع الوقت.' : 'Log your weight to track the trend over time.'}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setInputWeight('');
                setSaveError(null);
                setIsLogging(true);
              }}
            >
              {isRTL ? 'تسجيل الآن' : 'Log now'}
            </Button>
          }
        />
      ) : (
        <>
          <p className="today-bodyweight-subtitle">{subtitle}</p>

          <div
            className="today-bodyweight-reading"
            role="img"
            aria-label={
              isRTL
                ? `الوزن الحالي ${latestEntry.weight} ${latestEntry.unit || unit}${weightDiff === null ? '' : `، التغير ${weightDiff > 0 ? '+' : ''}${weightDiff}`}.`
                : `Current weight ${latestEntry.weight} ${latestEntry.unit || unit}${weightDiff === null ? '' : `, change ${weightDiff > 0 ? '+' : ''}${weightDiff}`}.`
            }
          >
            <strong className="tabular-nums" dir="ltr">
              {latestEntry.weight}
              <small>{latestEntry.unit || unit}</small>
            </strong>
            {weightDiff !== null && (
              <span className="today-bodyweight-delta" data-direction={weightDiff < 0 ? 'down' : weightDiff > 0 ? 'up' : 'flat'}>
                {weightDiff < 0 ? <TrendingDown size={13} aria-hidden="true" /> : weightDiff > 0 ? <TrendingUp size={13} aria-hidden="true" /> : <Minus size={13} aria-hidden="true" />}
                <span className="tabular-nums" dir="ltr">
                  {weightDiff > 0 ? `+${weightDiff}` : weightDiff} {latestEntry.unit || unit}
                </span>
              </span>
            )}
          </div>

          {isLogging && (
            <form className="today-bodyweight-form" onSubmit={handleSave} noValidate>
              <label className="forma-sr-only" htmlFor="bodyweight-input">
                {isRTL ? `الوزن بـ ${unit}` : `Weight in ${unit}`}
              </label>
              <input
                id="bodyweight-input"
                className="today-bodyweight-input"
                type="number"
                step="0.1"
                inputMode="decimal"
                autoFocus
                placeholder={isRTL ? `الوزن بـ (${unit})` : `Weight in (${unit})`}
                value={inputWeight}
                aria-invalid={saveError ? 'true' : 'false'}
                aria-describedby={saveError ? 'bodyweight-error' : undefined}
                onChange={(event) => setInputWeight(event.target.value)}
              />
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving} leftIcon={<Check size={14} />}>
                {isRTL ? 'حفظ' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsLogging(false)}>
                {t('cancel')}
              </Button>
              {saveError && (
                <p className="today-widget-error" id="bodyweight-error" role="alert">
                  {saveError}
                </p>
              )}
            </form>
          )}

          {sortedMetrics.length > 2 && !isLogging && (
            <div className="today-bodyweight-history">
              <span>{isRTL ? 'السجل الأخير' : 'Recent'}</span>
              <ul>
                {sortedMetrics.slice(0, 5).reverse().map((entry, index) => (
                  <li key={entry.id || index}>
                    <span className="tabular-nums">{entry.weight}</span>
                    <small>{format(new Date(entry.date), 'M/d')}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <table className="forma-sr-only">
            <caption>{isRTL ? 'سجل الأوزان' : 'Weight log'}</caption>
            <thead>
              <tr>
                <th scope="col">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th scope="col">{isRTL ? 'الوزن' : 'Weight'}</th>
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.slice(0, 7).map((entry, index) => (
                <tr key={entry.id || index}>
                  <th scope="row">{formatDate(new Date(entry.date), 'MMM d')}</th>
                  <td>{`${entry.weight} ${entry.unit || unit}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </WidgetFrame>
  );
}
