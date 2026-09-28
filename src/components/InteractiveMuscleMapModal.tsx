import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, ChevronRight, BookOpen, ArrowRight, ArrowLeft, Dumbbell, User } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { subDays, isAfter } from 'date-fns';
import { ExerciseGuideModal } from './ExerciseGuideModal';

interface InteractiveMuscleMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise?: (exerciseName: string) => void;
}

type MuscleId = 
  | 'chest' 
  | 'shoulders' 
  | 'biceps' 
  | 'abs' 
  | 'quads' 
  | 'traps' 
  | 'lats' 
  | 'triceps' 
  | 'lowerBack' 
  | 'glutes' 
  | 'hamstrings' 
  | 'calves';

interface MuscleData {
  id: MuscleId;
  nameKey: string;
  view: 'front' | 'back';
  exercises: string[];
}

const MUSCLE_DEFINITIONS: Record<MuscleId, MuscleData> = {
  chest: {
    id: 'chest',
    nameKey: 'Chest',
    view: 'front',
    exercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Chest Cable Fly', 'Push-ups', 'Dips']
  },
  shoulders: {
    id: 'shoulders',
    nameKey: 'Shoulders',
    view: 'front',
    exercises: ['Overhead Shoulder Press', 'Dumbbell Lateral Raise', 'Face Pulls', 'Front Dumbbell Raise', 'Reverse Pec Deck']
  },
  biceps: {
    id: 'biceps',
    nameKey: 'Biceps',
    view: 'front',
    exercises: ['Barbell Bicep Curl', 'Dumbbell Hammer Curl', 'Incline Dumbbell Curl', 'Preacher Curl', 'Cable Bicep Curl']
  },
  abs: {
    id: 'abs',
    nameKey: 'Core',
    view: 'front',
    exercises: ['Hanging Leg Raise', 'Plank', 'Cable Woodchopper', 'Ab Wheel Rollout', 'Crunches']
  },
  quads: {
    id: 'quads',
    nameKey: 'Legs',
    view: 'front',
    exercises: ['Barbell Back Squat', 'Leg Press', 'Bulgarian Split Squat', 'Leg Extension', 'Goblet Squat']
  },
  traps: {
    id: 'traps',
    nameKey: 'Traps',
    view: 'back',
    exercises: ['Dumbbell Shrugs', 'Barbell Shrugs', 'Rack Pulls', 'Farmers Walk']
  },
  lats: {
    id: 'lats',
    nameKey: 'Back',
    view: 'back',
    exercises: ['Lat Pulldown', 'Barbell Bent-Over Row', 'Pull-ups', 'Seated Cable Row', 'T-Bar Row']
  },
  triceps: {
    id: 'triceps',
    nameKey: 'Triceps',
    view: 'back',
    exercises: ['Tricep Rope Pushdown', 'Skull Crushers', 'Close-Grip Bench Press', 'Overhead Tricep Extension']
  },
  lowerBack: {
    id: 'lowerBack',
    nameKey: 'Lower Back',
    view: 'back',
    exercises: ['Conventional Deadlift', 'Hyperextensions', 'Good Mornings', 'Romanian Deadlift']
  },
  glutes: {
    id: 'glutes',
    nameKey: 'Glutes',
    view: 'back',
    exercises: ['Barbell Hip Thrust', 'Romanian Deadlift', 'Glute Kickback', 'Cable Pull Through']
  },
  hamstrings: {
    id: 'hamstrings',
    nameKey: 'Hamstrings',
    view: 'back',
    exercises: ['Lying Leg Curl', 'Seated Leg Curl', 'Romanian Deadlift', 'Nordic Hamstring Curl']
  },
  calves: {
    id: 'calves',
    nameKey: 'Calves',
    view: 'back',
    exercises: ['Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise', 'Leg Press Calf Press']
  }
};

export function InteractiveMuscleMapModal({ isOpen, onClose, onSelectExercise }: InteractiveMuscleMapModalProps) {
  const { data } = useData();
  const { t, isRTL, tExercise, tMuscle } = useTranslation();
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId>('chest');
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mobileTab, setMobileTab] = useState<'map' | 'exercises'>('map');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Compute sets performed per muscle group in the past 7 days
  const weeklyMuscleVolume = useMemo(() => {
    const volume: Record<string, number> = {};
    if (!data) return volume;

    const sevenDaysAgo = subDays(new Date(), 7);
    const recentWorkouts = (data.history || []).filter(h => {
      const d = new Date(h.date);
      return !isNaN(d.getTime()) && isAfter(d, sevenDaysAgo);
    });

    recentWorkouts.forEach(h => {
      h.snapshot?.exercises?.forEach(ex => {
        const muscle = (ex.targetMuscle || 'Other').toLowerCase();
        const completedSets = ex.sets?.filter(s => s.isCompleted).length || ex.sets?.length || 0;
        volume[muscle] = (volume[muscle] || 0) + completedSets;
      });
    });

    return volume;
  }, [data]);

  if (!isOpen) return null;

  const currentMuscleInfo = MUSCLE_DEFINITIONS[selectedMuscle];

  // Helper to map muscle definition to weekly sets
  const getMuscleSetCount = (id: MuscleId): number => {
    const targetKey = MUSCLE_DEFINITIONS[id].nameKey.toLowerCase();
    let count = weeklyMuscleVolume[targetKey] || 0;
    if (id === 'quads' || id === 'hamstrings' || id === 'glutes') {
      count = Math.max(count, weeklyMuscleVolume['legs'] || 0);
    }
    return count;
  };

  const getIntensityColor = (sets: number, isSelected: boolean) => {
    if (isSelected) return '#43dcff'; // glowing cyan
    if (sets >= 12) return '#ef4444'; // high volume red
    if (sets >= 5) return '#f59e0b'; // moderate amber
    return '#3b82f6'; // default rested blue
  };

  const frontMuscleIds: MuscleId[] = ['chest', 'shoulders', 'biceps', 'abs', 'quads', 'calves'];
  const backMuscleIds: MuscleId[] = ['traps', 'shoulders', 'lats', 'triceps', 'lowerBack', 'glutes', 'hamstrings', 'calves'];
  const currentViewMuscles = activeView === 'front' ? frontMuscleIds : backMuscleIds;

  return createPortal(
    <AnimatePresence>
      <div
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.84)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 15 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="modal-card"
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '820px',
            maxHeight: isMobile ? 'calc(100dvh - env(safe-area-inset-top, 0px) - 12px)' : '88vh',
            height: isMobile ? 'calc(100dvh - env(safe-area-inset-top, 0px) - 12px)' : 'auto',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: isMobile ? '24px 24px 0 0' : 'var(--radius-xl, 22px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
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
              padding: isMobile ? '1rem 1.15rem' : '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-tertiary)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(67, 220, 255, 0.2), rgba(133, 92, 255, 0.2))',
                  border: '1px solid rgba(67, 220, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 700 }}>
                  {t('muscleMapTitle')}
                </h2>
                <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-secondary)' }}>
                  {t('muscleMapSubtitle')}
                </p>
              </div>
            </div>

            <button className="btn-icon btn-ghost" onClick={onClose} style={{ padding: '0.5rem', minWidth: '40px', minHeight: '40px' }} aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Main Switcher (Anatomy vs Targeted Exercises) */}
          {isMobile && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem',
                padding: '0.5rem 0.85rem',
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={() => setMobileTab('map')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: mobileTab === 'map' ? 700 : 500,
                  backgroundColor: mobileTab === 'map' ? 'rgba(67, 220, 255, 0.16)' : 'transparent',
                  color: mobileTab === 'map' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: mobileTab === 'map' ? '1px solid rgba(67, 220, 255, 0.35)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <User size={15} />
                <span>{isRTL ? 'المجسم التشريحي' : 'Muscle Anatomy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('exercises')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: mobileTab === 'exercises' ? 700 : 500,
                  backgroundColor: mobileTab === 'exercises' ? 'rgba(67, 220, 255, 0.16)' : 'transparent',
                  color: mobileTab === 'exercises' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: mobileTab === 'exercises' ? '1px solid rgba(67, 220, 255, 0.35)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <Dumbbell size={15} />
                <span>{isRTL ? `التمارين (${currentMuscleInfo.exercises.length})` : `Exercises (${currentMuscleInfo.exercises.length})`}</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
            {/* View Switcher Tabs (Front / Back) */}
            {(!isMobile || mobileTab === 'map') && (
              <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-primary)', flexShrink: 0 }}>
                <button
                  className={`btn ${activeView === 'front' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    setActiveView('front');
                    if (MUSCLE_DEFINITIONS[selectedMuscle].view !== 'front') {
                      setSelectedMuscle('chest');
                    }
                  }}
                >
                  {t('frontView')}
                </button>
                <button
                  className={`btn ${activeView === 'back' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    setActiveView('back');
                    if (MUSCLE_DEFINITIONS[selectedMuscle].view !== 'back') {
                      setSelectedMuscle('lats');
                    }
                  }}
                >
                  {t('backView')}
                </button>
              </div>
            )}

            {/* Main Interactive Anatomy Grid / Views */}
            <div style={{
              display: isMobile ? 'flex' : 'grid',
              gridTemplateColumns: isMobile ? undefined : 'minmax(300px, 1fr) 1.2fr',
              flex: 1,
              overflow: 'hidden',
              flexDirection: isMobile ? 'column' : undefined
            }}>
              {/* SVG Graphic Representation (Visible on desktop or when mobileTab === 'map') */}
              {(!isMobile || mobileTab === 'map') && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '1rem 0.85rem' : '1.5rem',
                    borderRight: !isMobile && !isRTL ? '1px solid var(--border-color)' : 'none',
                    borderLeft: !isMobile && isRTL ? '1px solid var(--border-color)' : 'none',
                    borderBottom: isMobile ? '1px solid var(--border-color)' : 'none',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflowY: 'auto',
                    flex: isMobile ? 1 : undefined
                  }}
                >
                <svg
                  viewBox="0 0 320 540"
                  role="img"
                  aria-label={isRTL
                    ? `خريطة عضلية تفاعلية ${activeView === 'front' ? 'أمامية' : 'خلفية'}. استخدم قائمة العضلات أدناه للتنقل بلوحة المفاتيح.`
                    : `Interactive ${activeView === 'front' ? 'front' : 'back'} muscle map. Use the muscle list below for keyboard navigation.`}
                  style={{
                    width: '100%',
                    maxWidth: '280px',
                    height: 'auto',
                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))'
                  }}
                >
                  <defs>
                    {/* Neon Glow Filter for Selected Muscle */}
                    <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                    </linearGradient>
                  </defs>

                  {/* Athletic Body Silhouette Outline */}
                  <path
                    d="M 160,14 C 172,14 179,23 179,35 C 179,48 174,58 170,62 L 170,72 C 178,74 198,82 216,90 C 224,93 227,97 228,103 C 235,108 240,118 240,130 C 240,138 237,146 234,152 C 236,162 238,176 237,192 C 245,206 248,225 244,245 C 242,257 238,268 236,275 L 242,298 C 243,306 240,314 236,315 C 232,315 229,308 228,300 L 225,275 C 221,250 216,220 215,195 C 213,178 208,160 205,142 L 202,138 C 198,165 194,195 192,220 C 192,232 198,242 201,254 C 207,272 209,298 207,322 C 205,342 200,360 196,374 C 196,380 198,386 197,392 C 203,405 206,424 204,445 C 202,465 196,485 192,500 L 194,518 C 194,524 190,528 184,528 C 178,528 174,522 174,516 L 176,500 C 174,485 172,465 170,445 C 168,424 171,405 175,392 C 174,386 174,380 175,374 C 172,355 168,335 166,310 C 164,295 163,280 160,270 C 157,280 156,295 154,310 C 152,335 148,355 145,374 C 146,380 146,386 145,392 C 149,405 152,424 150,445 C 148,465 146,485 144,500 L 146,516 C 146,522 142,528 136,528 C 130,528 126,524 126,518 L 128,500 C 124,485 118,465 116,445 C 114,424 117,405 123,392 C 122,386 124,380 124,374 C 120,360 115,342 113,322 C 111,298 113,272 119,254 C 122,242 128,232 128,220 C 126,195 122,165 118,138 L 115,142 C 112,160 107,178 105,195 C 104,220 99,250 95,275 L 92,300 C 91,308 88,315 84,315 C 80,314 77,306 78,298 L 84,275 C 82,268 78,257 76,245 C 72,225 75,206 83,192 C 82,176 84,162 86,152 C 83,146 80,138 80,130 C 80,118 85,108 92,103 C 93,97 96,93 104,90 C 122,82 142,74 150,72 L 150,62 C 146,58 141,48 141,35 C 141,23 148,14 160,14 Z"
                    fill="url(#bodyGrad)"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="1.8"
                  />

                  {/* Anatomical Landmark Guides */}
                  {activeView === 'front' ? (
                    <>
                      <path d="M 122,96 C 136,99 152,98 160,100 C 168,98 184,99 198,96" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M 160,102 L 160,146" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeDasharray="2,2" />
                      <ellipse cx="134" cy="380" rx="6" ry="7" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
                      <ellipse cx="186" cy="380" rx="6" ry="7" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
                    </>
                  ) : (
                    <path d="M 160,72 L 160,230" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeDasharray="2,2" />
                  )}

                  {activeView === 'front' ? (
                    <g>
                      {/* CHEST (Pectoralis Major: Left & Right) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('chest')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Chest')} (${getMuscleSetCount('chest')} ${t('setWord')})`}</title>
                        <path
                          d="M 158,103 C 142,103 125,106 114,116 C 110,128 112,142 122,150 C 134,156 148,154 158,146 Z"
                          fill={getIntensityColor(getMuscleSetCount('chest'), selectedMuscle === 'chest')}
                          opacity={selectedMuscle === 'chest' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'chest' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'chest' ? 2 : 1}
                          filter={selectedMuscle === 'chest' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 162,103 C 178,103 195,106 206,116 C 210,128 208,142 198,150 C 186,156 172,154 162,146 Z"
                          fill={getIntensityColor(getMuscleSetCount('chest'), selectedMuscle === 'chest')}
                          opacity={selectedMuscle === 'chest' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'chest' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'chest' ? 2 : 1}
                          filter={selectedMuscle === 'chest' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* SHOULDERS (Deltoids: Anterior & Lateral) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('shoulders')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Shoulders')} (${getMuscleSetCount('shoulders')} ${t('setWord')})`}</title>
                        <path
                          d="M 108,98 C 96,95 91,102 85,112 C 81,122 83,136 88,144 C 94,146 102,136 106,126 C 110,116 112,105 108,98 Z"
                          fill={getIntensityColor(getMuscleSetCount('shoulders'), selectedMuscle === 'shoulders')}
                          opacity={selectedMuscle === 'shoulders' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'shoulders' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'shoulders' ? 2 : 1}
                          filter={selectedMuscle === 'shoulders' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 212,98 C 224,95 229,102 235,112 C 239,122 237,136 232,144 C 226,146 218,136 214,126 C 210,116 208,105 212,98 Z"
                          fill={getIntensityColor(getMuscleSetCount('shoulders'), selectedMuscle === 'shoulders')}
                          opacity={selectedMuscle === 'shoulders' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'shoulders' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'shoulders' ? 2 : 1}
                          filter={selectedMuscle === 'shoulders' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* BICEPS (Biceps Brachii) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('biceps')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Biceps')} (${getMuscleSetCount('biceps')} ${t('setWord')})`}</title>
                        <path
                          d="M 91,148 C 86,156 85,172 88,186 C 94,188 101,185 104,178 C 108,168 107,154 102,146 C 98,146 94,146 91,148 Z"
                          fill={getIntensityColor(getMuscleSetCount('biceps'), selectedMuscle === 'biceps')}
                          opacity={selectedMuscle === 'biceps' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'biceps' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'biceps' ? 2 : 1}
                          filter={selectedMuscle === 'biceps' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 229,148 C 234,156 235,172 232,186 C 226,188 219,185 216,178 C 212,168 213,154 218,146 C 222,146 226,146 229,148 Z"
                          fill={getIntensityColor(getMuscleSetCount('biceps'), selectedMuscle === 'biceps')}
                          opacity={selectedMuscle === 'biceps' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'biceps' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'biceps' ? 2 : 1}
                          filter={selectedMuscle === 'biceps' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* ABS & CORE (Rectus Abdominis 6-pack & Obliques) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('abs')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Core')} (${getMuscleSetCount('abs')} ${t('setWord')})`}</title>
                        {/* Upper Abs */}
                        <path
                          d="M 158,153 L 140,154 C 137,162 137,171 140,173 L 158,173 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 162,153 L 180,154 C 183,162 183,171 180,173 L 162,173 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        {/* Mid Abs */}
                        <path
                          d="M 158,176 L 139,176 C 137,186 137,195 139,197 L 158,197 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 162,176 L 181,176 C 183,186 183,195 181,197 L 162,176 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        {/* Lower Abs */}
                        <path
                          d="M 158,200 L 140,200 C 142,212 147,224 158,228 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 162,200 L 180,200 C 178,212 173,224 162,228 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        {/* External Obliques */}
                        <path
                          d="M 134,166 C 128,174 125,190 126,212 C 130,218 136,218 137,212 C 135,194 135,178 134,166 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 186,166 C 192,174 195,190 194,212 C 190,218 184,218 183,212 C 185,194 185,178 186,166 Z"
                          fill={getIntensityColor(getMuscleSetCount('abs'), selectedMuscle === 'abs')}
                          opacity={selectedMuscle === 'abs' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                          filter={selectedMuscle === 'abs' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* QUADS (Quadriceps: Vastus Lateralis, Rectus Femoris, Vastus Medialis) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('quads')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Legs')} (${getMuscleSetCount('quads')} ${t('setWord')})`}</title>
                        <path
                          d="M 125,250 C 117,270 114,302 116,334 C 118,354 124,368 130,370 C 134,364 140,360 144,362 C 148,348 152,320 154,286 C 154,272 144,258 125,250 Z"
                          fill={getIntensityColor(getMuscleSetCount('quads'), selectedMuscle === 'quads')}
                          opacity={selectedMuscle === 'quads' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'quads' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'quads' ? 2 : 1}
                          filter={selectedMuscle === 'quads' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 195,250 C 203,270 206,302 204,334 C 202,354 196,368 190,370 C 186,364 180,360 176,362 C 172,348 168,320 166,286 C 166,272 176,258 195,250 Z"
                          fill={getIntensityColor(getMuscleSetCount('quads'), selectedMuscle === 'quads')}
                          opacity={selectedMuscle === 'quads' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'quads' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'quads' ? 2 : 1}
                          filter={selectedMuscle === 'quads' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* CALVES (Front Profile) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('calves')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Calves')} (${getMuscleSetCount('calves')} ${t('setWord')})`}</title>
                        <path
                          d="M 124,394 C 118,416 118,442 124,468 C 128,484 132,490 136,492 C 139,484 142,462 144,440 C 145,418 141,400 134,394 Z"
                          fill={getIntensityColor(getMuscleSetCount('calves'), selectedMuscle === 'calves')}
                          opacity={selectedMuscle === 'calves' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'calves' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'calves' ? 2 : 1}
                          filter={selectedMuscle === 'calves' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 196,394 C 202,416 202,442 196,468 C 192,484 188,490 184,492 C 181,484 178,462 176,440 C 175,418 179,400 186,394 Z"
                          fill={getIntensityColor(getMuscleSetCount('calves'), selectedMuscle === 'calves')}
                          opacity={selectedMuscle === 'calves' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'calves' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'calves' ? 2 : 1}
                          filter={selectedMuscle === 'calves' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>
                    </g>
                  ) : (
                    <g>
                      {/* TRAPS (Trapezius Kite / Diamond) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('traps')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Traps')} (${getMuscleSetCount('traps')} ${t('setWord')})`}</title>
                        <path
                          d="M 160,68 C 166,74 184,82 198,90 C 188,98 175,115 168,136 C 164,152 161,168 160,180 C 159,168 156,152 152,136 C 145,115 132,98 122,90 C 136,82 154,74 160,68 Z"
                          fill={getIntensityColor(getMuscleSetCount('traps'), selectedMuscle === 'traps')}
                          opacity={selectedMuscle === 'traps' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'traps' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'traps' ? 2 : 1}
                          filter={selectedMuscle === 'traps' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* REAR SHOULDERS (Posterior Deltoids) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('shoulders')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Shoulders')} (${getMuscleSetCount('shoulders')} ${t('setWord')})`}</title>
                        <path
                          d="M 120,92 C 104,95 94,102 88,112 C 84,122 86,134 90,142 C 98,140 106,128 112,118 C 116,108 118,98 120,92 Z"
                          fill={getIntensityColor(getMuscleSetCount('shoulders'), selectedMuscle === 'shoulders')}
                          opacity={selectedMuscle === 'shoulders' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'shoulders' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'shoulders' ? 2 : 1}
                          filter={selectedMuscle === 'shoulders' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 200,92 C 216,95 226,102 232,112 C 236,122 234,134 230,142 C 222,140 214,128 208,118 C 204,108 202,98 200,92 Z"
                          fill={getIntensityColor(getMuscleSetCount('shoulders'), selectedMuscle === 'shoulders')}
                          opacity={selectedMuscle === 'shoulders' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'shoulders' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'shoulders' ? 2 : 1}
                          filter={selectedMuscle === 'shoulders' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* LATS (Latissimus Dorsi V-Taper Wings) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('lats')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Back')} (${getMuscleSetCount('lats')} ${t('setWord')})`}</title>
                        <path
                          d="M 126,130 C 122,154 122,180 128,212 C 136,215 146,212 154,204 C 155,188 156,168 156,150 C 148,138 136,132 126,130 Z"
                          fill={getIntensityColor(getMuscleSetCount('lats'), selectedMuscle === 'lats')}
                          opacity={selectedMuscle === 'lats' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'lats' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'lats' ? 2 : 1}
                          filter={selectedMuscle === 'lats' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 194,130 C 198,154 198,180 192,212 C 184,215 174,212 166,204 C 165,188 164,168 164,150 C 172,138 184,132 194,130 Z"
                          fill={getIntensityColor(getMuscleSetCount('lats'), selectedMuscle === 'lats')}
                          opacity={selectedMuscle === 'lats' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'lats' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'lats' ? 2 : 1}
                          filter={selectedMuscle === 'lats' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* TRICEPS (Triceps Brachii) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('triceps')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Triceps')} (${getMuscleSetCount('triceps')} ${t('setWord')})`}</title>
                        <path
                          d="M 89,144 C 85,154 84,170 86,186 C 92,188 98,185 101,176 C 105,166 104,152 100,144 C 96,143 92,143 89,144 Z"
                          fill={getIntensityColor(getMuscleSetCount('triceps'), selectedMuscle === 'triceps')}
                          opacity={selectedMuscle === 'triceps' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'triceps' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'triceps' ? 2 : 1}
                          filter={selectedMuscle === 'triceps' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 231,144 C 235,154 236,170 234,186 C 228,188 222,185 219,176 C 215,166 216,152 220,144 C 224,143 228,143 231,144 Z"
                          fill={getIntensityColor(getMuscleSetCount('triceps'), selectedMuscle === 'triceps')}
                          opacity={selectedMuscle === 'triceps' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'triceps' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'triceps' ? 2 : 1}
                          filter={selectedMuscle === 'triceps' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* LOWER BACK (Erector Spinae / Lumbar) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('lowerBack')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Lower Back')} (${getMuscleSetCount('lowerBack')} ${t('setWord')})`}</title>
                        <path
                          d="M 158,198 L 148,202 C 148,214 150,226 158,228 Z"
                          fill={getIntensityColor(getMuscleSetCount('lowerBack'), selectedMuscle === 'lowerBack')}
                          opacity={selectedMuscle === 'lowerBack' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'lowerBack' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'lowerBack' ? 2 : 1}
                          filter={selectedMuscle === 'lowerBack' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 162,198 L 172,202 C 172,214 170,226 162,228 Z"
                          fill={getIntensityColor(getMuscleSetCount('lowerBack'), selectedMuscle === 'lowerBack')}
                          opacity={selectedMuscle === 'lowerBack' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'lowerBack' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'lowerBack' ? 2 : 1}
                          filter={selectedMuscle === 'lowerBack' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* GLUTES (Gluteus Maximus) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('glutes')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Glutes')} (${getMuscleSetCount('glutes')} ${t('setWord')})`}</title>
                        <path
                          d="M 158,230 C 144,230 126,236 122,250 C 118,266 126,280 138,284 C 146,284 154,278 158,268 Z"
                          fill={getIntensityColor(getMuscleSetCount('glutes'), selectedMuscle === 'glutes')}
                          opacity={selectedMuscle === 'glutes' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'glutes' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'glutes' ? 2 : 1}
                          filter={selectedMuscle === 'glutes' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 162,230 C 176,230 194,236 198,250 C 202,266 194,280 182,284 C 174,284 166,278 162,268 Z"
                          fill={getIntensityColor(getMuscleSetCount('glutes'), selectedMuscle === 'glutes')}
                          opacity={selectedMuscle === 'glutes' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'glutes' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'glutes' ? 2 : 1}
                          filter={selectedMuscle === 'glutes' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* HAMSTRINGS (Posterior Thighs) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('hamstrings')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Hamstrings')} (${getMuscleSetCount('hamstrings')} ${t('setWord')})`}</title>
                        <path
                          d="M 124,288 C 118,308 116,334 122,364 C 126,368 136,368 142,364 C 146,344 148,318 152,288 C 142,288 132,288 124,288 Z"
                          fill={getIntensityColor(getMuscleSetCount('hamstrings'), selectedMuscle === 'hamstrings')}
                          opacity={selectedMuscle === 'hamstrings' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'hamstrings' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'hamstrings' ? 2 : 1}
                          filter={selectedMuscle === 'hamstrings' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 196,288 C 202,308 204,334 198,364 C 194,368 184,368 178,364 C 174,344 172,318 168,288 C 178,288 188,288 196,288 Z"
                          fill={getIntensityColor(getMuscleSetCount('hamstrings'), selectedMuscle === 'hamstrings')}
                          opacity={selectedMuscle === 'hamstrings' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'hamstrings' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'hamstrings' ? 2 : 1}
                          filter={selectedMuscle === 'hamstrings' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>

                      {/* CALVES (Back Gastrocnemius) */}
                      <g
                        cursor="pointer"
                        onClick={() => setSelectedMuscle('calves')}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <title>{`${tMuscle('Calves')} (${getMuscleSetCount('calves')} ${t('setWord')})`}</title>
                        <path
                          d="M 124,374 C 116,396 116,424 124,452 C 128,474 132,492 136,494 C 140,490 142,472 144,446 C 146,420 144,394 136,374 Z"
                          fill={getIntensityColor(getMuscleSetCount('calves'), selectedMuscle === 'calves')}
                          opacity={selectedMuscle === 'calves' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'calves' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'calves' ? 2 : 1}
                          filter={selectedMuscle === 'calves' ? 'url(#muscleGlow)' : undefined}
                        />
                        <path
                          d="M 196,374 C 204,396 204,424 196,452 C 192,474 188,492 184,494 C 180,490 178,472 176,446 C 174,420 176,394 184,374 Z"
                          fill={getIntensityColor(getMuscleSetCount('calves'), selectedMuscle === 'calves')}
                          opacity={selectedMuscle === 'calves' ? 0.95 : 0.72}
                          stroke={selectedMuscle === 'calves' ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                          strokeWidth={selectedMuscle === 'calves' ? 2 : 1}
                          filter={selectedMuscle === 'calves' ? 'url(#muscleGlow)' : undefined}
                        />
                      </g>
                    </g>
                  )}
                </svg>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                    {t('frequencyFresh')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    {t('frequencyModerate')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    {t('frequencyHigh')}
                  </span>
                </div>

                {/* Horizontal Quick-Select Muscle Chips */}
                <div style={{ width: '100%', marginTop: '1.1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'center' }}>
                    {isRTL ? 'اختر العضلة مباشرة أو انقر على المجسم:' : 'Tap muscle on body or select below:'}
                  </div>
                  <div
                    role="group"
                    aria-label={isRTL ? 'اختيار المجموعة العضلية' : 'Select muscle group'}
                    style={{
                      display: 'flex',
                      gap: '0.4rem',
                      overflowX: 'auto',
                      padding: '0.2rem 0.25rem 0.6rem',
                      WebkitOverflowScrolling: 'touch',
                      justifyContent: isMobile ? 'flex-start' : 'center',
                      flexWrap: isMobile ? 'nowrap' : 'wrap'
                    }}
                    className="hide-scrollbar"
                  >
                    {currentViewMuscles.map(id => {
                      const m = MUSCLE_DEFINITIONS[id];
                      const isSelected = selectedMuscle === id;
                      const sets = getMuscleSetCount(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedMuscle(id)}
                          style={{
                            minHeight: '44px',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            whiteSpace: 'nowrap',
                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: isSelected ? '#07101e' : 'var(--text-secondary)',
                            border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.18s'
                          }}
                        >
                          <span>{tMuscle(m.nameKey)}</span>
                          {sets > 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '999px',
                                backgroundColor: isSelected ? 'rgba(0,0,0,0.22)' : 'rgba(67,220,255,0.15)',
                                color: isSelected ? '#07101e' : 'var(--accent-primary)',
                                fontWeight: 700
                              }}
                            >
                              {sets}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Quick Action Banner */}
                {isMobile && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(67, 220, 255, 0.09)',
                      border: '1px solid rgba(67, 220, 255, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
                        {tMuscle(currentMuscleInfo.nameKey)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {getMuscleSetCount(selectedMuscle)} {t('setsTrainedThisWeek')} · {currentMuscleInfo.exercises.length} {isRTL ? 'تمارين مستهدفة' : 'targeted exercises'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileTab('exercises')}
                      className="btn btn-primary"
                      style={{
                        padding: '0.5rem 0.95rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        whiteSpace: 'nowrap',
                        borderRadius: '10px'
                      }}
                    >
                      <span>{isRTL ? 'عرض التمارين' : 'View Exercises'}</span>
                      {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Detail Panel for Selected Muscle (Visible on desktop or when mobileTab === 'exercises') */}
            {(!isMobile || mobileTab === 'exercises') && (
              <div
                style={{
                  padding: isMobile ? '1.15rem 1.15rem 2.5rem' : '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  flex: 1
                }}
              >
                <div style={{ marginBottom: '1.25rem' }}>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => setMobileTab('map')}
                      className="btn btn-ghost"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        marginBottom: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px'
                      }}
                    >
                      {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                      <span>{isRTL ? 'العودة للمجسم التشريحي' : 'Back to Muscle Map'}</span>
                    </button>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                      marginBottom: '0.4rem'
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {tMuscle(currentMuscleInfo.nameKey)}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(67, 220, 255, 0.15)',
                        color: 'var(--accent-primary)',
                        border: '1px solid rgba(67, 220, 255, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getMuscleSetCount(selectedMuscle)} {t('setsTrainedThisWeek')}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {t('targetedExercises')} ({currentMuscleInfo.exercises.length})
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
                  {currentMuscleInfo.exercises.map((exerciseName, index) => (
                    <motion.div
                      key={exerciseName}
                      initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md, 12px)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        cursor: onSelectExercise ? 'pointer' : 'default'
                      }}
                      onClick={() => onSelectExercise && onSelectExercise(exerciseName)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '1.75rem',
                            height: '1.75rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            flexShrink: 0
                          }}
                        >
                          {index + 1}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.35 }}>
                          {tExercise(exerciseName)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGuideExercise(exerciseName);
                          }}
                          style={{
                            background: 'rgba(70, 217, 255, 0.1)',
                            border: '1px solid rgba(70, 217, 255, 0.28)',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            color: '#46d9ff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(70, 217, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(70, 217, 255, 0.1)';
                          }}
                          title={isRTL ? 'عرض شرح وتكنيك التمرين' : 'View Exercise Form Guide'}
                        >
                          <BookOpen size={13} />
                          <span>{isRTL ? 'الشرح' : 'Guide'}</span>
                        </button>

                        {onSelectExercise && (
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}
                          >
                            <span>{t('add')}</span>
                            <ChevronRight className="w-3.5 h-3.5" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exercise Guide Modal */}
      <ExerciseGuideModal
        isOpen={!!selectedGuideExercise}
        onClose={() => setSelectedGuideExercise(null)}
        exerciseName={selectedGuideExercise || ''}
        targetMuscle={currentMuscleInfo.nameKey}
      />
    </AnimatePresence>,
    document.body
  );
}
