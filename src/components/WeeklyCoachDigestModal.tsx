import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Sparkles, X, RefreshCw, Trophy, Target, Compass,
  Dumbbell, Utensils, Flame, Calendar, AlertTriangle, Square
} from 'lucide-react';
import { generateGeminiJson } from '../lib/gemini';
import { format, subDays, isAfter } from 'date-fns';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { estimateWorkoutCalories } from '../lib/api';
import { useReducedMotion } from './performance/useReducedMotion';

interface WeeklyCoachDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CoachDigest {
  consistency: string;
  strength: string;
  nextWeekCue: string;
  generatedAt: string;
}

export function WeeklyCoachDigestModal({ isOpen, onClose }: WeeklyCoachDigestModalProps) {
  const { data } = useData();
  const { t, isRTL } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [digest, setDigest] = useState<CoachDigest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wasAborted, setWasAborted] = useState(false);
  const abortRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Define 7-day lookback window for current weekly digest
  const weekStart = useMemo(() => subDays(new Date(), 7), []);
  const weekKey = useMemo(() => format(new Date(), 'yyyy-ww'), []);
  const storageKey = `mygym_weekly_digest_${weekKey}_${isRTL ? 'ar' : 'en'}`;

  // Filter workouts and meals from the past 7 days
  const weeklyWorkouts = useMemo(() => {
    if (!data?.history) return [];
    return data.history.filter(h => {
      const d = new Date(h.date);
      return !isNaN(d.getTime()) && isAfter(d, weekStart);
    });
  }, [data?.history, weekStart]);

  const weeklyMeals = useMemo(() => {
    if (!data?.meals) return [];
    return data.meals.filter(m => {
      const d = new Date(m.date);
      return !isNaN(d.getTime()) && isAfter(d, weekStart);
    });
  }, [data?.meals, weekStart]);

  const totalCaloriesBurned = useMemo(() => {
    return weeklyWorkouts.reduce((acc, h) => {
      return acc + (h.burnedCalories || estimateWorkoutCalories(h.snapshot));
    }, 0);
  }, [weeklyWorkouts]);

  const totalCaloriesConsumed = useMemo(() => {
    return weeklyMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  }, [weeklyMeals]);

  // Load cached digest on mount if exists
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDigest(JSON.parse(saved));
      }
    } catch {
      // Ignore cache errors
    }
  }, [isOpen, storageKey]);

  const generateDigest = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    // Extract trained muscles and exercise highlights
    const trainedMuscles = new Set<string>();
    const keyExercises: string[] = [];
    weeklyWorkouts.forEach(w => {
      w.snapshot?.exercises?.forEach(ex => {
        if (ex.targetMuscle) trainedMuscles.add(ex.targetMuscle);
        if (ex.name && keyExercises.length < 8) keyExercises.push(ex.name);
      });
    });

    const langInstruction = isRTL
      ? `CRITICAL: Output MUST be in natural, professional, motivating ARABIC with high athletic terminology. Format output as valid JSON only, without any markdown code fences.`
      : `CRITICAL: Output MUST be in English. Format output as valid JSON only, without any markdown code fences.`;

    const prompt = `You are an elite, certified human performance & bodybuilding coach (CSCS).
Review the athlete's past 7 days of training and nutrition data:

- Workouts Completed: ${weeklyWorkouts.length} sessions
- Logged Exercises: ${keyExercises.join(', ') || 'General gym sessions'}
- Targeted Muscle Groups: ${Array.from(trainedMuscles).join(', ') || 'Full body'}
- Total Estimated Calories Burned in Gym: ${totalCaloriesBurned} kcal
- Meals Logged: ${weeklyMeals.length} meals
- Total Nutrition Calories Consumed: ${totalCaloriesConsumed} kcal

Write an ultra-punchy, high-impact 3-bullet weekly coaching digest:
1. "consistency": Evaluate their consistency and volume (e.g. attendance, discipline, workout distribution). Keep it to 1 concise, inspiring sentence.
2. "strength": Identify their biggest strength or win this week (e.g. progressive overload, balanced push/pull, calorie balance). Keep it to 1 concise sentence.
3. "nextWeekCue": Give 1 precise, actionable coaching cue for the upcoming week (e.g. prioritize recovery, increase leg volume, hit protein targets). Keep it to 1 concise sentence.

${langInstruction}

Strictly return JSON with this structure:
{
  "consistency": "...",
  "strength": "...",
  "nextWeekCue": "..."
}`;

    try {
      const parsed = await generateGeminiJson({
        prompt
      });

      if (abortRef.current) return;

      const newDigest: CoachDigest = {
        consistency: parsed.consistency || '',
        strength: parsed.strength || '',
        nextWeekCue: parsed.nextWeekCue || '',
        generatedAt: new Date().toISOString()
      };

      setDigest(newDigest);
      localStorage.setItem(storageKey, JSON.stringify(newDigest));
    } catch (err: any) {

      if (abortRef.current) return;
      console.error('Failed to generate weekly coach digest:', err);
      setErrorMessage(
        isRTL
          ? 'تعذر الاتصال بالمدرب الذكي. يرجى التأكد من اتصال الإنترنت والمحاولة ثانية.'
          : 'Failed to generate weekly digest. Please check your connection and try again.'
      );
    } finally {
      if (!abortRef.current) setIsGenerating(false);
    }
  };

  const handleAbort = () => {
    abortRef.current = true;
    setIsGenerating(false);
    setWasAborted(true);
  };

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

  if (!isOpen) return null;

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '0.75rem',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t('weeklyCoachDigest')}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 15 }}
          animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 15 }}
          className="modal-card"
          style={{
            backgroundColor: 'var(--bg-surface, #131722)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '560px',
            maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 20px)',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                padding: '0.65rem', 
                borderRadius: '12px', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                  {t('weeklyCoachDigest')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {t('weeklyCoachDigestDesc')}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-icon btn-ghost" 
              onClick={onClose}
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick 7-day stats pills */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '0.65rem', 
            marginBottom: '1.5rem',
            backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.03))',
            padding: '0.85rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{t('workoutsFinished')}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>
                {weeklyWorkouts.length}
              </div>
            </div>

            <div style={{ textAlign: 'center', borderRight: isRTL ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.06))', borderLeft: isRTL ? '1px solid var(--border-color, rgba(255,255,255,0.06))' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                <Utensils className="w-3.5 h-3.5" />
                <span>{t('mealsTracked')}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>
                {weeklyMeals.length}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                <Flame className="w-3.5 h-3.5" />
                <span>{t('totalBurned')}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>
                {totalCaloriesBurned}
              </div>
            </div>
          </div>

          {/* Digest Content or Initial Call-to-action */}
          {digest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Point 1: Consistency */}
              <div style={{
                background: 'linear-gradient(to right, rgba(99, 102, 241, 0.08), transparent)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRight: isRTL ? '3px solid #6366f1' : undefined,
                borderLeft: !isRTL ? '3px solid #6366f1' : undefined,
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Target className="w-4 h-4" />
                  <span>1. {t('coachConsistencyTitle')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.55, color: 'var(--text-primary)' }}>
                  {digest.consistency}
                </p>
              </div>

              {/* Point 2: Key Strength */}
              <div style={{
                background: 'linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRight: isRTL ? '3px solid #10b981' : undefined,
                borderLeft: !isRTL ? '3px solid #10b981' : undefined,
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Trophy className="w-4 h-4" />
                  <span>2. {t('coachStrengthTitle')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.55, color: 'var(--text-primary)' }}>
                  {digest.strength}
                </p>
              </div>

              {/* Point 3: Next Week Cue */}
              <div style={{
                background: 'linear-gradient(to right, rgba(245, 158, 11, 0.08), transparent)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRight: isRTL ? '3px solid #f59e0b' : undefined,
                borderLeft: !isRTL ? '3px solid #f59e0b' : undefined,
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Compass className="w-4 h-4" />
                  <span>3. {t('coachNextWeekTitle')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.55, color: 'var(--text-primary)' }}>
                  {digest.nextWeekCue}
                </p>
              </div>

              {digest.generatedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(digest.generatedAt), 'yyyy-MM-dd HH:mm')}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2.25rem 1rem',
              backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.02))',
              borderRadius: '12px',
              border: '1px dashed var(--border-color, rgba(255,255,255,0.1))',
              marginBottom: '1.5rem'
            }}>
              <Sparkles className="w-10 h-10" style={{ margin: '0 auto 0.75rem', color: '#a855f7', opacity: 0.8 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', marginInline: 'auto' }}>
                {t('weeklyCoachDigestDesc')}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="forma-ai-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} aria-hidden="true" />
                {isRTL ? 'تعذر إنشاء الملخص' : 'Digest generation failed'}
              </strong>
              <span>{errorMessage}</span>
              <button
                type="button"
                className="forma-figure-toggle"
                style={{ marginBlockStart: '0.25rem' }}
                onClick={generateDigest}
              >
                <RefreshCw size={12} aria-hidden="true" />
                <span>{isRTL ? 'إعادة المحاولة' : 'Try again'}</span>
              </button>
            </div>
          )}

          {wasAborted && !errorMessage && (
            <div className="forma-state-panel" role="status" style={{ marginBottom: '1.25rem' }}>
              <strong>{isRTL ? 'تم إيقاف إنشاء الملخص' : 'Digest generation stopped'}</strong>
              <span>{isRTL ? 'يمكنك إعادة المحاولة في أي وقت.' : 'You can retry whenever you are ready.'}</span>
            </div>
          )}

          {isGenerating && (
            <div className="forma-state-panel" role="status" aria-live="polite" style={{ marginBottom: '1.25rem' }}>
              <span aria-hidden="true" className="forma-ai-cursor" style={{ margin: 0 }} />
              <strong>{isRTL ? 'المدرب يحلل أسبوعك...' : 'Your coach is reviewing your week…'}</strong>
              <span>
                {isRTL
                  ? `قراءة ${weeklyWorkouts.length} تمريناً و${weeklyMeals.length} وجبة مسجلة.`
                  : `Reading ${weeklyWorkouts.length} workouts and ${weeklyMeals.length} logged meals.`}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isGenerating}
              style={{ minHeight: '48px' }}
            >
              {t('close')}
            </button>

            {isGenerating ? (
              <button
                type="button"
                className="btn"
                onClick={handleAbort}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '48px',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--danger) 18%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)',
                  color: 'var(--danger)',
                  fontWeight: 600
                }}
              >
                <Square size={14} fill="currentColor" aria-hidden="true" />
                <span>{isRTL ? 'إيقاف' : 'Stop'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={generateDigest}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '48px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} aria-hidden="true" />
                <span>
                  {digest ? t('refreshDigest') : t('generateWeeklyDigest')}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
