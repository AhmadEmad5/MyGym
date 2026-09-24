import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  CalendarDays, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Trophy
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface OnboardingTourProps {
  onFinish: () => void;
}

export function OnboardingTour({ onFinish }: OnboardingTourProps) {
  const { t, isRTL } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('welcomeTourTitle'),
      subtitle: t('welcomeTourSubtitle'),
      description: t('welcomeTourDesc'),
      icon: Dumbbell,
      badge: `${t('stepOf')} 1 ${t('of')} 4`
    },
    {
      title: t('todayTourTitle'),
      subtitle: t('todayTourSubtitle'),
      description: t('todayTourDesc'),
      icon: CheckCircle2,
      badge: `${t('stepOf')} 2 ${t('of')} 4`
    },
    {
      title: t('calendarTourTitle'),
      subtitle: t('calendarTourSubtitle'),
      description: t('calendarTourDesc'),
      icon: CalendarDays,
      badge: `${t('stepOf')} 3 ${t('of')} 4`
    },
    {
      title: t('aiTourTitle'),
      subtitle: t('aiTourSubtitle'),
      description: t('aiTourDesc'),
      icon: Sparkles,
      badge: `${t('stepOf')} 4 ${t('of')} 4`
    }
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          textAlign: isRTL ? 'right' : 'left'
        }}
      >
        {/* Top Glow & Skip */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent-primary, #38bdf8), transparent)',
            opacity: 0.8
          }} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem 0.5rem 1.5rem' }}>
          <span 
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent-primary, #38bdf8)',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '0.25rem 0.65rem',
              borderRadius: '2rem',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            {step.badge}
          </span>
          <button
            type="button"
            onClick={onFinish}
            className="btn-icon btn-ghost"
            style={{
              padding: '0.4rem',
              borderRadius: '50%',
              color: 'var(--text-muted, #94a3b8)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={t('skip')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem 2rem 2rem 2rem', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
            >
              {/* Icon Container */}
              <div 
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.15))',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary, #38bdf8)',
                  marginBottom: '1.5rem',
                  boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.25)'
                }}
              >
                <Icon className="w-9 h-9" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: '#f8fafc', textAlign: 'center' }}>
                {step.title}
              </h2>

              <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary, #38bdf8)', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
                {step.subtitle}
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.925rem', lineHeight: '1.6', margin: 0, maxWidth: '420px', textAlign: 'center' }}>
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div 
          style={{
            padding: '1.25rem 2rem',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          {/* Step Dots */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentStep ? 'var(--accent-primary, #38bdf8)' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn btn-secondary"
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ArrowLeft className="w-4 h-4" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                <span>{t('back')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{
                padding: '0.6rem 1.4rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
              }}
            >
              {isLast ? (
                <>
                  <span>{t('getStarted')}</span>
                  <Trophy className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t('next')}</span>
                  <ArrowRight className="w-4 h-4" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
