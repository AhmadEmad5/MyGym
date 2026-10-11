import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { FORMA_TOUR_STEPS, type TourStep } from './tour-steps';
import { SpotlightOverlay, type BoundingBox } from './SpotlightOverlay';
import { TourTooltip } from './TourTooltip';
import { useTranslation } from '../../lib/i18n';
import { gymAudio } from '../../lib/audio';

const STORAGE_KEY = 'has_completed_onboarding_v1';

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  hasCompletedOnboarding: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({
  children,
  steps = FORMA_TOUR_STEPS,
}: {
  children: ReactNode;
  steps?: TourStep[];
}) {
  const { isRTL } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetBox, setTargetBox] = useState<BoundingBox | null>(null);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const currentStep = useMemo(
    () => (isActive && steps[currentStepIndex] ? steps[currentStepIndex] : null),
    [isActive, steps, currentStepIndex]
  );

  const markTourCompleted = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch {
      // Ignored
    }
  }, []);

  const finishTour = useCallback(() => {
    gymAudio.triggerSubtleHaptic([30, 60]);
    setIsActive(false);
    markTourCompleted();
  }, [markTourCompleted]);

  const skipTour = useCallback(() => {
    gymAudio.triggerSubtleHaptic([15]);
    setIsActive(false);
    markTourCompleted();
  }, [markTourCompleted]);

  const startTour = useCallback(() => {
    gymAudio.triggerSubtleHaptic([20]);
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(async () => {
    if (!currentStep) return;
    gymAudio.triggerSubtleHaptic([15]);

    if (currentStep.onNextStep) {
      await currentStep.onNextStep();
    }

    if (currentStepIndex >= steps.length - 1) {
      finishTour();
    } else {
      const nextIdx = currentStepIndex + 1;
      const nextStepObj = steps[nextIdx];
      if (nextStepObj?.onBeforeStep) {
        await nextStepObj.onBeforeStep();
      }
      setCurrentStepIndex(nextIdx);
    }
  }, [currentStep, currentStepIndex, finishTour, steps]);

  const prevStep = useCallback(async () => {
    if (currentStepIndex <= 0) return;
    gymAudio.triggerSubtleHaptic([15]);

    const prevIdx = currentStepIndex - 1;
    const prevStepObj = steps[prevIdx];
    if (prevStepObj?.onBeforeStep) {
      await prevStepObj.onBeforeStep();
    }
    setCurrentStepIndex(prevIdx);
  }, [currentStepIndex, steps]);

  // Execute onBeforeStep for step 0 when activated
  useEffect(() => {
    if (isActive && steps[0]?.onBeforeStep) {
      void steps[0].onBeforeStep();
    }
  }, [isActive, steps]);

  // Keyboard navigation: ArrowRight (Next), ArrowLeft (Back), Escape (Exit)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRTL) void prevStep();
        else void nextStep();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isRTL) void nextStep();
        else void prevStep();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isRTL, nextStep, prevStep, skipTour]);

  const contextValue: OnboardingContextType = useMemo(
    () => ({
      isActive,
      currentStepIndex,
      currentStep,
      totalSteps: steps.length,
      hasCompletedOnboarding,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
    }),
    [
      isActive,
      currentStepIndex,
      currentStep,
      steps.length,
      hasCompletedOnboarding,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
    ]
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}

      {/* Render Spotlight & Tooltip directly via Portal when Active */}
      {isActive &&
        currentStep &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <SpotlightOverlay
              targetSelector={currentStep.targetSelector}
              isActive={isActive}
              onTargetMeasured={setTargetBox}
              onClickBackdrop={skipTour}
            />
            <TourTooltip
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={steps.length}
              targetBox={targetBox}
              isRTL={isRTL}
              onNext={() => void nextStep()}
              onPrev={() => void prevStep()}
              onSkip={skipTour}
              onFinish={finishTour}
            />
          </>,
          document.body
        )}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
