import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Upload, Sparkles, Check, RefreshCw, AlertCircle, ChefHat,
  Loader2, ShieldAlert, WifiOff, ImageOff, Crop, ShieldCheck, Keyboard, ArrowRight
} from 'lucide-react';
import { generateGeminiJson } from '../lib/gemini';
import { MealRecord, MealType } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { validateClientFile, MAX_IMAGE_UPLOAD_BYTES, ALLOWED_IMAGE_MIME_TYPES } from '../lib/fileValidation';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
  );
}

export function useModalA11y(isOpen: boolean, onClose: () => void, options?: { initialFocus?: 'first' | 'none' }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const initialFocus = options?.initialFocus ?? 'first';
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = (document.activeElement as HTMLElement) ?? null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    const focusFrame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const [first] = getFocusable(panel);
      (first ?? panel).focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = getFocusable(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('modal-open');
      const trigger = triggerRef.current;
      triggerRef.current = null;
      if (trigger && document.body.contains(trigger)) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return { panelRef, shouldAutoFocus: initialFocus === 'first' };
}

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  maxWidth?: number;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  initialFocus?: 'first' | 'none';
  headerAccessory?: ReactNode;
  backdropContent?: ReactNode;
}

export function ModalShell({
  isOpen,
  onClose,
  titleId,
  title,
  subtitle,
  icon,
  accent = '#10b981',
  maxWidth = 560,
  children,
  footer,
  closeLabel,
  initialFocus = 'first',
  headerAccessory,
  backdropContent
}: ModalShellProps) {
  const { isRTL } = useTranslation();
  const { panelRef } = useModalA11y(isOpen, onClose, { initialFocus });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="portal-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            backgroundColor: 'rgba(3, 7, 18, 0.84)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
          onClick={onClose}
        >
          {backdropContent}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={event => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth,
              maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 20px)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '22px',
              border: `1px solid ${accent}44`,
              boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -22px ${accent}66`,
              overflow: 'hidden',
              outline: 'none'
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                {icon && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '12px',
                      background: `${accent}22`,
                      border: `1px solid ${accent}55`,
                      color: accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {icon}
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <h2 id={titleId} style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {title}
                  </h2>
                  {subtitle && (
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                {headerAccessory}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel ?? (isRTL ? 'Ø¥ØºÙ„Ø§Ù‚' : 'Close dialog')}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem'
              }}
            >
              {children}
            </div>

            {footer && (
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  paddingBottom: 'calc(0.85rem + env(safe-area-inset-bottom, 0px))',
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  gap: '0.6rem',
                  flexShrink: 0
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export interface InlineNumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  accent?: string;
  inputMode?: 'numeric' | 'decimal';
  max?: number;
  min?: number;
  describedBy?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  enterHint?: 'next' | 'done' | 'go';
  onEnter?: () => void;
  wide?: boolean;
  dir?: 'ltr' | 'rtl';
}

export function InlineNumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  accent = 'var(--text-primary)',
  inputMode = 'numeric',
  max = 9999,
  min = 0,
  describedBy,
  invalid,
  autoFocus,
  enterHint = 'next',
  onEnter,
  wide,
  dir
}: InlineNumberFieldProps) {
  return (
    <div style={{ minWidth: 0, flex: wide ? '1 1 100%' : '1 1 0' }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: accent, marginBottom: '0.25rem', textAlign: 'center' }}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        dir={dir}
        inputMode={inputMode}
        enterKeyHint={enterHint}
        pattern={inputMode === 'decimal' ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={event => {
          const raw = event.target.value.replace(/[^0-9.,]/g, '');
          const normalised = raw.replace(',', '.');
          if (normalised === '') {
            onChange('');
            return;
          }
          const parsed = Number(normalised);
          if (Number.isNaN(parsed)) return;
          onChange(String(Math.min(max, Math.max(min, parsed))));
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onEnter?.();
          }
        }}
        style={{
          width: '100%',
          minWidth: 0,
          fontSize: '1.05rem',
          fontWeight: 800,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          color: invalid ? '#f87171' : 'var(--text-primary)',
          background: 'var(--bg-tertiary)',
          border: `1px solid ${invalid ? '#f87171' : 'var(--border-color)'}`,
          borderRadius: '11px',
          padding: '0.6rem 0.35rem',
          outline: 'none',
          boxSizing: 'border-box',
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />
      {suffix && (
        <span style={{ display: 'block', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

export function UnitToggle<T extends string>({ label, options, value, onChange, id, size = 'sm' }: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  id: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span id={id} style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} style={{ display: 'inline-flex', gap: '2px', padding: '2px', borderRadius: '999px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        {options.map(option => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              style={{
                padding: size === 'sm' ? '0.22rem 0.55rem' : '0.35rem 0.8rem',
                borderRadius: '999px',
                border: 'none',
                background: active ? '#10b981' : 'transparent',
                color: active ? '#041316' : 'var(--text-muted)',
                fontSize: size === 'sm' ? '0.68rem' : '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: size === 'sm' ? 26 : 32
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
      <span aria-hidden="true">âš </span>
      <span>{message}</span>
    </p>
  );
}

export interface StatusCalloutProps {
  tone: 'error' | 'info' | 'success' | 'warning';
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  id?: string;
}

const TONE_STYLES: Record<StatusCalloutProps['tone'], { bg: string; border: string; color: string }> = {
  error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(248, 113, 113, 0.45)', color: '#f87171' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.45)', color: '#fbbf24' },
  info: { bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' },
  success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }
};

export function StatusCallout({ tone, title, children, action, icon, id }: StatusCalloutProps) {
  const palette = TONE_STYLES[tone];
  return (
    <div
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        padding: '0.75rem 0.9rem',
        borderRadius: '13px',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: '0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      {(title || icon) && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          {icon}
          <span>{title}</span>
        </span>
      )}
      <span style={{ color: 'var(--text-primary)', lineHeight: 1.45 }}>{children}</span>
      {action && <span style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{action}</span>}
    </div>
  );
}

export function PrimaryAction({
  children,
  onClick,
  type = 'button',
  form,
  disabled,
  loading,
  accent = 'linear-gradient(135deg, #10b981, #06b6d4)',
  fullWidth,
  icon
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  form?: string;
  disabled?: boolean;
  loading?: boolean;
  accent?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        flex: fullWidth ? '1 1 100%' : undefined,
        width: fullWidth ? '100%' : undefined,
        padding: '0.8rem 1.1rem',
        borderRadius: '13px',
        background: accent,
        color: '#041316',
        border: 'none',
        fontSize: '0.92rem',
        fontWeight: 850,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        minHeight: 46,
        boxShadow: disabled ? 'none' : '0 6px 20px -6px rgba(16, 185, 129, 0.5)'
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryAction({
  children,
  onClick,
  type = 'button',
  form,
  disabled,
  fullWidth,
  icon
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  form?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: fullWidth ? '1 1 100%' : undefined,
        width: fullWidth ? '100%' : undefined,
        padding: '0.7rem 1rem',
        borderRadius: '13px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        fontSize: '0.86rem',
        fontWeight: 750,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        minHeight: 44
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export type MassUnit = 'g' | 'oz';
export type EnergyUnit = 'kcal' | 'kJ';

export const GRAMS_PER_OUNCE = 28.349523125;
export const KJ_PER_KCAL = 4.184;

export function massToGrams(value: number, unit: MassUnit) {
  return unit === 'g' ? value : value * GRAMS_PER_OUNCE;
}

export function gramsToMass(grams: number, unit: MassUnit) {
  return unit === 'g' ? grams : grams / GRAMS_PER_OUNCE;
}

export function energyToKcal(value: number, unit: EnergyUnit) {
  return unit === 'kcal' ? value : value / KJ_PER_KCAL;
}

export function kcalToEnergy(kcal: number, unit: EnergyUnit) {
  return unit === 'kcal' ? kcal : kcal * KJ_PER_KCAL;
}

interface AIMealVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealRecord, 'id'>) => void;
  onManualEntry?: () => void;
}

const MEAL_TYPES: { type: MealType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'breakfast', labelKey: 'breakfast', icon: 'ðŸ³' },
  { type: 'lunch', labelKey: 'lunch', icon: 'ðŸ¥—' },
  { type: 'dinner', labelKey: 'dinner', icon: 'ðŸ¥©' },
  { type: 'snack', labelKey: 'snack', icon: 'ðŸŽ' }
];

type Stage = 'intro' | 'preview' | 'scanning' | 'review';
type CameraState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'busy';
type ScanPhase = 'reading' | 'optimising' | 'encoding' | 'uploading' | 'analysing' | 'done';
type FailureKind = 'permission' | 'no-camera' | 'too-large' | 'network' | 'malformed' | 'decode' | null;

const PHASE_WEIGHTS: Record<ScanPhase, number> = {
  reading: 8,
  optimising: 22,
  encoding: 34,
  uploading: 52,
  analysing: 92,
  done: 100
};

const PHASE_LABELS: Record<ScanPhase, { en: string; ar: string }> = {
  reading: { en: 'Reading photo', ar: 'Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØµÙˆØ±Ø©' },
  optimising: { en: 'Resizing for fast upload', ar: 'ØªØµØºÙŠØ± Ø§Ù„ØµÙˆØ±Ø© Ù„Ø±ÙØ¹ Ø£Ø³Ø±Ø¹' },
  encoding: { en: 'Compressing', ar: 'Ø¶ØºØ· Ø§Ù„ØµÙˆØ±Ø©' },
  uploading: { en: 'Uploading to Gemini', ar: 'Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø© Ø¥Ù„Ù‰ Gemini' },
  analysing: { en: 'Identifying foods & macros', ar: 'ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø£Ø·Ø¹Ù…Ø© ÙˆØ§Ù„Ù…Ø§ÙƒØ±ÙˆØ²' },
  done: { en: 'Ready', ar: 'Ø¬Ø§Ù‡Ø²' }
};

interface CapturedPhoto {
  dataUrl: string;
  originalBytes: number;
  payloadBytes: number;
  source: 'camera' | 'upload';
}

export function AIMealVisionModal({ isOpen, onClose, onSaveMeal, onManualEntry }: AIMealVisionModalProps) {
  const { t, isRTL } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef(false);

  const [stage, setStage] = useState<Stage>('intro');
  const [cameraState, setCameraState] = useState<CameraState>('unknown');
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [failure, setFailure] = useState<FailureKind>(null);
  const [failureDetail, setFailureDetail] = useState<string | null>(null);
  const [oversizeBytes, setOversizeBytes] = useState<number | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('reading');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [mealType, setMealType] = useState<MealType>('lunch');

  const [dishTitle, setDishTitle] = useState('');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fats, setFats] = useState('0');
  const [ingredients, setIngredients] = useState<{ name: string; portion?: string; calories?: number }[]>([]);
  const [healthScore, setHealthScore] = useState<number | undefined>(undefined);
  const [aiNotes, setAiNotes] = useState('');
  const [needsCorrection, setNeedsCorrection] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; calories?: string; macros?: string }>({});

  const [massUnit, setMassUnit] = useState<MassUnit>('g');
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>('kcal');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    stopTimer();
    abortRef.current = false;
    setStage('intro');
    setCameraState('unknown');
    setPhoto(null);
    setFailure(null);
    setFailureDetail(null);
    setPhase('reading');
    setElapsedMs(0);
    setDishTitle('');
    setCalories('0');
    setProtein('0');
    setCarbs('0');
    setFats('0');
    setIngredients([]);
    setHealthScore(undefined);
    setAiNotes('');
    setNeedsCorrection(false);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [stopCamera, stopTimer]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => () => {
    stopCamera();
    stopTimer();
  }, [stopCamera, stopTimer]);

  const startTimer = useCallback(() => {
    const startedAt = performance.now();
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);
  }, [stopTimer]);

  const requestCamera = useCallback(async () => {
    if (cameraState === 'requesting' || cameraState === 'busy') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      setFailure('no-camera');
      return;
    }
    setCameraState('requesting');
    setFailure(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraState('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraState('denied');
        setFailure('permission');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setCameraState('unavailable');
        setFailure('no-camera');
      } else if (name === 'NotReadableError') {
        setCameraState('busy');
        setFailure('no-camera');
      } else {
        setCameraState('unknown');
        setFailure('no-camera');
      }
    }
  }, [cameraState]);

  const captureFromStream = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setFailure('decode');
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const payloadBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
    stopCamera();
    setCameraState('unknown');
    setPhoto({ dataUrl, originalBytes: payloadBytes, payloadBytes, source: 'camera' });
    setStage('preview');
  }, [stopCamera]);

  const runScan = useCallback(async (captured: CapturedPhoto) => {
    abortRef.current = false;
    setStage('scanning');
    setFailure(null);
    setFailureDetail(null);
    setPhase('reading');
    setElapsedMs(0);
    startTimer();

    try {
      const parts = captured.dataUrl.split(',');
      const base64Data = parts[1] || '';
      const mimeMatch = parts[0]?.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      setPhase('optimising');
      await new Promise(resolve => window.setTimeout(resolve, 120));
      if (abortRef.current) return;

      setPhase('encoding');
      await new Promise(resolve => window.setTimeout(resolve, 120));
      if (abortRef.current) return;

      setPhase('uploading');

      const prompt = `You are a certified sports nutritionist, dietitian, and computer vision meal analyst.
Analyze the meal shown in this photo with high precision for an athletic trainee.
Please estimate:
1. Dish Title: in Arabic (or English if international), concise & appetizing.
2. Estimated Total Calories (kcal, integer).
3. Macronutrients in grams:
   - protein (integer)
   - carbs (integer)
   - fats (integer)
4. List of detected ingredients with portion and calorie estimates.
5. Overall health & recovery score (1-10).
6. Brief 1-2 sentence fitness advice for muscle building/recovery.

Respond ONLY with valid JSON with NO markdown fences:
{
  "title": "Ø·Ø¨Ù‚ Ø£Ø±Ø² Ø¨Ø³Ù…ØªÙŠ Ù…Ø¹ ØµØ¯ÙˆØ± Ø¯Ø¬Ø§Ø¬ Ù…Ø´ÙˆÙŠØ© ÙˆØ³Ù„Ø·Ø©",
  "calories": 540,
  "protein": 42,
  "carbs": 58,
  "fats": 12,
  "ingredients": [
    {"name": "ØµØ¯Ø± Ø¯Ø¬Ø§Ø¬ Ù…Ø´ÙˆÙŠ", "portion": "150g", "calories": 250},
    {"name": "Ø£Ø±Ø² Ø¨Ø³Ù…ØªÙŠ Ù…Ø·Ø¨ÙˆØ®", "portion": "200g", "calories": 240},
    {"name": "Ø³Ù„Ø·Ø© Ø®Ø¶Ø±Ø§Ø¡ ÙˆØ²ÙŠØª Ø²ÙŠØªÙˆÙ†", "portion": "100g", "calories": 50}
  ],
  "healthScore": 9,
  "aiNotes": "ÙˆØ¬Ø¨Ø© Ù…Ø«Ø§Ù„ÙŠØ© Ø¨Ø¹Ø¯ Ø§Ù„ØªÙ…Ø±ÙŠÙ†ØŒ ØºÙ†ÙŠØ© Ø¨Ø§Ù„Ø¨Ø±ÙˆØªÙŠÙ† Ø§Ù„ØµØ§ÙÙŠ ÙˆØ§Ù„ÙƒØ§Ø±Ø¨ÙˆÙ‡ÙŠØ¯Ø±Ø§Øª Ø§Ù„Ù…Ø¹Ù‚Ø¯Ø© Ù„Ø¥Ø¹Ø§Ø¯Ø© Ù…Ù„Ø¡ Ù…Ø®Ø§Ø²Ù† Ø§Ù„Ø¬Ù„ÙŠÙƒÙˆØ¬ÙŠÙ† ÙˆØªØ³Ø±ÙŠØ¹ Ø§Ù„Ø§Ø³ØªØ´ÙØ§Ø¡."
}`;

      const parsed = await generateGeminiJson<Record<string, unknown>>({ prompt, imageBase64: base64Data, mimeType });

      setPhase('analysing');
      await new Promise(resolve => window.setTimeout(resolve, 200));
      if (abortRef.current) return;

      const rawTitle = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const num = (value: unknown) => {
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
      };
      const cal = num(parsed.calories);
      const pro = num(parsed.protein);
      const carb = num(parsed.carbs);
      const fat = num(parsed.fats);
      const hasNumericMacros = cal > 0 || pro > 0 || carb > 0 || fat > 0;
      const malformed = !rawTitle || !hasNumericMacros;

      setDishTitle(rawTitle);
      setCalories(String(cal));
      setProtein(String(pro));
      setCarbs(String(carb));
      setFats(String(fat));
      setIngredients(Array.isArray(parsed.ingredients) ? (parsed.ingredients as { name: string; portion?: string; calories?: number }[]) : []);
      setHealthScore(typeof parsed.healthScore === 'number' ? parsed.healthScore : undefined);
      setAiNotes(typeof parsed.aiNotes === 'string' ? parsed.aiNotes : '');
      setNeedsCorrection(malformed);
      setFieldErrors(malformed ? { title: isRTL ? 'Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„ÙˆØ¬Ø¨Ø©' : 'Add a meal name', macros: isRTL ? 'Ø£ÙƒÙ…Ù„ Ø§Ù„Ù…Ø§ÙƒØ±ÙˆØ²' : 'Fill in the macros' } : {});
      setPhase('done');
      stopTimer();
      setStage('review');

      if (!malformed) {
        gymAudio.playRestTimerChime();
        gymAudio.triggerSubtleHaptic([30, 40, 30]);
      } else {
        gymAudio.triggerSubtleHaptic([40, 60, 40]);
      }
    } catch (err) {
      stopTimer();
      const message = (err as { message?: string })?.message || '';
      const isNetwork = /network|fetch|failed to fetch|timeout|offline|quota|rate|429|5\d\d/i.test(message);
      setFailure(isNetwork ? 'network' : 'malformed');
      setFailureDetail(message || null);
      setNeedsCorrection(isNetwork);
      setStage('preview');
    }
  }, [isRTL, startTimer, stopTimer]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateClientFile(file, {
      maxSizeBytes: MAX_IMAGE_UPLOAD_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES
    });

    if (!validation.valid) {
      setFailure(file.size > MAX_IMAGE_UPLOAD_BYTES ? 'too-large' : 'decode');
      setFailureDetail(validation.error ?? null);
      setOversizeBytes(file.size > MAX_IMAGE_UPLOAD_BYTES ? file.size : null);
      event.target.value = '';
      return;
    }

    setFailure(null);
    setFailureDetail(null);
    setOversizeBytes(null);
    setPhase('reading');
    setStage('scanning');
    startTimer();

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setPhase('optimising');

      const maxDim = 800;
      let width = img.width;
      let height = img.height;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        stopTimer();
        setFailure('decode');
        setStage('intro');
        return;
      }

      window.setTimeout(() => {
        ctx.drawImage(img, 0, 0, width, height);
        setPhase('encoding');
        window.setTimeout(() => {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          const payloadBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
          const captured: CapturedPhoto = { dataUrl, originalBytes: file.size, payloadBytes, source: 'upload' };
          setPhoto(captured);
          void runScan(captured);
        }, 90);
      }, 90);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      stopTimer();
      setFailure('decode');
      setStage('intro');
    };

    img.src = objectUrl;
    event.target.value = '';
  };

  const validateReview = () => {
    const next: { title?: string; calories?: string; macros?: string } = {};
    if (!dishTitle.trim()) next.title = isRTL ? 'Ø§Ø³Ù… Ø§Ù„ÙˆØ¬Ø¨Ø© Ù…Ø·Ù„ÙˆØ¨' : 'Meal name is required';
    const cal = Number(calories);
    if (!Number.isFinite(cal) || cal < 0) next.calories = isRTL ? 'Ø£Ø¯Ø®Ù„ Ø³Ø¹Ø±Ø§Øª ØµØ­ÙŠØ­Ø©' : 'Enter valid calories';
    const macroValues = [protein, carbs, fats].map(v => Number(v));
    if (macroValues.some(v => !Number.isFinite(v) || v < 0)) next.macros = isRTL ? 'Ù‚ÙŠÙ… Ø§Ù„Ù…Ø§ÙƒØ±ÙˆØ² ØºÙŠØ± ØµØ§Ù„Ø­Ø©' : 'Invalid macro values';
    if (macroValues.every(v => v === 0) && !(cal > 0)) {
      next.macros = isRTL ? 'Ø£Ø¯Ø®Ù„ Ø§Ù„Ø³Ø¹Ø±Ø§Øª Ø£Ùˆ Ø§Ù„Ù…Ø§ÙƒØ±ÙˆØ²' : 'Enter calories or macros';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveAndAdd = () => {
    if (!validateReview()) return;
    onSaveMeal({
      title: dishTitle.trim(),
      date: new Date().toISOString(),
      mealType,
      calories: Math.max(0, Math.round(Number(calories) || 0)),
      protein: Math.max(0, Math.round(Number(protein) || 0)),
      carbs: Math.max(0, Math.round(Number(carbs) || 0)),
      fats: Math.max(0, Math.round(Number(fats) || 0)),
      ingredients,
      healthScore,
      aiNotes,
      imageUrl: photo?.dataUrl
    });
    gymAudio.playCelebrationFanfare();
    gymAudio.triggerSubtleHaptic([50, 70, 50]);
    onClose();
  };

  const progressPercent = useMemo(() => {
    if (stage !== 'scanning') return stage === 'review' ? 100 : 0;
    return PHASE_WEIGHTS[phase];
  }, [stage, phase]);

  const derivedKcal = Math.round((Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fats) || 0) * 9);
  const enteredKcal = Math.round(Number(calories) || 0);

  const permissionState = useMemo(() => {
    if (failure === 'permission') {
      return {
        tone: 'error' as const,
        icon: <ShieldAlert size={15} />,
        title: isRTL ? 'Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§ Ù…Ø±ÙÙˆØ¶Ø©' : 'Camera access denied',
        body: isRTL
          ? 'ÙØ¹Ù‘Ù„ Ø¥Ø°Ù† Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§ Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØªØµÙØ­ØŒ Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©. ÙŠÙ…ÙƒÙ†Ùƒ Ø£ÙŠØ¶Ø§Ù‹ Ø±ÙØ¹ ØµÙˆØ±Ø© Ù…Ù† Ø§Ù„Ù…Ø¹Ø±Ø¶.'
          : 'Enable the camera permission for this site in your browser settings, then try again â€” or pick a photo from your library instead.'
      };
    }
    if (failure === 'no-camera') {
      return {
        tone: 'error' as const,
        icon: <ImageOff size={15} />,
        title: isRTL ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ ÙƒØ§Ù…ÙŠØ±Ø§ Ù…ØªØ§Ø­Ø©' : 'No camera available',
        body: isRTL
          ? 'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ÙƒØ§Ù…ÙŠØ±Ø§ Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²ØŒ Ø£Ùˆ Ø£Ù†Ù‡Ø§ Ù…Ø³ØªØ®Ø¯Ù…Ø© Ù…Ù† ØªØ·Ø¨ÙŠÙ‚ Ø¢Ø®Ø±. Ø§Ø±ÙØ¹ ØµÙˆØ±Ø© Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø°Ù„Ùƒ.'
          : 'No camera was found on this device, or it is busy in another app. Upload a photo instead to keep going.'
      };
    }
    if (failure === 'too-large') {
      const limitMb = (MAX_IMAGE_UPLOAD_BYTES / 1048576).toFixed(0);
      const actual = oversizeBytes
        ? isRTL
          ? ` (${(oversizeBytes / 1048576).toFixed(1)} ميغابايت)`
          : ` (${(oversizeBytes / 1048576).toFixed(1)} MB)`
        : '';
      return {
        tone: 'error' as const,
        icon: <ImageOff size={15} />,
        title: isRTL ? 'الصورة أكبر من الحد المسموح' : 'Photo is too large',
        body: isRTL
          ? `الحد الأقصى ${limitMb} ميغابايت${actual}. صغّر الصورة أو التقط لقطة جديدة بمقاس أصغر.`
          : `This photo is ${(oversizeBytes ? (oversizeBytes / 1048576).toFixed(1) : '?')} MB and the limit is ${limitMb} MB. Crop it, or retake it at a smaller size.`
      };
    }
    if (failure === 'network') {
      return {
        tone: 'error' as const,
        icon: <WifiOff size={15} />,
        title: isRTL ? 'ØªØ¹Ø°Ù‘Ø± Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ' : 'Could not reach the AI service',
        body: isRTL
          ? 'ØªØ­Ù‚Ù‚ Ù…Ù† Ø§ØªØµØ§Ù„Ùƒ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©. ØµÙˆØ±ØªÙƒ Ù…Ø­ÙÙˆØ¸Ø©ØŒ ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø³Ø­ Ø¨Ù†Ù‚Ø±Ø©.'
          : 'Check your connection and try again. Your photo is kept â€” just rescan it.'
      };
    }
    if (failure === 'decode') {
      return {
        tone: 'error' as const,
        icon: <ImageOff size={15} />,
        title: isRTL ? 'ØªØ¹Ø°Ù‘Ø±Øª Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØµÙˆØ±Ø©' : 'Could not read that image',
        body: isRTL
          ? 'Ø§Ù„Ù…Ù„Ù Ù‚Ø¯ ÙŠÙƒÙˆÙ† ØªØ§Ù„ÙØ§Ù‹ Ø£Ùˆ Ø¨ØµÙŠØºØ© ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø© (JPG Ø£Ùˆ PNG Ø£Ùˆ WebP Ø£Ùˆ HEIC).'
          : 'The file may be corrupted or in an unsupported format (JPG, PNG, WebP or HEIC).'
      };
    }
    return null;
  }, [failure, isRTL, oversizeBytes]);

  const phaseLabel = PHASE_LABELS[phase];
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1);

  return (
    <>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />

      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        titleId="ai-meal-vision-title"
        title={isRTL ? 'Ù…Ø§Ø³Ø­ Ø§Ù„ÙˆØ¬Ø¨Ø§Øª Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ' : 'AI Meal Vision Scanner'}
        subtitle={isRTL ? 'Ø§Ù„ØªÙ‚Ø· ØµÙˆØ±Ø© Ù„Ø·Ø¨Ù‚Ùƒ Ù„ØªÙ‚Ø¯ÙŠØ± Ø§Ù„Ø³Ø¹Ø±Ø§Øª ÙˆØ§Ù„Ù…Ø§ÙƒØ±ÙˆØ² ÙÙˆØ±Ø§Ù‹' : 'Snap a food photo to instantly estimate calories and macros'}
        icon={<Camera size={19} />}
        accent="#38bdf8"
        maxWidth={560}
        headerAccessory={
          <span
            aria-hidden="true"
            style={{ padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: '#38bdf8', fontSize: '0.66rem', fontWeight: 800 }}
          >
            GEMINI
          </span>
        }
        footer={
          stage === 'review' ? (
            <>
              <SecondaryAction onClick={reset} icon={<RefreshCw size={15} />}>
                {isRTL ? 'ØµÙˆØ±Ø© Ø¬Ø¯ÙŠØ¯Ø©' : 'New photo'}
              </SecondaryAction>
              <PrimaryAction onClick={handleSaveAndAdd} icon={<Check size={18} />}>
                {isRTL ? 'Ø³Ø¬Ù‘Ù„ Ø§Ù„ÙˆØ¬Ø¨Ø©' : 'Log meal'}
              </PrimaryAction>
            </>
          ) : stage === 'preview' ? (
            <>
              <SecondaryAction onClick={reset} icon={<RefreshCw size={15} />}>
                {isRTL ? 'Ø¥Ù„ØºØ§Ø¡' : 'Cancel'}
              </SecondaryAction>
              <PrimaryAction onClick={() => photo && void runScan(photo)} icon={<Sparkles size={17} />}>
                {isRTL ? 'Ø­Ù„Ù„ Ù‡Ø°Ù‡ Ø§Ù„ØµÙˆØ±Ø©' : 'Analyse this photo'}
              </PrimaryAction>
            </>
          ) : stage === 'scanning' ? (
            <PrimaryAction onClick={() => { abortRef.current = true; stopTimer(); setStage(photo ? 'preview' : 'intro'); }} fullWidth>
              {isRTL ? 'Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ù…Ø³Ø­' : 'Cancel scan'}
            </PrimaryAction>
          ) : (
            <>
              <SecondaryAction onClick={onClose}>{isRTL ? 'Ø¥Ù„ØºØ§Ø¡' : 'Cancel'}</SecondaryAction>
              <PrimaryAction onClick={onManualEntry} icon={<Keyboard size={17} />}>
                {isRTL ? 'Ø¥Ø¯Ø®Ø§Ù„ ÙŠØ¯ÙˆÙŠ' : 'Enter manually'}
              </PrimaryAction>
            </>
          )
        }
      >
        <ol
          aria-label={isRTL ? 'Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…Ø³Ø­' : 'Scan stages'}
          style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '0.3rem' }}
        >
          {([
            { key: 'intro', label: isRTL ? 'Ø§Ù„ØªÙ‚Ø§Ø·' : 'Capture' },
            { key: 'scanning', label: isRTL ? 'ØªØ­Ù„ÙŠÙ„' : 'Analyse' },
            { key: 'review', label: isRTL ? 'Ù…Ø±Ø§Ø¬Ø¹Ø©' : 'Review' }
          ] as const).map((step, index) => {
            const order = ['intro', 'scanning', 'review'];
            const currentIndex = stage === 'preview' ? 0 : order.indexOf(stage);
            const done = index < currentIndex;
            const active = index === currentIndex;
            return (
              <li
                key={step.key}
                aria-current={active ? 'step' : undefined}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: active ? '#38bdf8' : done ? '#10b981' : 'var(--text-muted)'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? '#38bdf8' : done ? '#10b981' : 'rgba(255,255,255,0.12)',
                    color: active || done ? '#041316' : 'var(--text-muted)',
                    fontSize: '0.62rem',
                    flexShrink: 0
                  }}
                >
                  {done ? <Check size={11} /> : index + 1}
                </span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>

        {permissionState && (
          <StatusCallout
            tone={permissionState.tone}
            title={permissionState.title}
            icon={permissionState.icon}
            action={
              <>
                {failure === 'too-large' || failure === 'decode' || failure === 'no-camera' ? (
                  <SecondaryAction onClick={() => fileInputRef.current?.click()} icon={<Upload size={15} />}>
                    {isRTL ? 'Ø§Ø®ØªÙŠØ§Ø± ØµÙˆØ±Ø©' : 'Pick a photo'}
                  </SecondaryAction>
                ) : (
                  <SecondaryAction onClick={() => void requestCamera()} icon={<Camera size={15} />}>
                    {isRTL ? 'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©' : 'Try again'}
                  </SecondaryAction>
                )}
                {onManualEntry && (
                  <SecondaryAction onClick={onManualEntry} icon={<Keyboard size={15} />}>
                    {isRTL ? 'Ø¥Ø¯Ø®Ø§Ù„ ÙŠØ¯ÙˆÙŠ' : 'Enter manually'}
                  </SecondaryAction>
                )}
              </>
            }
          >
            {permissionState.body}
            {failureDetail && (
              <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {failureDetail}
              </span>
            )}
          </StatusCallout>
        )}

        {stage === 'intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {cameraState === 'granted' ? (
              <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', background: '#000', border: '1px solid var(--border-color)' }}>
                <video ref={videoRef} playsInline muted style={{ width: '100%', height: '230px', objectFit: 'cover', display: 'block' }} />
                <div aria-hidden="true" style={{ position: 'absolute', inset: '18px', border: '2px dashed rgba(56, 189, 248, 0.75)', borderRadius: '14px' }} />
                <button
                  type="button"
                  onClick={captureFromStream}
                  style={{
                    position: 'absolute',
                    bottom: '0.85rem',
                    insetInlineStart: '50%',
                    transform: 'translateX(-50%)',
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.85)',
                    background: 'rgba(239, 68, 68, 0.92)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={isRTL ? 'Ø§Ù„ØªÙ‚Ø· Ø§Ù„ØµÙˆØ±Ø©' : 'Capture photo'}
                >
                  <Camera size={24} color="#fff" />
                </button>
              </div>
            ) : (
              <div
                style={{
                  border: '2px dashed var(--border-highlight)',
                  borderRadius: '18px',
                  padding: '1.5rem 1.1rem',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                <span aria-hidden="true" style={{ width: 58, height: 58, borderRadius: '18px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <ChefHat size={28} />
                </span>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 800 }}>
                    {isRTL ? 'Ø§Ù„ØªÙ‚Ø· ØµÙˆØ±Ø© Ù„Ø·Ø¨Ù‚ Ø§Ù„Ø·Ø¹Ø§Ù…' : 'Snap a photo of your plate'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '330px' }}>
                    {isRTL
                      ? 'Ø§Ù…Ù„Ø£ Ø§Ù„Ø¥Ø·Ø§Ø± Ø¨Ø§Ù„Ø·Ø¨Ù‚ ÙƒØ§Ù…Ù„Ø§Ù‹ Ù…Ø¹ Ø¥Ø¶Ø§Ø¡Ø© Ø¬ÙŠØ¯Ø© â€” ÙƒÙ„Ù…Ø§ Ø¸Ù‡Ø±Øª Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª Ø¨ÙˆØ¶ÙˆØ­ØŒ ÙƒØ§Ù† Ø§Ù„ØªÙ‚Ø¯ÙŠØ± Ø£Ø¯Ù‚.'
                      : 'Fill the frame with the whole plate under good light â€” the clearer the food, the sharper the estimate.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <PrimaryAction
                    onClick={() => void requestCamera()}
                    loading={cameraState === 'requesting'}
                    icon={<Camera size={17} />}
                  >
                    {cameraState === 'requesting'
                      ? isRTL ? 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¥Ø°Ù†â€¦' : 'Waiting for permissionâ€¦'
                      : isRTL ? 'ÙØªØ­ Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§' : 'Open camera'}
                  </PrimaryAction>
                  <SecondaryAction onClick={() => fileInputRef.current?.click()} icon={<Upload size={16} />}>
                    {isRTL ? 'Ø±ÙØ¹ ØµÙˆØ±Ø©' : 'Upload photo'}
                  </SecondaryAction>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={12} />
                  {isRTL ? 'ØªØªÙ… Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø© Ø¹Ù„Ù‰ Ø¬Ù‡Ø§Ø²Ùƒ Ø­ØªÙ‰ Ø¶ØºØ· Ø§Ù„ØµÙˆØ±Ø©' : 'Your photo is compressed on-device before upload'}
                </span>
              </div>
            )}
          </div>
        )}

        {stage === 'preview' && photo && (
          <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
            <img src={photo.dataUrl} alt={isRTL ? 'Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ù…Ù„ØªÙ‚Ø·Ø©' : 'Captured meal'} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={reset}
              style={{
                position: 'absolute',
                top: '10px',
                insetInlineEnd: '10px',
                padding: '0.35rem 0.7rem',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.68)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Crop size={12} />
              {isRTL ? 'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø§Ù„ØªÙ‚Ø§Ø·' : 'Retake'}
            </button>
            <div style={{ position: 'absolute', bottom: '0.5rem', insetInlineStart: '0.6rem', background: 'rgba(0,0,0,0.72)', padding: '0.22rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', color: '#cbd5e1', display: 'flex', gap: '0.5rem' }}>
              <span>{(photo.originalBytes / 1048576).toFixed(1)} MB</span>
              <span style={{ color: '#38bdf8' }}>â†’ {(photo.payloadBytes / 1024).toFixed(0)} KB</span>
            </div>
          </div>
        )}

        {stage === 'scanning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercent)}
              aria-label={isRTL ? 'ØªÙ‚Ø¯Ù‘Ù… ØªØ­Ù„ÙŠÙ„ Ø§Ù„ØµÙˆØ±Ø©' : 'Analysis progress'}
              style={{ height: 8, borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 700 }}>
                <Loader2 size={14} className="animate-spin" />
                {isRTL ? phaseLabel.ar : phaseLabel.en}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(progressPercent)}% Â· {elapsedSeconds}s
                {photo && phase === 'uploading' ? ` Â· ${(photo.payloadBytes / 1024).toFixed(0)} KB` : ''}
              </span>
            </div>
            {photo && (
              <img src={photo.dataUrl} alt="" aria-hidden="true" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: '14px', opacity: 0.6, display: 'block' }} />
            )}
          </div>
        )}

        {stage === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {needsCorrection && (
              <StatusCallout tone="warning" title={isRTL ? 'Ø±Ø§Ø¬Ø¹ Ø§Ù„Ù†ØªÙŠØ¬Ø© Ù‚Ø¨Ù„ Ø§Ù„Ø­ÙØ¸' : 'Review before saving'} icon={<AlertCircle size={15} />}>
                {isRTL
                  ? 'Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø£Ø¹Ø§Ø¯ Ù†ØªÙŠØ¬Ø© Ù†Ø§Ù‚ØµØ© Ø£Ùˆ ØºÙŠØ± ÙˆØ§Ø¶Ø­Ø©. ØµØ­Ù‘Ø­ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ù…ÙŠØ²Ø© Ø¨Ø§Ù„Ø£Ø¯Ù†Ø§Ù‡ Ø«Ù… Ø³Ø¬Ù‘Ù„ Ø§Ù„ÙˆØ¬Ø¨Ø©.'
                  : 'The AI returned an incomplete or unclear result. Fix the highlighted fields, then log the meal.'}
              </StatusCallout>
            )}

            {photo && (
              <img src={photo.dataUrl} alt="" aria-hidden="true" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '14px', display: 'block' }} />
            )}

            <div>
              <label htmlFor="ai-dish-title" style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 700 }}>
                {isRTL ? 'Ø§Ø³Ù… Ø§Ù„ÙˆØ¬Ø¨Ø© Ø§Ù„Ù…ÙƒØªØ´Ù' : 'Detected meal name'}
              </label>
              <input
                id="ai-dish-title"
                type="text"
                value={dishTitle}
                onChange={event => {
                  setDishTitle(event.target.value);
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: undefined }));
                }}
                aria-invalid={fieldErrors.title ? true : undefined}
                aria-describedby={fieldErrors.title ? 'ai-dish-title-error' : undefined}
                placeholder={isRTL ? 'Ù…Ø«Ø§Ù„: Ø£Ø±Ø² Ù…Ø¹ ØµØ¯ÙˆØ± Ø¯Ø¬Ø§Ø¬' : 'e.g., Grilled chicken & rice'}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  fontWeight: 700,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: `1px solid ${fieldErrors.title ? '#f87171' : 'var(--border-color)'}`,
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.title && <FieldError id="ai-dish-title-error" message={fieldErrors.title} />}
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 700 }}>
                {isRTL ? 'Ù†ÙˆØ¹ Ø§Ù„ÙˆØ¬Ø¨Ø©' : 'Meal category'}
              </span>
              <div role="radiogroup" aria-label={isRTL ? 'Ù†ÙˆØ¹ Ø§Ù„ÙˆØ¬Ø¨Ø©' : 'Meal category'} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {MEAL_TYPES.map(item => (
                  <button
                    key={item.type}
                    type="button"
                    role="radio"
                    aria-checked={mealType === item.type}
                    onClick={() => setMealType(item.type)}
                    style={{
                      padding: '0.5rem 0.25rem',
                      borderRadius: '10px',
                      border: `1px solid ${mealType === item.type ? '#10b981' : 'var(--border-color)'}`,
                      background: mealType === item.type ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                      color: mealType === item.type ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: mealType === item.type ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <UnitToggle
                id="ai-energy-unit"
                label={isRTL ? 'ÙˆØ­Ø¯Ø© Ø§Ù„Ø·Ø§Ù‚Ø©' : 'Energy unit'}
                value={energyUnit}
                onChange={next => {
                  if (next === energyUnit) return;
                  const kcal = energyToKcal(Number(calories) || 0, energyUnit);
                  setEnergyUnit(next as EnergyUnit);
                  setCalories(String(Math.round(kcalToEnergy(kcal, next as EnergyUnit))));
                }}
                options={[{ value: 'kcal', label: 'kcal' }, { value: 'kJ', label: 'kJ' }]}
              />
              <UnitToggle
                id="ai-mass-unit"
                label={isRTL ? 'ÙˆØ­Ø¯Ø© Ø§Ù„ÙˆØ²Ù†' : 'Weight unit'}
                value={massUnit}
                onChange={next => {
                  if (next === massUnit) return;
                  const convert = (raw: string) => {
                    const grams = massToGrams(Number(raw) || 0, massUnit);
                    const converted = gramsToMass(grams, next as MassUnit);
                    return String(Math.round(converted * 10) / 10);
                  };
                  setMassUnit(next as MassUnit);
                  setProtein(convert(protein));
                  setCarbs(convert(carbs));
                  setFats(convert(fats));
                }}
                options={[{ value: 'g', label: 'g' }, { value: 'oz', label: 'oz' }]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <InlineNumberField
                id="ai-calories"
                label={isRTL ? 'Ø§Ù„Ø³Ø¹Ø±Ø§Øª' : 'Calories'}
                value={calories}
                onChange={next => {
                  setCalories(next);
                  if (fieldErrors.calories) setFieldErrors(prev => ({ ...prev, calories: undefined }));
                }}
                suffix={energyUnit}
                accent="#f43f5e"
                invalid={Boolean(fieldErrors.calories)}
                describedBy={fieldErrors.calories ? 'ai-calories-error' : 'ai-calories-derived'}
                onEnter={() => document.getElementById('ai-protein')?.focus()}
                dir="ltr"
              />
              {derivedKcal > 0 && (
                <p id="ai-calories-derived" style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {isRTL
                    ? `Ø§Ù„Ù…Ø§ÙƒØ±ÙˆØ² Ø§Ù„Ø­Ø§Ù„ÙŠ ØªØ³Ø§ÙˆÙŠ ${derivedKcal} Ùƒ.Ø³Ø¹Ø±Ø© ${Math.abs(enteredKcal - derivedKcal) > 40 ? 'â€” ÙŠØ®ØªÙ„Ù ÙƒØ«ÙŠØ±Ø§Ù‹ Ø¹Ù† Ø§Ù„Ù…ÙØ¯Ø®Ù„' : ''}`
                    : `Macros currently total ${derivedKcal} kcal${Math.abs(enteredKcal - derivedKcal) > 40 ? ' â€” that is far from the value above' : ''}`}
                </p>
              )}
              {fieldErrors.calories && <FieldError id="ai-calories-error" message={fieldErrors.calories} />}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <InlineNumberField
                  id="ai-protein"
                  label={isRTL ? 'Ø¨Ø±ÙˆØªÙŠÙ†' : 'Protein'}
                  value={protein}
                  onChange={next => {
                    setProtein(next);
                    if (fieldErrors.macros) setFieldErrors(prev => ({ ...prev, macros: undefined }));
                  }}
                  suffix={massUnit}
                  accent="#06b6d4"
                  inputMode="decimal"
                  invalid={Boolean(fieldErrors.macros)}
                  describedBy={fieldErrors.macros ? 'ai-macros-error' : undefined}
                  onEnter={() => document.getElementById('ai-carbs')?.focus()}
                  dir="ltr"
                />
                <InlineNumberField
                  id="ai-carbs"
                  label={isRTL ? 'ÙƒØ§Ø±Ø¨' : 'Carbs'}
                  value={carbs}
                  onChange={next => {
                    setCarbs(next);
                    if (fieldErrors.macros) setFieldErrors(prev => ({ ...prev, macros: undefined }));
                  }}
                  suffix={massUnit}
                  accent="#f59e0b"
                  inputMode="decimal"
                  invalid={Boolean(fieldErrors.macros)}
                  describedBy={fieldErrors.macros ? 'ai-macros-error' : undefined}
                  onEnter={() => document.getElementById('ai-fats')?.focus()}
                  dir="ltr"
                />
                <InlineNumberField
                  id="ai-fats"
                  label={isRTL ? 'Ø¯Ù‡ÙˆÙ†' : 'Fats'}
                  value={fats}
                  onChange={next => {
                    setFats(next);
                    if (fieldErrors.macros) setFieldErrors(prev => ({ ...prev, macros: undefined }));
                  }}
                  suffix={massUnit}
                  accent="#ec4899"
                  inputMode="decimal"
                  invalid={Boolean(fieldErrors.macros)}
                  describedBy={fieldErrors.macros ? 'ai-macros-error' : undefined}
                  onEnter={() => document.getElementById('ai-calories')?.focus()}
                  dir="ltr"
                />
              </div>
              {fieldErrors.macros && <FieldError id="ai-macros-error" message={fieldErrors.macros} />}

              {healthScore !== undefined && (
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>
                  â˜… {healthScore}/10 {isRTL ? 'Ø¯Ø±Ø¬Ø© Ø§Ù„ØµØ­Ø©' : 'health score'}
                </p>
              )}
            </div>

            {ingredients.length > 0 && (
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  {isRTL ? 'Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª Ø§Ù„Ù…Ù‚Ø¯Ø±Ø©:' : 'Estimated ingredients:'}
                </span>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {ingredients.map((ingredient, index) => (
                    <span key={`${ingredient.name}-${index}`} style={{ fontSize: '0.72rem', padding: '0.22rem 0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                      {ingredient.name}{ingredient.portion ? ` (${ingredient.portion})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {aiNotes && (
              <p style={{ margin: 0, padding: '0.65rem 0.8rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, display: 'flex', gap: '0.45rem' }}>
                <Sparkles size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>{aiNotes}</span>
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {stage === 'scanning' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
              style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowRight size={12} style={{ transform: isRTL ? 'scaleX(-1)' : undefined }} />
              {isRTL ? 'ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¨Ù‚Ø§Ø¡ ÙÙŠ Ø§Ù„ØµÙØ­Ø© â€” Ø§Ù„ØªØ­Ù„ÙŠÙ„ ÙŠØ¹Ù…Ù„ ÙÙŠ Ø§Ù„Ø®Ù„ÙÙŠØ©.' : 'Stay on this screen â€” analysis runs in the background.'}
            </motion.p>
          )}
        </AnimatePresence>
      </ModalShell>
    </>
  );
}
