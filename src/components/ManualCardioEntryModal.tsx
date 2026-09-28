import { useState, useEffect, useCallback } from 'react';
import { Flame, Clock, Heart, Zap, MapPin, Check, FileText, Gauge } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { ModalShell, InlineNumberField, FieldError, PrimaryAction, SecondaryAction } from './AIMealVisionModal';

export interface ManualCardioData {
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned?: number;
  calories?: number;
  heartRate?: number;
  pace?: string;
  notes?: string;
}

interface ManualCardioEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  initialData?: Partial<ManualCardioData>;
  onSave: (data: ManualCardioData) => void;
  isAfterWorkout?: boolean;
}

const DURATION_PRESETS = [15, 20, 30, 45];

export function ManualCardioEntryModal({
  isOpen,
  onClose,
  exerciseName,
  initialData,
  onSave,
  isAfterWorkout = false
}: ManualCardioEntryModalProps) {
  const { isRTL, tExercise } = useTranslation();

  const [duration, setDuration] = useState('20');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [pace, setPace] = useState('');
  const [notes, setNotes] = useState('');
  const [durationError, setDurationError] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDuration(initialData?.durationMinutes ? String(initialData.durationMinutes) : '20');
    setDistance(initialData?.distanceKm != null ? String(initialData.distanceKm) : '');
    setCalories(initialData?.caloriesBurned ? String(initialData.caloriesBurned) : '');
    setHeartRate(initialData?.heartRate ? String(initialData.heartRate) : '');
    setPace(initialData?.pace || '');
    setNotes(initialData?.notes || '');
    setDurationError(null);
    setDistanceError(null);
  }, [isOpen, initialData]);

  const durationNum = Number(duration) || 0;
  const distanceNum = Number(String(distance).replace(',', '.')) || 0;

  const estimatedCalories = useCallback((mins: number, dist: number) => {
    if (dist > 0) return Math.round(dist * 68 + mins * 2);
    return Math.round(mins * 9.5);
  }, []);

  const handleEstimateCalories = () => {
    const estimate = estimatedCalories(Math.max(1, durationNum), distanceNum);
    setCalories(String(estimate));
    gymAudio.triggerSubtleHaptic([15]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!duration || durationNum <= 0) {
      setDurationError(isRTL ? 'أدخل مدة لا تقل عن دقيقة' : 'Enter a duration of at least 1 minute');
      document.getElementById('cardio-duration')?.focus();
      return;
    }
    if (distance && (Number.isNaN(distanceNum) || distanceNum < 0)) {
      setDistanceError(isRTL ? 'أدخل مسافة صحيحة' : 'Enter a valid distance');
      document.getElementById('cardio-distance')?.focus();
      return;
    }

    setDurationError(null);
    setDistanceError(null);

    const calNum = calories ? Number(calories) : undefined;

    gymAudio.triggerSubtleHaptic([35, 55, 35]);
    gymAudio.playSetCompleteChime();

    onSave({
      durationMinutes: Math.max(1, Math.round(durationNum)),
      distanceKm: distance && !Number.isNaN(distanceNum) ? distanceNum : undefined,
      caloriesBurned: calNum && !Number.isNaN(calNum) ? calNum : undefined,
      calories: calNum && !Number.isNaN(calNum) ? calNum : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      pace: pace.trim() || undefined,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="cardio-entry-title"
      title={isRTL ? 'إدخال بيانات الكارديو' : 'Manual cardio metrics'}
      subtitle={`${tExercise(exerciseName)}${isAfterWorkout ? (isRTL ? ' · بعد التمرين' : ' · post-workout') : ''}`}
      icon={<Flame size={19} />}
      accent="#38bdf8"
      maxWidth={480}
      footer={
        <>
          <SecondaryAction onClick={onClose} fullWidth>{isRTL ? 'إلغاء' : 'Cancel'}</SecondaryAction>
          <PrimaryAction type="submit" form="cardio-form" icon={<Check size={18} strokeWidth={3} />}>
            {isRTL ? 'حفظ وتثبيت بالسجل' : 'Save to history'}
          </PrimaryAction>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {isRTL
          ? 'سجّل قراءات جهاز المشي أو الكارديو لتخزين المسافة والسعرات الفعلية بدقة في سجل التمارين.'
          : 'Log your treadmill or cardio machine readings to store real distance, calories and heart rate in your history.'}
      </p>

      <form id="cardio-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.7rem' }}>
          <div>
            <label htmlFor="cardio-duration" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <Clock size={14} style={{ color: '#38bdf8' }} />
              {isRTL ? 'المدة (دقيقة)' : 'Duration (min)'}
            </label>
            <InlineNumberField
              id="cardio-duration"
              label=""
              value={duration}
              onChange={value => { setDuration(value); if (durationError) setDurationError(null); }}
              min={1}
              max={600}
              accent="#38bdf8"
              invalid={Boolean(durationError)}
              describedBy={durationError ? 'cardio-duration-error' : 'cardio-duration-hint'}
              dir="ltr"
              onEnter={() => document.getElementById('cardio-distance')?.focus()}
            />
            <span id="cardio-duration-hint" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.2rem' }}>
              {isRTL ? 'بالدقائق' : 'In minutes'}
            </span>
            {durationError && <FieldError id="cardio-duration-error" message={durationError} />}
          </div>

          <div>
            <label htmlFor="cardio-distance" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <MapPin size={14} style={{ color: '#10b981' }} />
              {isRTL ? 'المسافة (كم)' : 'Distance (km)'}
            </label>
            <InlineNumberField
              id="cardio-distance"
              label=""
              value={distance}
              onChange={value => { setDistance(value); if (distanceError) setDistanceError(null); }}
              inputMode="decimal"
              min={0}
              max={500}
              accent="#10b981"
              invalid={Boolean(distanceError)}
              describedBy={distanceError ? 'cardio-distance-error' : 'cardio-distance-hint'}
              dir="ltr"
              onEnter={() => document.getElementById('cardio-calories')?.focus()}
            />
            <span id="cardio-distance-hint" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.2rem' }}>
              {isRTL ? 'اختياري' : 'Optional'}
            </span>
            {distanceError && <FieldError id="cardio-distance-error" message={distanceError} />}
          </div>
        </div>

        <div role="group" aria-label={isRTL ? 'مدة سريعة' : 'Quick durations'} style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {DURATION_PRESETS.map(minutes => (
            <button
              key={minutes}
              type="button"
              onClick={() => setDuration(String(minutes))}
              aria-pressed={duration === String(minutes)}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 800,
                background: duration === String(minutes) ? 'rgba(56, 189, 248, 0.22)' : 'var(--bg-tertiary)',
                border: `1px solid ${duration === String(minutes) ? '#38bdf8' : 'var(--border-color)'}`,
                color: duration === String(minutes) ? '#38bdf8' : 'var(--text-secondary)',
                cursor: 'pointer',
                minHeight: 32
              }}
            >
              {minutes}m
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.7rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label htmlFor="cardio-calories" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <Flame size={14} style={{ color: '#f97316' }} />
                {isRTL ? 'السعرات (kcal)' : 'Calories (kcal)'}
              </label>
              <button
                type="button"
                onClick={handleEstimateCalories}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', minHeight: 30, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Gauge size={12} />
                {isRTL ? 'حساب آلي' : 'Estimate'}
              </button>
            </div>
            <InlineNumberField id="cardio-calories" label="" value={calories} onChange={setCalories} min={0} max={5000} accent="#f97316" dir="ltr" onEnter={() => document.getElementById('cardio-hr')?.focus()} />
          </div>

          <div>
            <label htmlFor="cardio-hr" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <Heart size={14} style={{ color: '#f43f5e' }} />
              {isRTL ? 'متوسط النبض (bpm)' : 'Avg HR (bpm)'}
            </label>
            <InlineNumberField id="cardio-hr" label="" value={heartRate} onChange={setHeartRate} min={30} max={230} accent="#f43f5e" dir="ltr" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.7rem' }}>
          <div>
            <label htmlFor="cardio-pace" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <Zap size={14} style={{ color: '#eab308' }} />
              {isRTL ? 'السرعة / الوتيرة' : 'Speed / pace'}
            </label>
            <input
              id="cardio-pace"
              type="text"
              value={pace}
              onChange={event => setPace(event.target.value)}
              placeholder={isRTL ? '10.5 كم/س' : '10.5 km/h'}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', fontWeight: 700, textAlign: 'center', minHeight: 46, borderRadius: '11px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div>
            <label htmlFor="cardio-notes" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <FileText size={14} style={{ color: '#a855f7' }} />
              {isRTL ? 'المستوى / الانحدار' : 'Incline / level'}
            </label>
            <input
              id="cardio-notes"
              type="text"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder={isRTL ? 'انحدار 3%' : 'Incline 3%'}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', fontWeight: 700, textAlign: 'center', minHeight: 46, borderRadius: '11px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
