import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Scale, Plus, TrendingDown, TrendingUp, Minus, Check } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import type { BodyMetricEntry } from '../lib/api';

export function BodyWeightWidget() {
  const { data, saveBodyMetric } = useData();
  const { t, formatDate, isRTL } = useTranslation();

  const [isLogging, setIsLogging] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const unit = data?.settings?.weightUnit || 'kg';

  // Sort entries newest first
  const sortedMetrics = useMemo(() => {
    return [...(data?.bodyMetrics || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data?.bodyMetrics]);

  const latestEntry = sortedMetrics[0];
  const previousEntry = sortedMetrics[1];

  // Weight change vs previous
  const weightDiff = useMemo(() => {
    if (!latestEntry || !previousEntry) return null;
    const diff = latestEntry.weight - previousEntry.weight;
    return Number(diff.toFixed(1));
  }, [latestEntry, previousEntry]);

  // Is logged today
  const loggedToday = useMemo(() => {
    if (!latestEntry) return false;
    return isSameDay(new Date(latestEntry.date), new Date());
  }, [latestEntry]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputWeight);
    if (!val || val <= 0 || val > 350) return;

    setIsSaving(true);
    try {
      const today = new Date();
      // If already an entry today, update it; otherwise create new
      const existingToday = sortedMetrics.find(m => isSameDay(new Date(m.date), today));
      
      const entry: BodyMetricEntry = {
        id: existingToday ? existingToday.id : Date.now().toString(),
        date: today.toISOString(),
        weight: val,
        unit: unit as 'kg' | 'lb',
        bodyFat: existingToday?.bodyFat
      };

      await saveBodyMetric(entry);
      setIsLogging(false);
      setInputWeight('');
    } catch (err) {
      console.error('Failed to save weight:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card body-weight-widget" style={{
      padding: '1.15rem 1.25rem',
      borderRadius: '18px',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 78, 59, 0.15))',
      border: '1px solid rgba(16, 185, 129, 0.22)',
      marginBottom: '1.5rem',
      position: 'relative',
      boxShadow: '0 8px 24px -6px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Title and Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            padding: '0.45rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            display: 'flex'
          }}>
            <Scale size={19} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
              {isRTL ? 'مؤشر وزن الجسم' : 'Body Weight'}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {latestEntry 
                ? (loggedToday 
                    ? (isRTL ? 'تم التسجيل اليوم ✓' : 'Recorded today ✓') 
                    : `${isRTL ? 'آخر تسجيل:' : 'Last:'} ${formatDate(new Date(latestEntry.date), 'MMM d')}`)
                : (isRTL ? 'لم يتم تسجيل وزنك بعد' : 'No weight logged yet')}
            </span>
          </div>
        </div>

        {/* Current Weight & Difference */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {latestEntry && (
            <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {latestEntry.weight}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {latestEntry.unit || unit}
                </span>
              </div>
              {weightDiff !== null && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: weightDiff < 0 ? '#34d399' : weightDiff > 0 ? '#f59e0b' : 'var(--text-muted)'
                }}>
                  {weightDiff < 0 ? <TrendingDown size={12} /> : weightDiff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                  <span>{weightDiff > 0 ? `+${weightDiff}` : weightDiff} {latestEntry.unit || unit}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Log Button */}
          {!isLogging && (
            <button
              type="button"
              onClick={() => {
                setInputWeight(latestEntry ? String(latestEntry.weight) : '');
                setIsLogging(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>{isRTL ? 'تسجيل الوزن' : 'Log Weight'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Logging Form */}
      {isLogging && (
        <form onSubmit={handleSave} style={{
          marginTop: '0.85rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            autoFocus
            placeholder={isRTL ? `الوزن بـ (${unit})` : `Weight in (${unit})`}
            value={inputWeight}
            onChange={e => setInputWeight(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '140px',
              padding: '0.4rem 0.65rem',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isSaving || !inputWeight}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Check size={14} />
            <span>{isSaving ? '...' : (isRTL ? 'حفظ' : 'Save')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLogging(false)}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {t('cancel')}
          </button>
        </form>
      )}

      {/* Mini Trend Sparkline (last 5 entries) */}
      {sortedMetrics.length > 2 && !isLogging && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginTop: '0.75rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isRTL ? 'السجل الأخير:' : 'Recent:'}
          </span>
          {sortedMetrics.slice(0, 5).reverse().map((m, idx) => (
            <div key={m.id || idx} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.2rem 0.45rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)'
            }}>
              <span>{m.weight}</span>
              <small style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {format(new Date(m.date), 'M/d')}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
