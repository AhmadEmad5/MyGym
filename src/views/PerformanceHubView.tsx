import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, BrainCircuit, Camera, Check, HeartPulse, Sparkles,
  Watch, Flame, Zap, Clock, ShieldCheck, Trash2,
  RefreshCw, Moon, BatteryCharging, Trophy,
  X, CheckCircle2, Printer, AlertTriangle, Lightbulb
} from 'lucide-react';
import { generateGeminiJson } from '../lib/gemini';
import { useData } from '../hooks/useData';
import { CardioLog, computeAllPersonalRecords, DEFAULT_PERFORMANCE_INSIGHTS, PerformanceInsights, WeeklyAdaptivePlan } from '../lib/api';
import { selectPerformanceDatasets } from '../lib/selectors';
import { RecordTable } from '../components/performance/RecordTable';
import { DataPlotFrame } from '../components/performance/DataPlotFrame';
import { AdaptivePlanCallout } from '../components/performance/AdaptivePlanCallout';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { AthleteReportModal } from '../components/AthleteReportModal';
import { AthleticPowerRadar } from '../components/AthleticPowerRadar';
import { Button, Badge, EmptyState } from '../components/ui';

function InlineHint({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      className="ui-empty-description"
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', margin: '0.6rem 0 0', fontSize: '0.76rem' }}
    >
      <Lightbulb size={13} aria-hidden="true" style={{ color: '#46d9ff', flexShrink: 0, marginBlockStart: '0.15rem' }} />
      <span>{children}</span>
    </p>
  );
}

const CARDIO_ACTIVITIES: { id: string; nameKey: TranslationKey; icon: string }[] = [
  { id: 'Treadmill', nameKey: 'activityTreadmill', icon: '🏃' },
  { id: 'Stationary Bike', nameKey: 'activityBike', icon: '🚴' },
  { id: 'Rowing Machine', nameKey: 'activityRowing', icon: '🚣' },
  { id: 'Stairmaster', nameKey: 'activityStairmaster', icon: '🪜' },
  { id: 'Elliptical', nameKey: 'activityElliptical', icon: '⚡' },
  { id: 'Outdoor Run', nameKey: 'activityRun', icon: '👟' },
];

function SectionHeading({ kicker, title, trailing }: { kicker: string; title: string; trailing?: string }) {
  return (
    <div className="forma-narrative-heading">
      <div>
        <span className="forma-section-kicker-text">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {trailing && <span className="forma-count-label">{trailing}</span>}
    </div>
  );
}

function HubSkeleton() {
  return (
    <div className="forma-skeleton-stack" aria-hidden="true">
      <div className="forma-skeleton-block" style={{ height: '2.4rem', width: '55%' }} />
      <div className="forma-skeleton-block" style={{ height: '8.5rem' }} />
      <div className="forma-skeleton-block" style={{ height: '6rem' }} />
    </div>
  );
}

export function PerformanceHubView() {
  const { data, loading, saveInsights } = useData();
  const { t, isRTL, formatDate } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isAthleteReportOpen, setIsAthleteReportOpen] = useState(false);
  const [activity, setActivity] = useState('Treadmill');
  const [duration, setDuration] = useState('30');
  const [distanceKm, setDistanceKm] = useState('');
  const [calories, setCalories] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [pace, setPace] = useState('');

  const [sleep, setSleep] = useState<number>(() => data?.insights?.sleepHours ?? 7);
  const [fatigue, setFatigue] = useState<number>(() => data?.insights?.fatigue ?? 3);
  const [sleepSelected, setSleepSelected] = useState(() => typeof data?.insights?.sleepHours === 'number');
  const [fatigueSelected, setFatigueSelected] = useState(() => typeof data?.insights?.fatigue === 'number');
  const [image, setImage] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);
  const [justSavedNotice, setJustSavedNotice] = useState<string | null>(null);

  const insights = data?.insights || DEFAULT_PERFORMANCE_INSIGHTS;
  const hasSavedRecoveryInputs = typeof insights.sleepHours === 'number' && typeof insights.fatigue === 'number';
  const hasSelectedRecoveryInputs = sleepSelected && fatigueSelected;
  const recoveryMatchesSaved = hasSavedRecoveryInputs && sleep === insights.sleepHours && fatigue === insights.fatigue;
  const hasRecoveryToDisplay = recoveryMatchesSaved;
  const personalRecords = useMemo(() => {
    if (!data) return [];
    return Object.values(computeAllPersonalRecords(data.history || [], data.sessions || []))
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 8);
  }, [data?.history, data?.sessions]);
  const performanceDatasets = useMemo(() => (data ? selectPerformanceDatasets(data, '30d') : []), [data]);

  const weeklyPlan = useMemo(() => {
    const recent = (data?.sessions || []).filter(s => new Date(s.date).getTime() > Date.now() - 7 * 86400000);
    const completed = recent.filter(s => s.isCompleted).length;
    const fatigueValue = Number(fatigue) || 0;
    const sleepValue = Number(sleep) || 0;

    const sleepScore = Math.max(0, Math.min(100, 50 + (sleepValue - 4) * 12.5));
    const fatigueScore = Math.max(0, Math.min(100, 100 - fatigueValue * 10));
    const recovery = Math.round((sleepScore * 0.5) + (fatigueScore * 0.5));

    const adjustment: WeeklyAdaptivePlan['adjustment'] =
      recovery < 50 || fatigueValue >= 8
        ? 'deload'
        : recovery >= 80 && completed >= 3
          ? 'increase'
          : 'maintain';

    const change = adjustment === 'increase' ? 5 : adjustment === 'deload' ? -20 : 0;

    const message = adjustment === 'increase'
      ? t('peakAdvice')
      : adjustment === 'deload'
        ? t('recoveryAdvice')
        : t('optimalAdvice');

    return { adjustment, change, message, recovery, completed };
  }, [data?.sessions, fatigue, sleep, t]);

  const weeklyCardioTelemetry = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const logs = (insights.cardioLogs || []).filter(l => new Date(l.date).getTime() >= sevenDaysAgo);
    const totalMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    const totalDist = logs.reduce((acc, l) => acc + (l.distanceKm || 0), 0);
    const totalCal = logs.reduce((acc, l) => acc + (l.calories || 0), 0);
    return {
      minutes: totalMinutes,
      distance: Math.round(totalDist * 10) / 10,
      calories: totalCal,
      count: logs.length
    };
  }, [insights.cardioLogs]);

  useEffect(() => {
    if (!justSavedNotice) return;
    const timer = setTimeout(() => setJustSavedNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [justSavedNotice]);

  const compressImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setImage(canvas.toDataURL('image/jpeg', 0.82));
          setScanError(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const analyzeCameraCapture = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setScanError(null);
    try {
      const [prefix, base64] = image.split(',');
      const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const prompt = `Analyze this cardio machine display screen (treadmill, stationary bike, rower, etc.).
Extract all visible metrics into JSON format only:
{
  "activity": "Treadmill" | "Stationary Bike" | "Rowing Machine" | "Stairmaster" | "Elliptical" | "string",
  "durationMinutes": number | null,
  "distanceKm": number | null,
  "calories": number | null,
  "averageHeartRate": number | null,
  "pace": "string" | null,
  "summary": "concise description in ${isRTL ? 'Arabic' : 'English'}"
}
Do not hallucinate numbers not visible on the screen. Output raw JSON only.`;

      const parsed = await generateGeminiJson({
        prompt,
        imageBase64: base64,
        mimeType
      });

      if (parsed.activity) setActivity(parsed.activity);
      if (parsed.durationMinutes) setDuration(String(parsed.durationMinutes));
      if (parsed.distanceKm) setDistanceKm(String(parsed.distanceKm));
      if (parsed.calories) setCalories(String(parsed.calories));
      if (parsed.averageHeartRate) setHeartRate(String(parsed.averageHeartRate));
      if (parsed.pace) setPace(String(parsed.pace));
      setSummary(parsed.summary || (isRTL ? 'تم تحليل شاشة الكارديو بنجاح.' : 'Cardio display parsed successfully.'));
      (window as any).__cardioAnalysis = parsed;
    } catch {
      setSummary('');
      setScanError(isRTL
        ? 'تعذر قراءة الشاشة؛ يمكنك إدخال الأرقام في الحقول أدناه.'
        : 'Could not scan the display automatically. Enter the numbers in the fields below.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveCardio = async () => {
    const parsed = (window as any).__cardioAnalysis || {};
    const log: CardioLog = {
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      activity,
      durationMinutes: Math.max(0, Number(duration) || 0),
      distanceKm: distanceKm ? Number(distanceKm) : (typeof parsed.distanceKm === 'number' ? parsed.distanceKm : undefined),
      calories: calories ? Number(calories) : (typeof parsed.calories === 'number' ? parsed.calories : undefined),
      averageHeartRate: heartRate ? Number(heartRate) : (typeof parsed.averageHeartRate === 'number' ? parsed.averageHeartRate : undefined),
      pace: pace || parsed.pace || undefined,
      source: image ? 'camera' : 'manual',
      aiSummary: summary || undefined
    };

    await saveInsights({ ...insights, cardioLogs: [log, ...(insights.cardioLogs || [])] });
    setImage(null);
    setSummary('');
    setScanError(null);
    setDuration('30');
    setDistanceKm('');
    setCalories('');
    setHeartRate('');
    setPace('');
    delete (window as any).__cardioAnalysis;

    setJustSavedNotice(t('cardioLogSaved'));
  };

  const deleteCardioLog = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا السجل؟' : 'Delete this cardio session?')) return;
    const updated = (insights.cardioLogs || []).filter(l => l.id !== id);
    await saveInsights({ ...insights, cardioLogs: updated });
  };

  const saveRecovery = async () => {
    if (!sleepSelected || !fatigueSelected) {
      notify(isRTL ? 'اختر مدة النوم ومستوى الإجهاد الفعليين قبل الحفظ.' : 'Choose your actual sleep and fatigue values before saving.', 'warning');
      return;
    }
    const next: PerformanceInsights = {
      ...insights,
      sleepHours: Number(sleep) || 7,
      fatigue: Math.max(0, Math.min(10, Number(fatigue) || 0)),
      adaptivePlan: {
        weekOf: new Date().toISOString().slice(0, 10),
        recoveryScore: Math.round(weeklyPlan.recovery),
        adjustment: weeklyPlan.adjustment,
        volumeChangePercent: weeklyPlan.change,
        recommendation: weeklyPlan.message,
        updatedAt: new Date().toISOString()
      }
    };
    await saveInsights(next);
    setJustSavedNotice(t('adaptivePlanUpdated'));
  };

  const connectDevice = async (provider: 'Apple Health' | 'Google Fit' | 'Wearable') => {
    setSyncingDevice(provider);
    setTimeout(async () => {
      const devices = insights.connectedDevices || [];
      const existing = devices.find(d => d.provider === provider);
      let nextDevices;
      if (existing) {
        nextDevices = devices.map(d => d.provider === provider ? { ...d, lastSyncAt: new Date().toISOString(), status: 'connected' as const } : d);
      } else {
        nextDevices = [...devices, {
          id: provider.toLowerCase().replace(/\s+/g, '-'),
          name: provider,
          provider,
          status: 'connected' as const,
          lastSyncAt: new Date().toISOString()
        }];
      }
      await saveInsights({ ...insights, connectedDevices: nextDevices });
      setSyncingDevice(null);
    }, 1200);
  };

  const readinessColor = weeklyPlan.recovery >= 80 ? '#10b981' : weeklyPlan.recovery >= 50 ? '#f59e0b' : '#ef4444';
  const readinessStatusLabel = weeklyPlan.recovery >= 80 ? t('peakReadiness') : weeklyPlan.recovery >= 50 ? t('optimalPerformance') : t('recoveryMode');

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weeklyPlan.recovery / 100) * circumference;

  const isInitialLoading = loading && !data;

  const telemetryTiles = [
    {
      key: 'minutes',
      icon: <Clock size={22} />,
      value: weeklyCardioTelemetry.minutes,
      unit: t('min'),
      label: t('totalCardioMinutes'),
      tone: 'rgba(70, 217, 255, 0.12)',
      color: '#46d9ff'
    },
    {
      key: 'distance',
      icon: <Activity size={22} />,
      value: weeklyCardioTelemetry.distance,
      unit: 'km',
      label: t('totalCardioDistance'),
      tone: 'rgba(52, 211, 153, 0.12)',
      color: '#34d399'
    },
    {
      key: 'calories',
      icon: <Flame size={22} />,
      value: weeklyCardioTelemetry.calories,
      unit: 'kcal',
      label: t('totalCardioCalories'),
      tone: 'rgba(249, 115, 22, 0.12)',
      color: '#f97316'
    },
    {
      key: 'sessions',
      icon: <Trophy size={22} />,
      value: weeklyCardioTelemetry.count,
      unit: t('sessions'),
      label: t('cardioSessionsCount'),
      tone: 'rgba(168, 85, 247, 0.12)',
      color: '#a855f7'
    }
  ];

  return (
    <div className="zen-page-container performance-page" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <AnimatePresence>
        {justSavedNotice && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 'calc(var(--shell-topbar-inset) + 0.5rem)',
              insetInlineStart: 0,
              insetInlineEnd: 0,
              marginInline: 'auto',
              width: 'fit-content',
              zIndex: 9999,
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(8px)'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{justSavedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="zen-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div aria-hidden="true" style={{
              padding: '0.45rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(70, 217, 255, 0.18), rgba(168, 85, 247, 0.18))',
              color: '#46d9ff',
              display: 'flex'
            }}>
              <Activity size={24} />
            </div>
            <h1 style={{ margin: 0 }}>{t('performanceHubTitle')}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('performanceHubSubtitle')}</p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setIsAthleteReportOpen(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(6, 182, 212, 0.95))',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Printer size={17} style={{ marginInline: '0.35rem' }} aria-hidden="true" />
          <span>{isRTL ? 'تصدير تقرير المتدرب (PDF)' : 'Athlete Report (PDF)'}</span>
        </Button>
      </header>

      {hasRecoveryToDisplay && (
        <div className="performance-ready-strip">
          <div className="performance-ready-strip-copy">
            <span className="forma-section-kicker-text">{t('readinessShort')}</span>
            <span className="performance-ready-value">
              {weeklyPlan.recovery}
              <small>%</small>
            </span>
          </div>
          <span className="performance-ready-state" style={{ color: readinessColor }}>{readinessStatusLabel}</span>
        </div>
      )}

      {isInitialLoading ? (
        <div role="status" aria-live="polite">
          <span className="forma-sr-only">{isRTL ? 'جارٍ تحميل تقرير الأداء…' : 'Loading performance report…'}</span>
          <HubSkeleton />
        </div>
      ) : !data ? (
        <div className="forma-state-panel is-error" role="alert">
          <AlertTriangle size={22} aria-hidden="true" />
          <strong>{isRTL ? 'تعذر تحميل بيانات الأداء' : 'Performance data unavailable'}</strong>
          <span>{isRTL ? 'تحقق من الاتصال ثم أعد المحاولة. بياناتك لم تُحذف.' : 'Check your connection and retry. Your data has not been removed.'}</span>
        </div>
      ) : (
        <div className="forma-narrative-flow">
          <section className="forma-narrative-section" aria-labelledby="hub-headline">
            <SectionHeading
              kicker={isRTL ? 'القصة الأولى' : 'The headline'}
              title={isRTL ? 'جاهزيتك لهذا الأسبوع' : 'Your readiness this week'}
              trailing={isRTL ? 'مدى 7 أيام' : 'Last 7 days'}
            />
            <div className="forma-tile-grid">
              {telemetryTiles.map(tile => (
                <div className="forma-tile" key={tile.key}>
                  <div className="forma-tile-icon" aria-hidden="true" style={{ background: tile.tone, color: tile.color }}>
                    {tile.icon}
                  </div>
                  <div>
                    <div className="forma-tile-value" style={tile.key === 'calories' ? { color: '#f97316' } : undefined}>
                      {tile.value} <small>{tile.unit}</small>
                    </div>
                    <div className="forma-tile-label">{tile.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="forma-narrative-section" aria-labelledby="hub-trend">
            <SectionHeading
              kicker={isRTL ? 'الاتجاه' : 'The trend'}
              title={isRTL ? 'الاتجاهات الأسبوعية' : '30-day trends'}
              trailing={isRTL ? 'بيانات فعلية فقط' : 'Real data only'}
            />
            <div className="forma-performance-ledger-grid">
              <div className="forma-ledger-plots">
                {performanceDatasets.length === 0 ? (
                  <div className="forma-state-panel" role="status">
                    <Activity size={20} aria-hidden="true" />
                    <strong>{isRTL ? 'لا توجد اتجاهات بعد' : 'No trends yet'}</strong>
                    <span>{isRTL ? 'أكمل جلسات مسجلة لبناء منحنيات الحجم ووزن الجسم.' : 'Complete logged sessions to build volume and body-weight curves.'}</span>
                  </div>
                ) : performanceDatasets.map((dataset) => (
                  <DataPlotFrame
                    key={dataset.label}
                    dataset={{ ...dataset, label: isRTL ? (dataset.label === 'Training volume' ? 'حجم التدريب' : 'وزن الجسم') : dataset.label }}
                    emptyTitle={isRTL ? 'لا توجد بيانات كافية' : 'No data yet'}
                    emptyDescription={isRTL ? 'أكمل جلسات لبناء الاتجاهات.' : 'Complete sessions to build a real trend.'}
                    pointsLabel={isRTL ? 'نقاط' : 'points'}
                    dateLabel={isRTL ? 'التاريخ' : 'Date'}
                    isRTL={isRTL}
                  />
                ))}
              </div>
              <AdaptivePlanCallout
                plan={insights.adaptivePlan}
                emptyLabel={isRTL ? 'سيظهر التعديل الأسبوعي بعد تسجيل بيانات الاستشفاء.' : 'Weekly adjustment appears after recovery data is logged.'}
                labels={isRTL ? { recovery: 'الاستشفاء', adjustment: 'التعديل', volume: 'الحجم', updated: 'تم التحديث' } : undefined}
                isRTL={isRTL}
              />
            </div>
          </section>

          <section className="forma-narrative-section" aria-labelledby="hub-breakdown">
            <SectionHeading
              kicker={isRTL ? 'التفصيل' : 'The breakdown'}
              title={isRTL ? 'السجلات والتحليل' : 'Records & readiness'}
            />
            <AthleticPowerRadar />
            <div className="forma-performance-ledger">
              <div className="forma-ledger-section-header">
                <div>
                  <span className="forma-section-kicker-text">{isRTL ? 'سجل الأداء' : 'Training ledger'}</span>
                  <h2>{isRTL ? 'السجلات والقوة' : 'Records & load'}</h2>
                </div>
                <span className="forma-count-label">{isRTL ? 'بيانات فعلية فقط' : 'Real data only'}</span>
              </div>
              <div className="forma-performance-ledger-grid">
                <div className="forma-ledger-panel">
                  <RecordTable
                    records={personalRecords}
                    title={isRTL ? 'السجلات الشخصية' : 'Personal records'}
                    emptyTitle={isRTL ? 'لا توجد سجلات بعد' : 'No records yet'}
                    emptyDescription={isRTL ? 'أكمل جولات بوزن لبناء سجلات القوة.' : 'Complete weighted sets to establish strength records.'}
                    isRTL={isRTL}
                    labels={isRTL ? { exercise: 'التمرين', bestSet: 'أفضل جولة', oneRm: '1RM تقديري', date: 'التاريخ' } : undefined}
                  />
                </div>
                <div style={{ display: 'grid', gap: '0.85rem', minWidth: 0 }}>
                  <section className="forma-ledger-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <BrainCircuit size={18} style={{ color: '#a78bfa' }} aria-hidden="true" />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {hasRecoveryToDisplay ? t('readinessScore') : (isRTL ? 'سجل الاستشفاء' : 'Recovery log')}
                        </h3>
                      </div>
                      <Badge
                        tone={hasRecoveryToDisplay ? (weeklyPlan.recovery >= 80 ? 'emerald' : weeklyPlan.recovery >= 50 ? 'amber' : 'rose') : 'neutral'}
                        size="sm"
                      >
                        {hasRecoveryToDisplay ? readinessStatusLabel : (isRTL ? 'غير مسجل' : 'Not logged')}
                      </Badge>
                    </div>

                    {hasRecoveryToDisplay ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0 1rem', position: 'relative' }}>
                          <svg width="130" height="130" viewBox="0 0 120 120" role="img" aria-label={`${t('readinessScore')}: ${weeklyPlan.recovery}% ${readinessStatusLabel}`}>
                            <circle cx="60" cy="60" r={radius} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="10" fill="transparent" />
                            <circle
                              cx="60"
                              cy="60"
                              r={radius}
                              stroke={readinessColor}
                              strokeWidth="10"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              fill="transparent"
                              transform="rotate(-90 60 60)"
                            />
                          </svg>
                          <div style={{ position: 'absolute', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                              {weeklyPlan.recovery}%
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: readinessColor, marginTop: '0.2rem' }}>
                              {readinessStatusLabel}
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '0.8rem 0.95rem', borderRadius: '14px', background: `${readinessColor}12`, border: `1px solid ${readinessColor}33`, marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', color: readinessColor, fontWeight: 700, fontSize: '0.85rem' }}>
                            <Zap size={16} aria-hidden="true" />
                            <span>
                              {t('adaptiveWeeklyPlan')}: {weeklyPlan.change > 0 ? `+${weeklyPlan.change}%` : weeklyPlan.change < 0 ? `${weeklyPlan.change}%` : t('optimalPerformance')}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {weeklyPlan.message}
                          </p>
                        </div>
                        <InlineHint id="hub-readiness-hint">{t('readinessScoreHint')}</InlineHint>
                      </>
                    ) : (
                      <div className="forma-recovery-not-logged" role="status">
                        {hasSelectedRecoveryInputs
                          ? (isRTL ? 'هذه معاينة غير محفوظة. احفظ القياسات لعرض حالة الاستشفاء ضمن التقرير.' : 'Preview only. Save the selected measurements to add a recovery status to this report.')
                          : (isRTL ? 'لا توجد قياسات نوم أو إجهاد محفوظة بعد. اختر قياساتك الفعلية أدناه واحفظها لعرض الاستشفاء.' : 'Sleep and fatigue are not logged yet. Choose your actual values below and save to establish a recovery status.')}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      <fieldset style={{ border: 0, margin: 0, padding: 0 }} aria-describedby="hub-sleep-hint">
                        <legend style={{ display: 'flex', justifyContent: 'space-between', inlineSize: '100%', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Moon size={14} style={{ color: '#60a5fa' }} aria-hidden="true" /> {t('sleepHours')}
                          </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{sleep} hrs</strong>
                        </legend>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {[4, 5, 6, 7, 8, 9, 10].map(h => (
                            <button
                              key={h}
                              type="button"
                              aria-pressed={sleep === h}
                              onClick={() => { setSleep(h); setSleepSelected(true); }}
                              style={{
                                flex: 1,
                                minWidth: '44px',
                                minHeight: '44px',
                                padding: '0.45rem 0.2rem',
                                borderRadius: '9px',
                                border: sleep === h ? '1px solid #60a5fa' : '1px solid var(--premium-line)',
                                background: sleep === h ? 'rgba(96, 165, 250, 0.2)' : 'var(--bg-tertiary)',
                                color: sleep === h ? '#60a5fa' : 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                fontWeight: sleep === h ? 800 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <InlineHint id="hub-sleep-hint">{t('sleepInputHint')}</InlineHint>

                      <div>
                        <label htmlFor="hub-fatigue" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <BatteryCharging size={14} style={{ color: '#fb923c' }} aria-hidden="true" /> {t('fatigueLevel')}
                          </span>
                          <strong style={{ color: fatigue >= 7 ? '#ef4444' : fatigue >= 4 ? '#fb923c' : '#10b981' }}>
                            {fatigue}/10
                          </strong>
                        </label>
                        <input
                          id="hub-fatigue"
                          type="range"
                          min="0"
                          max="10"
                          value={fatigue}
                          aria-label={t('fatigueLevel')}
                          aria-valuetext={`${fatigue} out of 10`}
                          onChange={(e) => { setFatigue(Number(e.target.value)); setFatigueSelected(true); }}
                          style={{ width: '100%', accentColor: fatigue >= 7 ? '#ef4444' : fatigue >= 4 ? '#fb923c' : '#10b981', cursor: 'pointer', minHeight: '44px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <span>{t('freshnessLabel')}</span>
                          <span>{t('moderateLabel')}</span>
                          <span>{t('exhaustedLabel')}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      disabled={!sleepSelected || !fatigueSelected}
                      onClick={saveRecovery}
                      style={{
                        marginTop: '1.1rem',
                        width: '100%',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 700
                      }}
                    >
                      <ShieldCheck size={16} aria-hidden="true" />
                      <span>{t('updateAdaptivePlan')}</span>
                    </Button>
                  </section>
                </div>
              </div>
            </div>
          </section>

          <section className="forma-narrative-section" aria-labelledby="hub-detail">
            <SectionHeading
              kicker={isRTL ? 'التفاصيل' : 'The detail'}
              title={isRTL ? 'الكارديو والأجهزة' : 'Cardio & devices'}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
              <section className="forma-ledger-panel" id="hub-cardio-capture" style={{ padding: '1.25rem', scrollMarginTop: '5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Camera size={18} style={{ color: '#46d9ff' }} aria-hidden="true" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {t('cameraCardio')}
                    </h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.9rem' }}>
                  {t('cameraCardioHint')}
                </p>

                <div style={{ marginBottom: '0.9rem' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }} id="hub-activity-label">
                    {t('activityLabel')}
                  </span>
                  <div role="group" aria-labelledby="hub-activity-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                    {CARDIO_ACTIVITIES.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={activity === item.id}
                        onClick={() => setActivity(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          minHeight: '44px',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '10px',
                          border: activity === item.id ? '1px solid rgba(70, 217, 255, 0.45)' : '1px solid var(--premium-line)',
                          background: activity === item.id ? 'rgba(70, 217, 255, 0.16)' : 'var(--bg-tertiary)',
                          color: activity === item.id ? '#46d9ff' : 'var(--text-primary)',
                          fontSize: '0.78rem',
                          fontWeight: activity === item.id ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        <span title={t(item.nameKey)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t(item.nameKey)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && compressImage(e.target.files[0])}
                  style={{ display: 'none' }}
                />

                {image && (
                  <div style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    border: '1px solid rgba(70, 217, 255, 0.3)',
                    marginBottom: '0.9rem',
                    maxHeight: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src={image} alt={isRTL ? 'صورة شاشة الجهاز الملتقطة' : 'Captured machine display'} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      aria-label={isRTL ? 'إزالة الصورة' : 'Remove capture'}
                      style={{
                        position: 'absolute',
                        top: '0.45rem',
                        insetInlineEnd: '0.45rem',
                        minWidth: '44px',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(239, 68, 68, 0.85)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileRef.current?.click()}
                    style={{ flex: '1 1 9rem', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.84rem' }}
                  >
                    <Camera size={15} aria-hidden="true" />
                    <span>{t('takePicture')}</span>
                  </button>

                  {image && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isAnalyzing}
                      onClick={analyzeCameraCapture}
                      style={{
                        flex: '1 1 9rem',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.84rem',
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      }}
                    >
                      <Sparkles size={15} aria-hidden="true" />
                      <span>{isAnalyzing ? t('analyzingScreen') : t('aiScanCardio')}</span>
                    </button>
                  )}
                </div>

                {scanError && (
                  <div className="forma-ai-error" role="alert" style={{ marginBottom: '0.9rem' }}>
                    <strong>{isRTL ? 'فشل المسح' : 'Scan failed'}</strong>
                    <span>{scanError}</span>
                  </div>
                )}

                {summary && (
                  <p style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(70, 217, 255, 0.1)',
                    border: '1px solid rgba(70, 217, 255, 0.25)',
                    color: '#7dd3fc',
                    fontSize: '0.8rem',
                    margin: '0 0 0.9rem'
                  }}>
                    {summary}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 8rem), 1fr))', gap: '0.65rem' }}>
                  {([
                    { id: 'duration', label: t('durationMinutesLabel'), value: duration, set: setDuration, placeholder: '30', step: '1' },
                    { id: 'distance', label: t('distanceKmLabel'), value: distanceKm, set: setDistanceKm, placeholder: '3.5', step: '0.1' },
                    { id: 'calories', label: t('caloriesBurnedLabel'), value: calories, set: setCalories, placeholder: '250', step: '1' },
                    { id: 'hr', label: t('heartRateBpmLabel'), value: heartRate, set: setHeartRate, placeholder: '145', step: '1' }
                  ]).map(field => (
                    <div key={field.id}>
                      <label htmlFor={`hub-${field.id}`} style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        {field.label}
                      </label>
                      <input
                        id={`hub-${field.id}`}
                        className="input"
                        type="number"
                        inputMode="decimal"
                        step={field.step}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={e => field.set(e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="cyan"
                  onClick={saveCardio}
                  style={{
                    marginTop: '1.1rem',
                    width: '100%',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700
                  }}
                >
                  <Check size={16} aria-hidden="true" />
                  <span>{t('saveCardioLog')}</span>
                </Button>
              </section>

              <section className="forma-ledger-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Watch size={18} style={{ color: '#34d399' }} aria-hidden="true" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {t('connectedDevices')}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('connectedDevicesHint')}</span>
                </div>

                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {(['Apple Health', 'Google Fit', 'Wearable'] as const).map(provider => {
                    const dev = insights.connectedDevices?.find(d => d.provider === provider);
                    const isConnected = dev?.status === 'connected';
                    const isSyncing = syncingDevice === provider;

                    return (
                      <div
                        key={provider}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '14px',
                          background: 'var(--bg-tertiary)',
                          border: isConnected ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid var(--premium-line)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.6rem'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{provider}</strong>
                          <div style={{ fontSize: '0.74rem', color: isConnected ? '#34d399' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {isConnected ? `● ${t('connectedStatus')}` : t('deviceOffline')}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={isSyncing}
                          onClick={() => connectDevice(provider)}
                          style={{
                            minHeight: '44px',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.76rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} aria-hidden="true" />
                          <span>{isSyncing ? '…' : isConnected ? t('syncNow') : t('connect')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginBlockStart: '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.75rem' }}>
                    <HeartPulse size={18} style={{ color: '#fb7185' }} aria-hidden="true" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {t('savedCardioHistory')}
                    </h3>
                  </div>

                  {insights.cardioLogs?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '22rem', overflowY: 'auto' }} className="hide-scrollbar">
                      {insights.cardioLogs.slice(0, 15).map(log => (
                        <div
                          key={log.id}
                          style={{
                            padding: '0.8rem 0.9rem',
                            borderRadius: '14px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--premium-line)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                            <div aria-hidden="true" style={{ padding: '0.5rem', borderRadius: '12px', background: 'rgba(70, 217, 255, 0.12)', color: '#46d9ff', display: 'flex' }}>
                              <Flame size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.activity}</strong>
                                {log.source === 'camera' && (
                                  <span style={{ padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.14)', color: '#c084fc', fontSize: '0.68rem', fontWeight: 700 }}>
                                    AI Scan
                                  </span>
                                )}
                              </div>
                              <small style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                {formatDate(new Date(log.date), 'MMM d, yyyy · h:mm a')}
                              </small>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className="forma-record-chip">⏱️ {log.durationMinutes} min</span>
                            {log.distanceKm !== undefined && <span className="forma-record-chip is-cyan">📍 {log.distanceKm} km</span>}
                            {log.calories !== undefined && <span className="forma-record-chip is-amber">🔥 {log.calories} kcal</span>}
                            {log.averageHeartRate !== undefined && <span className="forma-record-chip is-rose">❤️ {log.averageHeartRate} bpm</span>}
                            <button
                              type="button"
                              onClick={() => deleteCardioLog(log.id)}
                              className="btn-icon btn-ghost"
                              style={{ minWidth: '44px', minHeight: '44px', color: 'var(--text-muted)' }}
                              title={t('delete')}
                              aria-label={`${t('delete')} ${log.activity}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Flame size={22} aria-hidden="true" />}
                      title={t('cardioLogEmptyTitle')}
                      description={t('cardioLogEmptyDesc')}
                      action={
                        <Button type="button" variant="cyan" onClick={() => fileRef.current?.click()} leftIcon={<Camera size={16} aria-hidden="true" />}>
                          {t('cardioLogEmptyAction')}
                        </Button>
                      }
                      secondaryAction={
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => document.getElementById('hub-cardio-capture')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        >
                          {t('cameraCardio')}
                        </Button>
                      }
                    />
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}

      <AthleteReportModal
        isOpen={isAthleteReportOpen}
        onClose={() => setIsAthleteReportOpen(false)}
      />
    </div>
  );
}
