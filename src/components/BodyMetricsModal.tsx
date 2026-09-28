import { useState, useMemo } from 'react';
import { Scale, Plus, Trash2, TrendingUp, TrendingDown, Ruler } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { BodyMetricEntry } from '../lib/api';
import { ModalShell, InlineNumberField, FieldError, PrimaryAction, SecondaryAction } from './AIMealVisionModal';

interface BodyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MetricField {
  key: 'weight' | 'bodyFat' | 'chest' | 'waist' | 'arms' | 'thighs';
  labelKey: 'currentWeight' | 'bodyFat' | 'chest' | 'waist' | 'arms' | 'thighs';
  required?: boolean;
  max: number;
}

export function BodyMetricsModal({ isOpen, onClose }: BodyMetricsModalProps) {
  const { data, saveBodyMetric, deleteBodyMetric } = useData();
  const { t, isRTL, formatDate } = useTranslation();

  const weightUnit = data?.settings?.weightUnit || 'kg';

  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [armsInput, setArmsInput] = useState('');
  const [thighsInput, setThighsInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  const metricsAscending = useMemo(() => {
    return (data?.bodyMetrics || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data?.bodyMetrics]);

  const latestEntry = metricsAscending[metricsAscending.length - 1];
  const firstEntry = metricsAscending[0];

  const totalDelta = useMemo(() => {
    if (!latestEntry || !firstEntry || metricsAscending.length < 2) return null;
    return Math.round((latestEntry.weight - firstEntry.weight) * 10) / 10;
  }, [latestEntry, firstEntry, metricsAscending.length]);

  const advancedFields: MetricField[] = useMemo(() => ([
    { key: 'chest', labelKey: 'chest', max: 300 },
    { key: 'waist', labelKey: 'waist', max: 300 },
    { key: 'arms', labelKey: 'arms', max: 150 },
    { key: 'thighs', labelKey: 'thighs', max: 200 }
  ]), []);

  const advancedValue: Record<string, string> = {
    chest: chestInput,
    waist: waistInput,
    arms: armsInput,
    thighs: thighsInput
  };
  const advancedSetter: Record<string, (value: string) => void> = {
    chest: setChestInput,
    waist: setWaistInput,
    arms: setArmsInput,
    thighs: setThighsInput
  };

  const clearForm = () => {
    setWeightInput('');
    setBodyFatInput('');
    setChestInput('');
    setWaistInput('');
    setArmsInput('');
    setThighsInput('');
    setWeightError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const w = Number(weightInput);
    if (!weightInput || Number.isNaN(w) || w <= 0) {
      setWeightError(isRTL ? 'أدخل وزناً صالحاً أكبر من صفر' : 'Enter a valid weight above zero');
      document.getElementById('metric-weight')?.focus();
      return;
    }
    setWeightError(null);

    const optional = (value: string) => {
      const n = Number(value);
      return value && !Number.isNaN(n) && n > 0 ? n : undefined;
    };

    const newEntry: BodyMetricEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: w,
      unit: weightUnit,
      bodyFat: optional(bodyFatInput),
      chest: optional(chestInput),
      waist: optional(waistInput),
      arms: optional(armsInput),
      thighs: optional(thighsInput)
    };

    await saveBodyMetric(newEntry);
    clearForm();
  };

  const chartPoints = (() => {
    if (metricsAscending.length < 2) return null;
    const weights = metricsAscending.map(m => m.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const range = Math.max(1, maxW - minW);

    const width = 460;
    const height = 140;
    const padding = 20;

    const points = metricsAscending.map((m, idx) => {
      const ratio = idx / (metricsAscending.length - 1);
      const logical = isRTL ? 1 - ratio : ratio;
      const x = padding + logical * (width - 2 * padding);
      const y = height - padding - ((m.weight - minW) / range) * (height - 2 * padding);
      return { x, y, weight: m.weight, date: m.date };
    });

    const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return { points, pathD, areaD, minW, maxW, width, height };
  })();
  const summaryCards = [
    { label: t('currentWeight'), value: latestEntry ? latestEntry.weight : '—', unit: weightUnit, color: 'var(--accent-primary)' },
    {
      label: t('totalChange'),
      value: totalDelta !== null ? `${totalDelta > 0 ? '+' : ''}${totalDelta}` : '—',
      unit: totalDelta !== null ? weightUnit : '',
      color: totalDelta === null ? 'var(--text-primary)' : totalDelta < 0 ? '#43dcff' : '#10b981',
      icon: totalDelta !== null
        ? totalDelta > 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-cyan-400" />
        : null
    },
    ...(latestEntry?.bodyFat
      ? [{ label: t('bodyFat'), value: `${latestEntry.bodyFat}%`, unit: '', color: '#f59e0b', icon: null }]
      : [])
  ];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="body-metrics-title"
      title={t('bodyMetricsTitle')}
      subtitle={t('bodyMetricsSubtitle')}
      icon={<Scale size={19} />}
      accent="#43dcff"
      maxWidth={680}
      footer={
        <>
          <SecondaryAction onClick={clearForm} fullWidth>{isRTL ? 'مسح' : 'Clear'}</SecondaryAction>
          <PrimaryAction type="submit" form="body-metric-form" icon={<Plus size={17} />}>
            {t('saveEntry')}
          </PrimaryAction>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.7rem' }}>
        {summaryCards.map((card, index) => (
          <div key={card.label} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{card.label}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.2rem' }}>
              {card.icon}
              <span style={{ fontSize: '1.4rem', fontWeight: 850, color: card.color, fontVariantNumeric: 'tabular-nums' }}>{card.value}</span>
              {card.unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{card.unit}</span>}
            </span>
            {index === 0 && !latestEntry && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{isRTL ? 'لم تُسجَّل قياسات بعد' : 'No measurements yet'}</span>}
          </div>
        ))}
      </div>

      {chartPoints && (
        <figure style={{ margin: 0, padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <figcaption style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.82rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('weightTrend')}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {metricsAscending.length} {isRTL ? 'قيمة' : 'entries'}
            </span>
          </figcaption>
          <svg
            viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
            role="img"
            aria-label={isRTL ? `رسم بياني للوزن من ${chartPoints.minW.toFixed(1)} إلى ${chartPoints.maxW.toFixed(1)} ${weightUnit}` : `Weight chart from ${chartPoints.minW.toFixed(1)} to ${chartPoints.maxW.toFixed(1)} ${weightUnit}`}
          >
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary, #43dcff)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent-primary, #43dcff)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chartPoints.areaD} fill="url(#weightGrad)" />
            <path d={chartPoints.pathD} fill="none" stroke="var(--accent-primary, #43dcff)" strokeWidth="2.5" strokeLinecap="round" />
            {chartPoints.points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent-primary, #43dcff)" stroke="#fff" strokeWidth="1.5" />
            ))}
          </svg>
        </figure>
      )}

      <form id="body-metric-form" onSubmit={handleSave} noValidate style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>{t('logMeasurement')}</h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem' }}>
          <div>
            <label htmlFor="metric-weight" style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              {t('currentWeight')} ({weightUnit}) <span aria-hidden="true" style={{ color: '#f87171' }}>*</span>
            </label>
            <InlineNumberField
              id="metric-weight"
              label=""
              value={weightInput}
              onChange={value => { setWeightInput(value); if (weightError) setWeightError(null); }}
              inputMode="decimal"
              min={20}
              max={400}
              accent="var(--accent-primary)"
              invalid={Boolean(weightError)}
              describedBy={weightError ? 'metric-weight-error' : 'metric-weight-hint'}
              dir="ltr"
              onEnter={() => document.getElementById('metric-bodyfat')?.focus()}
            />
            <span id="metric-weight-hint" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.2rem' }}>
              {isRTL ? 'الوزن بعد الصيام' : 'Net weigh-in weight'}
            </span>
            {weightError && <FieldError id="metric-weight-error" message={weightError} />}
          </div>

          <div>
            <label htmlFor="metric-bodyfat" style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t('bodyFat')}</label>
            <InlineNumberField
              id="metric-bodyfat"
              label=""
              value={bodyFatInput}
              onChange={setBodyFatInput}
              inputMode="decimal"
              min={1}
              max={70}
              suffix="%"
              accent="#f59e0b"
              dir="ltr"
            />
          </div>
        </div>

        <button
          type="button"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced(prev => !prev)}
          style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', minHeight: 30 }}
        >
          <Ruler size={12} />
          {showAdvanced
            ? (isRTL ? 'إخفاء قياسات المحيطات' : 'Hide circumferences')
            : (isRTL ? '+ إضافة قياسات المحيطات' : '+ Add circumferences')}
        </button>

        {showAdvanced && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem' }}>
            {advancedFields.map(field => (
              <div key={field.key}>
                <label htmlFor={`metric-${field.key}`} style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t(field.labelKey)} ({weightUnit})
                </label>
                <InlineNumberField
                  id={`metric-${field.key}`}
                  label=""
                  value={advancedValue[field.key]}
                  onChange={advancedSetter[field.key]}
                  inputMode="decimal"
                  min={1}
                  max={field.max}
                  accent="var(--accent-primary)"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        )}
      </form>

      <section aria-label={t('weightTrend')} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('weightTrend')}</h4>

        {metricsAscending.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.25rem', background: 'var(--bg-tertiary)', borderRadius: '14px' }}>
            {t('noMetricsYet')}
          </p>
        ) : (
          metricsAscending.slice().reverse().map(entry => (
            <div
              key={entry.id}
              style={{
                padding: '0.7rem 0.9rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {entry.weight} {entry.unit}
                  </strong>
                  {entry.bodyFat ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>({entry.bodyFat}% fat)</span>
                  ) : null}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatDate(new Date(entry.date), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void deleteBodyMetric(entry.id)}
                aria-label={isRTL ? `حذف قياس ${entry.weight} ${entry.unit}` : `Delete ${entry.weight} ${entry.unit} entry`}
                style={{ padding: '0.4rem', color: 'var(--danger, #ef4444)', background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9px', cursor: 'pointer', display: 'inline-flex', flexShrink: 0, minWidth: 38, minHeight: 38, alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </section>
    </ModalShell>
  );
}
