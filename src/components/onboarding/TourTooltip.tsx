import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Dumbbell,
  Flame,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import type { TourStep, ScreenFeatureItem } from './tour-steps';
import type { BoundingBox } from './SpotlightOverlay';

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetBox: BoundingBox | null;
  isRTL: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

function FeatureIcon({ name }: { name: ScreenFeatureItem['iconName'] }) {
  const iconProps = { className: 'w-4 h-4 flex-shrink-0', 'aria-hidden': 'true' as const };
  switch (name) {
    case 'dumbbell':
      return <Dumbbell {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'activity':
      return <Activity {...iconProps} />;
    case 'flame':
      return <Flame {...iconProps} />;
    case 'camera':
      return <Camera {...iconProps} />;
    case 'scale':
      return <Scale {...iconProps} />;
    case 'shield':
      return <ShieldCheck {...iconProps} />;
    case 'target':
      return <Target {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'sparkles':
    default:
      return <Sparkles {...iconProps} />;
  }
}

export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  targetBox,
  isRTL,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: TourTooltipProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute collision-aware desktop positioning
  const desktopCoordinates = useMemo(() => {
    if (isMobile || !targetBox) return null;

    const cardWidth = 440;
    const estimatedHeight = 360;
    const gap = 16;
    const viewportPad = 24;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const spaceBelow = screenH - (targetBox.y + targetBox.height);
    const spaceAbove = targetBox.y;

    let top = 0;
    let left = targetBox.x + targetBox.width / 2 - cardWidth / 2;

    if (spaceBelow >= estimatedHeight + gap || spaceBelow >= spaceAbove) {
      top = Math.min(screenH - estimatedHeight - viewportPad, targetBox.y + targetBox.height + gap);
    } else {
      top = Math.max(viewportPad, targetBox.y - estimatedHeight - gap);
    }

    left = Math.max(viewportPad, Math.min(screenW - cardWidth - viewportPad, left));

    return { top, left, width: cardWidth };
  }, [isMobile, targetBox]);

  const activeBadge = isRTL ? step.screenBadgeAr : step.screenBadgeEn;
  const activeTitle = isRTL ? step.titleAr : step.titleEn;
  const activeDesc = isRTL ? step.descriptionAr : step.descriptionEn;

  return (
    <div
      ref={cardRef}
      className={`fixed transition-all duration-300 ease-out z-[10000] ${
        isMobile ? 'left-3 right-3 bottom-5 max-w-lg mx-auto' : ''
      }`}
      style={
        isMobile
          ? {
              paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            }
          : desktopCoordinates
          ? {
              top: `${desktopCoordinates.top}px`,
              left: `${desktopCoordinates.left}px`,
              width: `${desktopCoordinates.width}px`,
            }
          : {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '440px',
              maxWidth: 'calc(100vw - 32px)',
            }
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-tooltip-title"
      aria-describedby="tour-tooltip-desc"
    >
      {/* High-End Dark Glassmorphism Container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-zinc-950/94 backdrop-blur-xl shadow-2xl p-5 text-white max-h-[82vh] flex flex-col">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-25 pointer-events-none blur-3xl"
          style={{
            background: `radial-gradient(circle, ${step.accentColor} 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 mb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border"
              style={{
                color: step.accentColor,
                borderColor: `${step.accentColor}40`,
                backgroundColor: `${step.accentColor}15`,
              }}
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {activeBadge}
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            aria-label={isRTL ? 'إغلاق وتخطي الجولة' : 'Close and skip tour'}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto overscroll-contain pr-1 flex-1 mb-4 space-y-3">
          {/* Main Screen Title & Purpose */}
          <div>
            <h3
              id="tour-tooltip-title"
              className="text-base sm:text-lg font-extrabold text-white tracking-tight mb-1 leading-snug"
            >
              {activeTitle}
            </h3>
            <p
              id="tour-tooltip-desc"
              className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal"
            >
              {activeDesc}
            </p>
          </div>

          {/* Structured Contents & Features in this Screen ("محتويات الشاشة") */}
          <div className="rounded-xl border border-white/8 bg-white/4 p-2.5 sm:p-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {isRTL ? 'محتويات وقدرات هذه الشاشة:' : 'Key Screen Features & Capabilities:'}
            </div>

            <div className="space-y-1.5">
              {step.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-1.5 rounded-lg bg-white/2 hover:bg-white/4 transition-colors"
                >
                  <div
                    className="p-1 rounded-md flex-shrink-0 mt-0.5"
                    style={{
                      color: step.accentColor,
                      backgroundColor: `${step.accentColor}18`,
                    }}
                  >
                    <FeatureIcon name={feat.iconName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-100 leading-tight">
                      {isRTL ? feat.titleAr : feat.titleEn}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                      {isRTL ? feat.descAr : feat.descEn}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Progress Segmented Bar */}
        <div className="flex items-center gap-1.5 mb-4 flex-shrink-0" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === stepIndex
                  ? 'flex-1 shadow-md'
                  : idx < stepIndex
                  ? 'w-4 bg-zinc-600'
                  : 'w-4 bg-zinc-800'
              }`}
              style={
                idx === stepIndex
                  ? {
                      backgroundColor: step.accentColor,
                      boxShadow: `0 0 10px ${step.accentColor}80`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/8 flex-shrink-0">
          <div>
            {!isLast && (
              <button
                type="button"
                onClick={onSkip}
                className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                {isRTL ? 'تخطي' : 'Skip'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold text-zinc-200 bg-white/6 hover:bg-white/12 active:scale-[0.97] transition-all border border-white/10 flex items-center gap-1.5"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRTL ? 'الشاشة السابقة' : 'Previous Screen'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={isLast ? onFinish : onNext}
              className="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl text-xs font-bold text-white active:scale-[0.97] shadow-lg transition-all flex items-center gap-1.5"
              style={{
                background: isLast
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: isLast
                  ? '0 4px 16px rgba(16, 185, 129, 0.35)'
                  : '0 4px 16px rgba(2, 132, 199, 0.35)',
              }}
            >
              <span>
                {isLast
                  ? isRTL
                    ? 'ابدأ التمرين الآن'
                    : 'Start Training'
                  : isRTL
                  ? 'الشاشة التالية'
                  : 'Next Screen'}
              </span>
              {isLast ? (
                <Check className="w-4 h-4" />
              ) : isRTL ? (
                <ArrowLeft className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
