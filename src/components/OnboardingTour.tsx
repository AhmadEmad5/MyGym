import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { FORMA_SCREEN_TOUR_STEPS } from './onboarding/tour-steps';
import { SpotlightOverlay, type BoundingBox } from './onboarding/SpotlightOverlay';
import { TourTooltip } from './onboarding/TourTooltip';
import { useTranslation } from '../lib/i18n';
import { useData } from '../hooks/useData';
import { gymAudio } from '../lib/audio';

export interface OnboardingTourProps {
  onFinish: () => void;
}

const STORAGE_KEY = 'has_completed_onboarding_v1';

export function OnboardingTour({ onFinish }: OnboardingTourProps) {
  const { isRTL } = useTranslation();
  const { data, updateSettings } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetBox, setTargetBox] = useState<BoundingBox | null>(null);
  const [isScreenReady, setIsScreenReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalSteps = FORMA_SCREEN_TOUR_STEPS.length;
  const currentStep = FORMA_SCREEN_TOUR_STEPS[currentStepIndex] || FORMA_SCREEN_TOUR_STEPS[0];

  // Screen transition: Navigate first, wait for the screen to render, then highlight
  useEffect(() => {
    setIsScreenReady(false);
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
    // Give 300ms for route transition to mount the page
    const timer = setTimeout(() => {
      setIsScreenReady(true);
    }, 320);

    return () => clearTimeout(timer);
  }, [currentStep.route, location.pathname, navigate]);

  const handleFinish = useCallback(async () => {
    gymAudio.triggerSubtleHaptic([30, 60]);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      const email = data?.user?.email;
      if (email) {
        localStorage.setItem(`forma_onboarding_complete_${email}`, 'true');
        localStorage.setItem(`mygym_onboarding_complete_${email}`, 'true');
      }
      localStorage.setItem('forma_onboarding_completed_at', new Date().toISOString());
    } catch {
      // Ignored
    }

    if (data?.settings) {
      try {
        await updateSettings(data.settings);
      } catch {
        // Ignored
      }
    }

    // Return back to Today view upon completion
    if (location.pathname !== '/today') {
      navigate('/today');
    }

    onFinish();
  }, [data?.settings, data?.user?.email, location.pathname, navigate, onFinish, updateSettings]);

  const handleSkip = useCallback(() => {
    gymAudio.triggerSubtleHaptic([15]);
    void handleFinish();
  }, [handleFinish]);

  const handleNext = useCallback(async () => {
    gymAudio.triggerSubtleHaptic([15]);

    if (currentStepIndex >= totalSteps - 1) {
      void handleFinish();
    } else {
      setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }
  }, [currentStepIndex, handleFinish, totalSteps]);

  const handlePrev = useCallback(async () => {
    if (currentStepIndex <= 0) return;
    gymAudio.triggerSubtleHaptic([15]);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, [currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRTL) void handlePrev();
        else void handleNext();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isRTL) void handleNext();
        else void handlePrev();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSkip, isRTL]);

  if (!mounted || typeof document === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(
    <>
      <SpotlightOverlay
        targetSelector={currentStep.targetSelector}
        isActive={isScreenReady}
        onTargetMeasured={setTargetBox}
        onClickBackdrop={handleSkip}
      />
      {isScreenReady && (
        <TourTooltip
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          targetBox={targetBox}
          isRTL={isRTL}
          onNext={() => void handleNext()}
          onPrev={() => void handlePrev()}
          onSkip={handleSkip}
          onFinish={() => void handleFinish()}
        />
      )}
    </>,
    document.body
  );
}

export default OnboardingTour;
