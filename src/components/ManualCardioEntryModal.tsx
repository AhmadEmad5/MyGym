import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Flame, Clock, Heart, Zap, MapPin, X, Check, FileText } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

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

export function ManualCardioEntryModal({
  isOpen,
  onClose,
  exerciseName,
  initialData,
  onSave,
  isAfterWorkout = false
}: ManualCardioEntryModalProps) {
  const { isRTL, tExercise } = useTranslation();

  const [duration, setDuration] = useState<string>('20');
  const [distance, setDistance] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [pace, setPace] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDuration(initialData?.durationMinutes ? String(initialData.durationMinutes) : '20');
      setDistance(initialData?.distanceKm ? String(initialData.distanceKm) : '');
      setCalories(initialData?.caloriesBurned ? String(initialData.caloriesBurned) : '');
      setHeartRate(initialData?.heartRate ? String(initialData.heartRate) : '');
      setPace(initialData?.pace || '');
      setNotes(initialData?.notes || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleEstimateCalories = () => {
    const mins = parseFloat(duration) || 20;
    const dist = parseFloat(distance) || 0;
    gymAudio.triggerSubtleHaptic([15]);

    // Athletic calorie estimation: running/treadmill ~ 65-75 kcal/km or 9-11 kcal/min
    let est = Math.round(mins * 9.5);
    if (dist > 0) {
      est = Math.round(dist * 68 + mins * 2);
    }
    setCalories(String(est));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durNum = Math.max(1, parseInt(duration, 10) || 15);
    const distNum = distance.trim() ? parseFloat(distance.replace(/,/g, '.')) : undefined;
    const calNum = calories.trim() ? parseInt(calories, 10) : undefined;
    const hrNum = heartRate.trim() ? parseInt(heartRate, 10) : undefined;

    gymAudio.triggerSubtleHaptic([35, 55, 35]);
    gymAudio.playSetCompleteChime();

    onSave({
      durationMinutes: durNum,
      distanceKm: distNum && !isNaN(distNum) ? distNum : undefined,
      caloriesBurned: calNum && !isNaN(calNum) ? calNum : undefined,
      calories: calNum && !isNaN(calNum) ? calNum : undefined,
      heartRate: hrNum && !isNaN(hrNum) ? hrNum : undefined,
      pace: pace.trim() || undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="card modal-content"
          style={{
            width: '100%',
            maxWidth: '480px',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '22px',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 28px rgba(56, 189, 248, 0.15)',
            padding: '1.5rem',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(16, 185, 129, 0.25))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {isRTL ? 'إدخال بيانات الكارديو' : 'Manual Cardio Metrics'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {tExercise(exerciseName)} {isAfterWorkout ? (isRTL ? '· بعد التمرين' : '· Post-Workout') : ''}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-icon btn-ghost"
              onClick={onClose}
              style={{ padding: '0.45rem', borderRadius: '10px', color: 'var(--text-muted)' }}
              title={isRTL ? 'إغلاق' : 'Close'}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isRTL
              ? 'سجّل قراءات جهاز المشي أو الكارديو لتخزين المسافة والسعرات الفعلية بدقة في سجل التمارين وسجل الكارديو.'
              : 'Log your treadmill or cardio machine metrics to accurately save distance, calories, and heart rate to your history.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Row 1: Duration & Distance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {/* Duration */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <Clock size={14} style={{ color: '#38bdf8' }} />
                  <span>{isRTL ? 'المدة (دقيقة)' : 'Duration (min)'} *</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="20"
                  required
                  style={{ fontWeight: 800, fontSize: '1.05rem', textAlign: 'center', height: '44px', borderRadius: '10px' }}
                />
                {/* Duration Chips */}
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', justifyContent: 'center' }}>
                  {[15, 20, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(String(m))}
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: duration === String(m) ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: duration === String(m) ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                        color: duration === String(m) ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <MapPin size={14} style={{ color: '#10b981' }} />
                  <span>{isRTL ? 'المسافة (كم)' : 'Distance (km)'}</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  className="input"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value.replace(/,/g, '.'))}
                  placeholder="3.5"
                  style={{ fontWeight: 800, fontSize: '1.05rem', textAlign: 'center', height: '44px', borderRadius: '10px' }}
                />
                <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isRTL ? 'مثال: 3.2 كم' : 'e.g. 3.2 km'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Calories & Heart Rate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {/* Calories */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <Flame size={14} style={{ color: '#f97316' }} />
                    <span>{isRTL ? 'السعرات (kcal)' : 'Calories (kcal)'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleEstimateCalories}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title={isRTL ? 'حساب تقريبي بناءً على المدة والمسافة' : 'Auto estimate based on time & distance'}
                  >
                    ⚡ {isRTL ? 'حساب آلي' : 'Estimate'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="220"
                  style={{ fontWeight: 800, fontSize: '1.05rem', textAlign: 'center', height: '44px', borderRadius: '10px' }}
                />
              </div>

              {/* Heart Rate */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <Heart size={14} style={{ color: '#f43f5e' }} />
                  <span>{isRTL ? 'متوسط النبض (bpm)' : 'Avg HR (bpm)'}</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="145"
                  style={{ fontWeight: 800, fontSize: '1.05rem', textAlign: 'center', height: '44px', borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Row 3: Pace / Speed & Incline Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <Zap size={14} style={{ color: '#eab308' }} />
                  <span>{isRTL ? 'السرعة / الوتيرة' : 'Speed / Pace'}</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  placeholder={isRTL ? '10.5 km/h' : '10.5 km/h or 5:30/km'}
                  style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'center', height: '44px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <FileText size={14} style={{ color: '#a855f7' }} />
                  <span>{isRTL ? 'المستوى / الانحدار' : 'Incline / Level'}</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRTL ? 'انحدار 3% · مستوى 8' : 'Incline 3% · Lvl 8'}
                  style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'center', height: '44px', borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ flex: '1 1 35%', borderRadius: '12px', height: '46px', fontWeight: 700 }}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  flex: '2 1 65%',
                  borderRadius: '12px',
                  height: '46px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                <Check size={18} strokeWidth={3} />
                <span>{isRTL ? 'حفظ وتثبيت بالسجل' : 'Save to History'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
