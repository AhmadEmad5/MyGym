import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Plus, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { BodyMetricEntry } from '../lib/api';

interface BodyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BodyMetricsModal({ isOpen, onClose }: BodyMetricsModalProps) {
  const { data, saveBodyMetric, deleteBodyMetric } = useData();
  const { t, isRTL, formatDate } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const weightUnit = data?.settings?.weightUnit || 'kg';

  const [weightInput, setWeightInput] = useState<string>('');
  const [bodyFatInput, setBodyFatInput] = useState<string>('');
  const [chestInput, setChestInput] = useState<string>('');
  const [waistInput, setWaistInput] = useState<string>('');
  const [armsInput, setArmsInput] = useState<string>('');
  const [thighsInput, setThighsInput] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sort metrics chronologically ascending for chart, descending for list
  const metricsAscending = useMemo(() => {
    return (data?.bodyMetrics || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data?.bodyMetrics]);

  const latestEntry = metricsAscending[metricsAscending.length - 1];
  const firstEntry = metricsAscending[0];

  const totalDelta = useMemo(() => {
    if (!latestEntry || !firstEntry || metricsAscending.length < 2) return null;
    const diff = latestEntry.weight - firstEntry.weight;
    return Math.round(diff * 10) / 10;
  }, [latestEntry, firstEntry, metricsAscending.length]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;

    const newEntry: BodyMetricEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: w,
      unit: weightUnit,
      bodyFat: bodyFatInput ? parseFloat(bodyFatInput) : undefined,
      chest: chestInput ? parseFloat(chestInput) : undefined,
      waist: waistInput ? parseFloat(waistInput) : undefined,
      arms: armsInput ? parseFloat(armsInput) : undefined,
      thighs: thighsInput ? parseFloat(thighsInput) : undefined
    };

    await saveBodyMetric(newEntry);
    setWeightInput('');
    setBodyFatInput('');
    setChestInput('');
    setWaistInput('');
    setArmsInput('');
    setThighsInput('');
  };

  if (!isOpen) return null;

  // Compute SVG chart coordinates
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
      const x = padding + (idx / (metricsAscending.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((m.weight - minW) / range) * (height - 2 * padding);
      return { x, y, weight: m.weight, date: m.date };
    });

    const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return { points, pathD, areaD, minW, maxW, width, height };
  })();

  return createPortal(
    <AnimatePresence>
      <div
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="modal-card"
          style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 20px)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl, 22px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-tertiary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(67, 220, 255, 0.2), rgba(133, 92, 255, 0.25))',
                  border: '1px solid rgba(67, 220, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Scale className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {t('bodyMetricsTitle')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {t('bodyMetricsSubtitle')}
                </p>
              </div>
            </div>

            <button className="btn-icon btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Metrics Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('currentWeight')}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {latestEntry ? latestEntry.weight : '—'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{weightUnit}</span>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('totalChange')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {totalDelta !== null && (
                    totalDelta > 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-cyan-400" />
                  )}
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: totalDelta === null ? 'var(--text-primary)' : totalDelta < 0 ? '#43dcff' : '#10b981' }}>
                    {totalDelta !== null ? `${totalDelta > 0 ? '+' : ''}${totalDelta}` : '—'}
                  </span>
                  {totalDelta !== null && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{weightUnit}</span>}
                </div>
              </div>

              {latestEntry?.bodyFat && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('bodyFat')}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                      {latestEntry.bodyFat}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SVG Weight Progression Trend Chart */}
            {chartPoints && (
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('weightTrend')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {metricsAscending.length} entries
                  </span>
                </div>
                <svg viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary, #43dcff)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--accent-primary, #43dcff)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={chartPoints.areaD} fill="url(#weightGrad)" />
                  <path d={chartPoints.pathD} fill="none" stroke="var(--accent-primary, #43dcff)" strokeWidth="2.5" strokeLinecap="round" />
                  {chartPoints.points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent-primary, #43dcff)" stroke="#fff" strokeWidth="1.5" />
                  ))}
                </svg>
              </div>
            )}

            {/* Log Weight Entry Form */}
            <form onSubmit={handleSave} style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
                {t('logMeasurement')}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    {t('currentWeight')} ({weightUnit}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 78.5"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    {t('bodyFat')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 15.2"
                    value={bodyFatInput}
                    onChange={e => setBodyFatInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Toggle extra circumferences */}
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0', marginTop: '0.75rem', color: 'var(--accent-primary)' }}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? (isRTL ? 'إخفاء قياسات المحيطات' : 'Hide circumferences') : (isRTL ? '+ إضافة قياسات المحيطات (خصر، صدر، ذراعين)' : '+ Add circumferences (waist, chest, arms)')}
              </button>

              {showAdvanced && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('chest')}</label>
                    <input type="number" step="0.5" className="input" style={{ width: '100%' }} value={chestInput} onChange={e => setChestInput(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('waist')}</label>
                    <input type="number" step="0.5" className="input" style={{ width: '100%' }} value={waistInput} onChange={e => setWaistInput(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('arms')}</label>
                    <input type="number" step="0.5" className="input" style={{ width: '100%' }} value={armsInput} onChange={e => setArmsInput(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('thighs')}</label>
                    <input type="number" step="0.5" className="input" style={{ width: '100%' }} value={thighsInput} onChange={e => setThighsInput(e.target.value)} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Plus className="w-4 h-4" />
                <span>{t('saveEntry')}</span>
              </button>
            </form>

            {/* Historical Entries List */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('weightTrend')}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {metricsAscending.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    {t('noMetricsYet')}
                  </p>
                ) : (
                  metricsAscending.slice().reverse().map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--accent-primary)' }}>
                            {entry.weight} {entry.unit}
                          </strong>
                          {entry.bodyFat && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              ({entry.bodyFat}% fat)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(new Date(entry.date), 'MMM d, yyyy · h:mm a')}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn-icon btn-ghost"
                        style={{ padding: '0.3rem', color: 'var(--danger, #ef4444)' }}
                        onClick={() => deleteBodyMetric(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
