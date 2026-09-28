import { useState, useMemo, useCallback } from 'react';
import { Activity, Zap, Clock, ChevronRight, Layers } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { computeMuscleRecovery, MuscleRecoveryStatus } from '../lib/recovery';
import { InteractiveMuscleMapModal } from './InteractiveMuscleMapModal';
import { WidgetFrame } from './TodayBentoGrid';

type MuscleKey = 'chest' | 'shoulders' | 'biceps' | 'abs' | 'quads' | 'traps' | 'lats' | 'triceps' | 'lowerBack' | 'glutes' | 'hamstrings' | 'calves';

interface MuscleMeta {
  key: MuscleKey;
  nameAr: string;
  nameEn: string;
  view: 'front' | 'back';
  recoveryGroupId: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
}

const MUSCLE_METAS: Record<MuscleKey, MuscleMeta> = {
  chest: { key: 'chest', nameAr: 'الصدر', nameEn: 'Chest', view: 'front', recoveryGroupId: 'chest' },
  shoulders: { key: 'shoulders', nameAr: 'الأكتاف', nameEn: 'Shoulders', view: 'front', recoveryGroupId: 'shoulders' },
  biceps: { key: 'biceps', nameAr: 'البايسبس', nameEn: 'Biceps', view: 'front', recoveryGroupId: 'arms' },
  abs: { key: 'abs', nameAr: 'البطن والوسط', nameEn: 'Core & Abs', view: 'front', recoveryGroupId: 'core' },
  quads: { key: 'quads', nameAr: 'الفخذ الأمامي', nameEn: 'Quadriceps', view: 'front', recoveryGroupId: 'legs' },
  traps: { key: 'traps', nameAr: 'الترابيس', nameEn: 'Trapezius', view: 'back', recoveryGroupId: 'back' },
  lats: { key: 'lats', nameAr: 'عضلات الظهر', nameEn: 'Lats & Back', view: 'back', recoveryGroupId: 'back' },
  triceps: { key: 'triceps', nameAr: 'الترايسبس', nameEn: 'Triceps', view: 'back', recoveryGroupId: 'arms' },
  lowerBack: { key: 'lowerBack', nameAr: 'أسفل الظهر', nameEn: 'Lower Back', view: 'back', recoveryGroupId: 'back' },
  glutes: { key: 'glutes', nameAr: 'المؤخرة', nameEn: 'Glutes', view: 'back', recoveryGroupId: 'legs' },
  hamstrings: { key: 'hamstrings', nameAr: 'الفخذ الخلفي', nameEn: 'Hamstrings', view: 'back', recoveryGroupId: 'legs' },
  calves: { key: 'calves', nameAr: 'السمانة', nameEn: 'Calves', view: 'back', recoveryGroupId: 'legs' }
};

const TONE_COLORS: Record<'ready' | 'recovering' | 'fatigued', string> = {
  ready: 'var(--accent-lime)',
  recovering: 'var(--color-warning)',
  fatigued: 'var(--color-danger)',
};

const toneForPercent = (percent: number): 'ready' | 'recovering' | 'fatigued' =>
  percent < 40 ? 'fatigued' : percent < 80 ? 'recovering' : 'ready';

const toneLabel = (isRTL: boolean, tone: 'ready' | 'recovering' | 'fatigued') => {
  if (tone === 'fatigued') return isRTL ? 'مجهَد' : 'Fatigued';
  if (tone === 'recovering') return isRTL ? 'قيد الاستشفاء' : 'Recovering';
  return isRTL ? 'جاهز للتدريب' : 'Ready to train';
};

export function MuscleRecoveryHeatmapWidget() {
  const { data } = useData();
  const { isRTL } = useTranslation();
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleKey>('chest');
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);

  const selectMuscle = useCallback((key: MuscleKey) => setSelectedMuscle(key), []);

  // Compute real recovery stats from past 72h history and sessions
  const recoveryOverview = useMemo(() => {
    return computeMuscleRecovery(data?.history || [], data?.sessions || []);
  }, [data?.history, data?.sessions]);

  // Map recovery info per muscle key
  const muscleRecoveryMap = useMemo(() => {
    const map: Record<MuscleKey, MuscleRecoveryStatus | undefined> = {} as any;
    for (const key of Object.keys(MUSCLE_METAS) as MuscleKey[]) {
      const meta = MUSCLE_METAS[key];
      const status = recoveryOverview.muscles.find(m => m.id === meta.recoveryGroupId);
      map[key] = status;
    }
    return map;
  }, [recoveryOverview]);

  const getMuscleTone = (key: MuscleKey) => toneForPercent(muscleRecoveryMap[key]?.percent ?? 100);

  const getMuscleFillColor = (key: MuscleKey, isSelected: boolean) =>
    isSelected ? 'var(--accent-cyan)' : TONE_COLORS[getMuscleTone(key)];

  const getMuscleOpacity = (key: MuscleKey, isSelected: boolean) => {
    if (isSelected) return 0.95;
    const tone = getMuscleTone(key);
    return tone === 'fatigued' ? 0.82 : tone === 'recovering' ? 0.75 : 0.88;
  };

  const groupProps = (key: MuscleKey) => {
    const selected = selectedMuscle === key;
    const meta = MUSCLE_METAS[key];
    const percent = muscleRecoveryMap[key]?.percent ?? 100;
    return {
      role: 'button' as const,
      tabIndex: 0,
      'aria-pressed': selected,
      'aria-label': `${isRTL ? meta.nameAr : meta.nameEn} — ${percent}% ${toneLabel(isRTL, getMuscleTone(key))}`,
      onClick: () => selectMuscle(key),
      onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectMuscle(key);
        }
      },
    };
  };

  const selectedInfo = MUSCLE_METAS[selectedMuscle];
  const selectedStatus = muscleRecoveryMap[selectedMuscle];
  const readinessPercent = selectedStatus ? selectedStatus.percent : 100;
  const selectedTone = toneForPercent(readinessPercent);

  // Ready muscles list for recommendation banner
  const readyMuscles = useMemo(() => {
    const ready = recoveryOverview.muscles.filter(m => m.percent >= 80);
    return ready.length > 0 ? ready : recoveryOverview.recommendedMuscles;
  }, [recoveryOverview]);

  const recoveryRows = useMemo(
    () => (Object.keys(MUSCLE_METAS) as MuscleKey[]).map((key) => ({
      key,
      name: isRTL ? MUSCLE_METAS[key].nameAr : MUSCLE_METAS[key].nameEn,
      view: MUSCLE_METAS[key].view,
      percent: muscleRecoveryMap[key]?.percent ?? 100,
      tone: getMuscleTone(key),
    })),
    [isRTL, muscleRecoveryMap],
  );

  return (
    <WidgetFrame
      id="today-muscle-hologram-section"
      title={isRTL ? 'خريطة جاهزية العضلات' : 'Muscle readiness heatmap'}
      icon={<Activity size={15} aria-hidden="true" />}
      tone="lime"
      className="today-muscle-heatmap"
      trailing={
        <>
          <span
            className="forma-badge"
            style={
              recoveryOverview.overallScore >= 75
                ? { color: 'var(--accent-lime)', background: 'rgba(190,242,100,0.16)', borderColor: 'rgba(190,242,100,0.32)' }
                : { color: 'var(--color-warning)', background: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.32)' }
            }
          >
            <span className="tabular-nums">{recoveryOverview.overallScore}%</span>
            <span>{isRTL ? 'جاهزية' : 'readiness'}</span>
          </span>
          <button
            type="button"
            className="forma-quiet-button"
            onClick={() => setIsFullModalOpen(true)}
            title={isRTL ? 'استكشاف تمارين العضلات' : 'Explore exercises'}
          >
            <Layers size={13} aria-hidden="true" />
            <span>{isRTL ? 'التمارين' : 'Explore'}</span>
          </button>
        </>
      }
    >
      <div className="today-muscle-banner">
        <div>
          <Zap size={15} aria-hidden="true" />
          <span>{isRTL ? 'مقترح اليوم (جاهز ومكتمل الطاقة):' : 'Prime for today (recovered):'}</span>
        </div>
        <div className="today-muscle-banner-tags">
          {readyMuscles.slice(0, 3).map(m => (
            <span key={m.id}>
              <span aria-hidden="true">✓</span> {isRTL ? m.nameAr : m.nameEn}
            </span>
          ))}
        </div>
      </div>

      <div className="muscle-heatmap-main-grid">
        <div className="today-muscle-figure-column">
          <div className="today-muscle-map-toggle" role="group" aria-label={isRTL ? 'جهة العرض' : 'Body view'}>
            <button
              type="button"
              aria-pressed={activeView === 'front'}
              onClick={() => {
                setActiveView('front');
                if (MUSCLE_METAS[selectedMuscle].view !== 'front') setSelectedMuscle('chest');
              }}
            >
              {isRTL ? 'الأمامية' : 'Front'}
            </button>
            <button
              type="button"
              aria-pressed={activeView === 'back'}
              onClick={() => {
                setActiveView('back');
                if (MUSCLE_METAS[selectedMuscle].view !== 'back') setSelectedMuscle('lats');
              }}
            >
              {isRTL ? 'الخلفية' : 'Back'}
            </button>
          </div>

          <div
            className="today-muscle-map-figure"
            role="img"
            aria-label={
              isRTL
                ? `رسم جسدي يوضح استشفاء ${activeView === 'front' ? 'الجهة الأمامية' : 'الجهة الخلفية'}. يتبعه جدول نصي كامل داخل البطاقة.`
                : `Muscle body map showing ${activeView === 'front' ? 'front' : 'back'} recovery. A full text table follows inside this card.`
            }
          >
            <svg viewBox="60 10 200 500" aria-hidden="true" focusable="false">
              <defs>
                <filter id="recoveryGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <path
                d="M 160,20 C 148,20 144,32 144,48 C 144,60 148,70 152,74 C 140,78 124,86 112,96 C 98,92 90,102 84,116 C 78,130 78,150 82,170 C 86,188 94,220 98,240 C 96,252 90,266 86,276 C 82,284 88,290 94,286 C 102,280 108,262 110,250 C 114,234 116,216 118,200 C 122,216 124,242 124,258 C 116,280 114,310 116,340 C 118,364 126,380 130,388 C 124,410 120,440 124,470 C 126,486 132,496 136,498 C 142,488 144,460 146,436 C 148,406 150,380 154,360 C 158,358 162,358 166,360 C 170,380 172,406 174,436 C 176,460 178,488 184,498 C 188,496 194,486 196,470 C 200,440 196,410 190,388 C 194,380 202,364 204,340 C 206,310 204,280 196,258 C 196,242 198,216 202,200 C 204,216 206,234 210,250 C 212,262 218,280 226,286 C 232,290 238,284 234,276 C 230,266 224,252 222,240 C 226,220 234,188 238,170 C 242,150 242,130 236,116 C 230,102 222,92 208,96 C 196,86 180,78 168,74 C 172,70 176,60 176,48 C 176,32 172,20 160,20 Z"
                fill="#0b111a"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
              />

              {activeView === 'front' ? (
                <g>
                  {/* CHEST */}
                  <g {...groupProps('chest')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 158,102 L 126,108 C 116,110 112,122 114,136 C 116,146 128,150 144,148 L 158,144 Z"
                      fill={getMuscleFillColor('chest', selectedMuscle === 'chest')}
                      opacity={getMuscleOpacity('chest', selectedMuscle === 'chest')}
                      stroke={selectedMuscle === 'chest' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'chest' ? 2 : 1}
                      filter={selectedMuscle === 'chest' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 162,102 L 194,108 C 204,110 208,122 206,136 C 204,146 192,150 176,148 L 162,144 Z"
                      fill={getMuscleFillColor('chest', selectedMuscle === 'chest')}
                      opacity={getMuscleOpacity('chest', selectedMuscle === 'chest')}
                      stroke={selectedMuscle === 'chest' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'chest' ? 2 : 1}
                      filter={selectedMuscle === 'chest' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* SHOULDERS */}
                  <g {...groupProps('shoulders')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 108,98 C 96,95 91,102 85,112 C 81,122 83,136 88,144 C 94,146 102,136 106,126 C 110,116 112,105 108,98 Z"
                      fill={getMuscleFillColor('shoulders', selectedMuscle === 'shoulders')}
                      opacity={getMuscleOpacity('shoulders', selectedMuscle === 'shoulders')}
                      stroke={selectedMuscle === 'shoulders' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'shoulders' ? 2 : 1}
                      filter={selectedMuscle === 'shoulders' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 212,98 C 224,95 229,102 235,112 C 239,122 237,136 232,144 C 226,146 218,136 214,126 C 210,116 208,105 212,98 Z"
                      fill={getMuscleFillColor('shoulders', selectedMuscle === 'shoulders')}
                      opacity={getMuscleOpacity('shoulders', selectedMuscle === 'shoulders')}
                      stroke={selectedMuscle === 'shoulders' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'shoulders' ? 2 : 1}
                      filter={selectedMuscle === 'shoulders' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* BICEPS */}
                  <g {...groupProps('biceps')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 91,148 C 86,156 85,172 88,186 C 94,188 101,185 104,178 C 108,168 107,154 102,146 C 98,146 94,146 91,148 Z"
                      fill={getMuscleFillColor('biceps', selectedMuscle === 'biceps')}
                      opacity={getMuscleOpacity('biceps', selectedMuscle === 'biceps')}
                      stroke={selectedMuscle === 'biceps' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'biceps' ? 2 : 1}
                      filter={selectedMuscle === 'biceps' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 229,148 C 234,156 235,172 232,186 C 226,188 219,185 216,178 C 212,168 213,154 218,146 C 222,146 226,146 229,148 Z"
                      fill={getMuscleFillColor('biceps', selectedMuscle === 'biceps')}
                      opacity={getMuscleOpacity('biceps', selectedMuscle === 'biceps')}
                      stroke={selectedMuscle === 'biceps' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'biceps' ? 2 : 1}
                      filter={selectedMuscle === 'biceps' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* ABS / CORE */}
                  <g {...groupProps('abs')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 158,153 L 140,154 C 137,162 137,171 140,173 L 158,173 Z"
                      fill={getMuscleFillColor('abs', selectedMuscle === 'abs')}
                      opacity={getMuscleOpacity('abs', selectedMuscle === 'abs')}
                      stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                    />
                    <path
                      d="M 162,153 L 180,154 C 183,162 183,171 180,173 L 162,173 Z"
                      fill={getMuscleFillColor('abs', selectedMuscle === 'abs')}
                      opacity={getMuscleOpacity('abs', selectedMuscle === 'abs')}
                      stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                    />
                    <path
                      d="M 158,177 L 138,177 C 136,186 136,196 138,202 L 158,202 Z"
                      fill={getMuscleFillColor('abs', selectedMuscle === 'abs')}
                      opacity={getMuscleOpacity('abs', selectedMuscle === 'abs')}
                      stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                    />
                    <path
                      d="M 162,177 L 182,177 C 184,186 184,196 182,202 L 162,202 Z"
                      fill={getMuscleFillColor('abs', selectedMuscle === 'abs')}
                      opacity={getMuscleOpacity('abs', selectedMuscle === 'abs')}
                      stroke={selectedMuscle === 'abs' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'abs' ? 2 : 1}
                    />
                  </g>

                  {/* QUADS */}
                  <g {...groupProps('quads')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 125,250 C 117,270 114,302 116,334 C 118,354 124,368 130,370 C 134,364 140,360 144,362 C 148,348 152,320 154,286 C 154,272 144,258 125,250 Z"
                      fill={getMuscleFillColor('quads', selectedMuscle === 'quads')}
                      opacity={getMuscleOpacity('quads', selectedMuscle === 'quads')}
                      stroke={selectedMuscle === 'quads' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'quads' ? 2 : 1}
                      filter={selectedMuscle === 'quads' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 195,250 C 203,270 206,302 204,334 C 202,354 196,368 190,370 C 186,364 180,360 176,362 C 172,348 168,320 166,286 C 166,272 176,258 195,250 Z"
                      fill={getMuscleFillColor('quads', selectedMuscle === 'quads')}
                      opacity={getMuscleOpacity('quads', selectedMuscle === 'quads')}
                      stroke={selectedMuscle === 'quads' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'quads' ? 2 : 1}
                      filter={selectedMuscle === 'quads' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>
                </g>
              ) : (
                <g>
                  {/* TRAPS */}
                  <g {...groupProps('traps')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 160,76 L 148,88 C 134,96 128,102 128,108 L 144,116 L 160,136 L 176,116 L 192,108 C 192,102 186,96 172,88 Z"
                      fill={getMuscleFillColor('traps', selectedMuscle === 'traps')}
                      opacity={getMuscleOpacity('traps', selectedMuscle === 'traps')}
                      stroke={selectedMuscle === 'traps' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'traps' ? 2 : 1}
                      filter={selectedMuscle === 'traps' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* LATS */}
                  <g {...groupProps('lats')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 142,126 L 126,118 C 118,128 116,150 118,176 C 122,192 128,206 138,212 L 144,210 C 146,188 146,156 142,126 Z"
                      fill={getMuscleFillColor('lats', selectedMuscle === 'lats')}
                      opacity={getMuscleOpacity('lats', selectedMuscle === 'lats')}
                      stroke={selectedMuscle === 'lats' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'lats' ? 2 : 1}
                      filter={selectedMuscle === 'lats' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 178,126 L 194,118 C 202,128 204,150 202,176 C 198,192 192,206 182,212 L 176,210 C 174,188 174,156 178,126 Z"
                      fill={getMuscleFillColor('lats', selectedMuscle === 'lats')}
                      opacity={getMuscleOpacity('lats', selectedMuscle === 'lats')}
                      stroke={selectedMuscle === 'lats' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'lats' ? 2 : 1}
                      filter={selectedMuscle === 'lats' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* TRICEPS */}
                  <g {...groupProps('triceps')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 94,142 C 88,150 86,166 88,180 C 94,182 100,180 102,174 C 104,164 104,152 100,142 Z"
                      fill={getMuscleFillColor('triceps', selectedMuscle === 'triceps')}
                      opacity={getMuscleOpacity('triceps', selectedMuscle === 'triceps')}
                      stroke={selectedMuscle === 'triceps' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'triceps' ? 2 : 1}
                      filter={selectedMuscle === 'triceps' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 226,142 C 232,150 234,166 232,180 C 226,182 220,180 218,174 C 216,164 216,152 220,142 Z"
                      fill={getMuscleFillColor('triceps', selectedMuscle === 'triceps')}
                      opacity={getMuscleOpacity('triceps', selectedMuscle === 'triceps')}
                      stroke={selectedMuscle === 'triceps' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'triceps' ? 2 : 1}
                      filter={selectedMuscle === 'triceps' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* GLUTES */}
                  <g {...groupProps('glutes')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 124,228 C 120,240 120,260 126,274 C 132,284 146,288 156,284 L 158,236 C 146,230 134,226 124,228 Z"
                      fill={getMuscleFillColor('glutes', selectedMuscle === 'glutes')}
                      opacity={getMuscleOpacity('glutes', selectedMuscle === 'glutes')}
                      stroke={selectedMuscle === 'glutes' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'glutes' ? 2 : 1}
                      filter={selectedMuscle === 'glutes' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 196,228 C 200,240 200,260 194,274 C 188,284 174,288 164,284 L 162,236 C 174,230 186,226 196,228 Z"
                      fill={getMuscleFillColor('glutes', selectedMuscle === 'glutes')}
                      opacity={getMuscleOpacity('glutes', selectedMuscle === 'glutes')}
                      stroke={selectedMuscle === 'glutes' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'glutes' ? 2 : 1}
                      filter={selectedMuscle === 'glutes' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>

                  {/* HAMSTRINGS */}
                  <g {...groupProps('hamstrings')} style={{ cursor: 'pointer' }}>
                    <path
                      d="M 126,286 C 122,306 122,336 124,360 C 128,370 136,372 142,370 C 146,358 148,332 150,300 C 150,290 142,284 126,286 Z"
                      fill={getMuscleFillColor('hamstrings', selectedMuscle === 'hamstrings')}
                      opacity={getMuscleOpacity('hamstrings', selectedMuscle === 'hamstrings')}
                      stroke={selectedMuscle === 'hamstrings' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'hamstrings' ? 2 : 1}
                      filter={selectedMuscle === 'hamstrings' ? 'url(#recoveryGlow)' : undefined}
                    />
                    <path
                      d="M 194,286 C 198,306 198,336 196,360 C 192,370 184,372 178,370 C 174,358 172,332 170,300 C 170,290 178,284 194,286 Z"
                      fill={getMuscleFillColor('hamstrings', selectedMuscle === 'hamstrings')}
                      opacity={getMuscleOpacity('hamstrings', selectedMuscle === 'hamstrings')}
                      stroke={selectedMuscle === 'hamstrings' ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={selectedMuscle === 'hamstrings' ? 2 : 1}
                      filter={selectedMuscle === 'hamstrings' ? 'url(#recoveryGlow)' : undefined}
                    />
                  </g>
                </g>
              )}
            </svg>
          </div>

          <div className="today-muscle-legend" aria-hidden="true">
            <div>
              <i style={{ background: 'var(--accent-lime)' }} />
              <span>{isRTL ? 'جاهز' : 'Ready'}</span>
            </div>
            <div>
              <i style={{ background: 'var(--color-warning)' }} />
              <span>{isRTL ? 'استشفاء جزئي' : 'Recovering'}</span>
            </div>
            <div>
              <i style={{ background: 'var(--color-danger)' }} />
              <span>{isRTL ? 'مجهد' : 'Fatigued'}</span>
            </div>
          </div>
        </div>

        <div className="today-muscle-detail">
          <div className="today-muscle-detail-head">
            <div>
              <span className="today-muscle-detail-eyebrow">{isRTL ? 'العضلة المحددة' : 'Selected muscle'}</span>
              <h4 className="today-muscle-detail-name">{isRTL ? selectedInfo.nameAr : selectedInfo.nameEn}</h4>
            </div>

            <span
              className="forma-badge"
              style={
                selectedTone === 'ready'
                  ? { color: 'var(--accent-lime)', background: 'rgba(190,242,100,0.16)', borderColor: 'rgba(190,242,100,0.34)' }
                  : selectedTone === 'recovering'
                    ? { color: 'var(--color-warning)', background: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.34)' }
                    : { color: 'var(--color-danger)', background: 'rgba(239,68,68,0.16)', borderColor: 'rgba(239,68,68,0.34)' }
              }
            >
              {toneLabel(isRTL, selectedTone)}
            </span>
          </div>

          <div>
            <div className="today-bento-metric-label" style={{ display: 'flex', justifyContent: 'space-between', marginBlockEnd: '0.35rem' }}>
              <span>{isRTL ? 'نسبة الاستشفاء' : 'Recovery level'}</span>
              <span className="tabular-nums" style={{ fontWeight: 800, color: `var(--accent-${selectedTone === 'ready' ? 'lime' : selectedTone === 'recovering' ? 'amber' : 'rose'})` }}>
                {readinessPercent}%
              </span>
            </div>
            <div
              className="today-progress-track"
              role="img"
              aria-label={`${isRTL ? 'نسبة الاستشفاء' : 'Recovery level'} ${readinessPercent}%`}
            >
              <span
                style={{
                  width: `${readinessPercent}%`,
                  background:
                    selectedTone === 'ready'
                      ? 'linear-gradient(90deg, var(--accent-lime), var(--accent-emerald))'
                      : selectedTone === 'recovering'
                        ? 'var(--color-warning)'
                        : 'var(--color-danger)',
                }}
              />
            </div>
          </div>

          <p className="today-muscle-detail-meta">
            <Clock size={14} aria-hidden="true" />
            <span>
              {selectedStatus?.hoursAgo !== null && selectedStatus?.hoursAgo !== undefined
                ? (isRTL ? `آخر تدريب: منذ ${selectedStatus.hoursAgo} ساعة` : `Last trained: ${selectedStatus.hoursAgo}h ago`)
                : (isRTL ? 'لم يتم تدريبها هذا الأسبوع (مرتاحة تماماً)' : 'Not trained recently (fully fresh)')}
            </span>
          </p>

          <button type="button" className="today-muscle-cta" onClick={() => setIsFullModalOpen(true)}>
            <span>{isRTL ? `عرض تمارين ${selectedInfo.nameAr}` : `View exercises for ${selectedInfo.nameEn}`}</span>
            <ChevronRight size={14} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
          </button>
        </div>
      </div>

      <table className="forma-sr-only">
        <caption>{isRTL ? 'نسبة الاستشفاء لكل عضلة' : 'Recovery percentage per muscle group'}</caption>
        <thead>
          <tr>
            <th scope="col">{isRTL ? 'العضلة' : 'Muscle'}</th>
            <th scope="col">{isRTL ? 'الجهة' : 'View'}</th>
            <th scope="col">{isRTL ? 'النسبة' : 'Recovery'}</th>
            <th scope="col">{isRTL ? 'الحالة' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          {recoveryRows.map(row => (
            <tr key={row.key}>
              <th scope="row">{row.name}</th>
              <td>{row.view === 'front' ? (isRTL ? 'أمامية' : 'Front') : (isRTL ? 'خلفية' : 'Back')}</td>
              <td>{row.percent}%</td>
              <td>{toneLabel(isRTL, row.tone)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isFullModalOpen && (
        <InteractiveMuscleMapModal
          isOpen={isFullModalOpen}
          onClose={() => setIsFullModalOpen(false)}
        />
      )}
    </WidgetFrame>
  );
}

