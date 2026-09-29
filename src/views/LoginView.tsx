import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Apple,
  Check,
  Dumbbell,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  WifiOff,
  X
} from 'lucide-react';
import './LoginView.css';
import { auth } from '../lib/firebase';
import {
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { notify } from '../lib/feedback';
import { Button } from '../components/ui/Button';
import { isUserAdmin } from '../lib/adminAuth';

type LoginProps = {
  onLogin: (user?: { email: string; name: string; isAdmin?: boolean }) => Promise<void> | void;
};

type FieldErrors = { name?: string; email?: string; password?: string; confirmPassword?: string };
type Mode = 'signin' | 'signup';
type Lang = 'ar' | 'en';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

type Copy = {
  brandTag: string;
  heroLine1: string;
  heroLine1Strong: string;
  heroLine2: string;
  heroLine2Strong: string;
  heroBody: string;
  pill1: string;
  pill2: string;
  pill3: string;
  trustTitle: string;
  trustBody: string;
  offlineReady: string;
  eyebrowSignIn: string;
  eyebrowSignUp: string;
  titleSignIn: string;
  titleSignUp: string;
  subtitleSignIn: string;
  subtitleSignUp: string;
  tabSignIn: string;
  tabSignUp: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  passwordHint: string;
  remember: string;
  forgot: string;
  submitSignIn: string;
  submitSignUp: string;
  working: string;
  guest: string;
  orContinue: string;
  guestNote: string;
  genericError: string;
  emailError: string;
  emailMissing: string;
  passwordMissing: string;
  passwordShort: string;
  nameMissing: string;
  confirmMismatch: string;
  tooMany: string;
  networkError: string;
  resetTitle: string;
  resetBody: (email: string) => string;
  resetSentBody: string;
  resetSend: string;
  resetDone: string;
  close: string;
  changeLanguage: string;
  skipToForm: string;
  showPassword: string;
  hidePassword: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    brandTag: 'PRO',
    heroLine1: 'MASTER YOUR',
    heroLine1Strong: 'FORM.',
    heroLine2: 'OWN YOUR',
    heroLine2Strong: 'PROGRESS.',
    heroBody: 'Engineered for dedicated athletes: progressive overload precision, AI strength coaching, and real-time nutrition intelligence.',
    pill1: 'AI Gym Coach',
    pill2: 'Progressive Overload',
    pill3: '100% Offline Ready',
    trustTitle: 'Your data stays yours',
    trustBody: 'Workouts are stored locally first and synced to your account only when you are online.',
    offlineReady: 'Works without a connection',
    eyebrowSignIn: 'ATHLETE ACCESS',
    eyebrowSignUp: 'NEW ATHLETE',
    titleSignIn: 'Welcome back',
    titleSignUp: 'Create your account',
    subtitleSignIn: 'Sign in to pick up your training plan, history, and metrics exactly where you left them.',
    subtitleSignUp: 'One account unlocks your split, live set tracking, and nutrition targets.',
    tabSignIn: 'Sign in',
    tabSignUp: 'Create account',
    nameLabel: 'Athlete name',
    namePlaceholder: 'e.g. Alex Hunter',
    emailLabel: 'Email address',
    emailPlaceholder: 'athlete@forma.app',
    passwordLabel: 'Password',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Re-enter your password',
    passwordHint: 'At least 6 characters',
    remember: 'Keep me signed in',
    forgot: 'Forgot password?',
    submitSignIn: 'Sign in to FORMA',
    submitSignUp: 'Create account & start',
    working: 'Working…',
    guest: 'Continue as guest athlete',
    orContinue: 'or continue with',
    guestNote: 'No account needed. Your data stays on this device.',
    genericError: 'We could not sign you in with those details. Check your email and password, then try again.',
    emailError: 'Enter a valid email address.',
    emailMissing: 'Enter your email address.',
    passwordMissing: 'Enter your password.',
    passwordShort: 'Use at least 6 characters.',
    nameMissing: 'Enter your name.',
    confirmMismatch: 'Passwords do not match.',
    tooMany: 'Too many attempts. Please wait a moment and try again.',
    networkError: 'Something went wrong on our side. Please try again.',
    resetTitle: 'Reset your password',
    resetBody: (email: string) => `We will send recovery instructions to ${email || 'your email address'}.`,
    resetSentBody: 'Check your inbox for the recovery link.',
    resetSend: 'Send reset link',
    resetDone: 'Email sent',
    close: 'Close',
    changeLanguage: 'Change language',
    skipToForm: 'Skip to the sign-in form',
    showPassword: 'Show password',
    hidePassword: 'Hide password'
  },
  ar: {
    brandTag: 'PRO',
    heroLine1: 'أتقن',
    heroLine1Strong: 'التكنيك.',
    heroLine2: 'وتجاوز حدود',
    heroLine2Strong: 'قوتك.',
    heroBody: 'نظام تدريبي احترافي: حمل تدريجي دقيق، مدرب ذكاء اصطناعي، وتغذية لحظية ذكية.',
    pill1: 'مدرب الذكاء الاصطناعي',
    pill2: 'حمل تدريبي تدريجي',
    pill3: 'يعمل بدون إنترنت',
    trustTitle: 'بياناتك ملكك',
    trustBody: 'يُحفظ تمارينك محلياً أولاً وتُزامن مع حسابك فقط عند الاتصال بالإنترنت.',
    offlineReady: 'يعمل بدون اتصال',
    eyebrowSignIn: 'بوابة الرياضيين',
    eyebrowSignUp: 'رياضي جديد',
    titleSignIn: 'مرحباً بعودتك',
    titleSignUp: 'أنشئ حسابك',
    subtitleSignIn: 'سجّل الدخول لمتابعة خطتك التدريبية وسجلك ومقاييسك من حيث توقفت.',
    subtitleSignUp: 'حساب واحد يفتح جدولك وتتبع الجولات وأهداف التغذية.',
    tabSignIn: 'تسجيل الدخول',
    tabSignUp: 'إنشاء حساب',
    nameLabel: 'اسم الرياضي',
    namePlaceholder: 'مثال: أحمد علي',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'athlete@forma.app',
    passwordLabel: 'كلمة المرور',
    confirmLabel: 'تأكيد كلمة المرور',
    confirmPlaceholder: 'أعد كتابة كلمة المرور',
    passwordHint: '6 خانات على الأقل',
    remember: 'تذكرني على هذا الجهاز',
    forgot: 'نسيت كلمة المرور؟',
    submitSignIn: 'تسجيل الدخول إلى FORMA',
    submitSignUp: 'إنشاء حساب وبدء التدريب',
    working: 'جارٍ التنفيذ…',
    guest: 'دخول سريع كزائر',
    orContinue: 'أو تابع عبر',
    guestNote: 'بدون حساب. بياناتك تبقى على هذا الجهاز.',
    genericError: 'تعذر إتمام تسجيل الدخول بهذه البيانات. تحقق من البريد وكلمة المرور ثم أعد المحاولة.',
    emailError: 'أدخل بريداً إلكترونياً صحيحاً.',
    emailMissing: 'أدخل بريدك الإلكتروني.',
    passwordMissing: 'أدخل كلمة المرور.',
    passwordShort: 'استخدم 6 خانات على الأقل.',
    nameMissing: 'أدخل اسمك.',
    confirmMismatch: 'كلمتا المرور غير متطابقتين.',
    tooMany: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
    networkError: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    resetTitle: 'استعادة كلمة المرور',
    resetBody: (email: string) => `سنرسل تعليمات الاستعادة إلى ${email || 'بريدك الإلكتروني'}.`,
    resetSentBody: 'تفقد بريدك للحصول على رابط الاستعادة.',
    resetSend: 'إرسال رابط الاستعادة',
    resetDone: 'تم الإرسال',
    close: 'إغلاق',
    changeLanguage: 'تغيير اللغة',
    skipToForm: 'تخطَّ إلى نموذج الدخول',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور'
  }
};

function readStoredLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('forma_lang') || localStorage.getItem('kinetic_lang') || localStorage.getItem('mygym_lang');
  if (stored === 'ar' || stored === 'en') return stored;
  const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  return navLang.startsWith('ar') ? 'ar' : 'en';
}

function authError(error: unknown, isArabic: boolean, mode: Mode) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/too-many-requests') {
    return isArabic ? 'محاولات كثيرة. يرجى الانتظار لحظات والمحاولة ثانية.' : 'Too many attempts. Please wait a moment and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return isArabic ? 'تم إلغاء عملية تسجيل الدخول.' : 'Sign-in was cancelled.';
  }
  if (mode === 'signup') {
    if (code === 'auth/email-already-in-use') {
      return isArabic ? 'هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول.' : 'This email is already registered. Please sign in.';
    }
    if (code === 'auth/weak-password') {
      return isArabic ? 'كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى.' : 'Password is too weak. Please choose a stronger password.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return isArabic ? 'هذا البريد مسجل بطريقة تسجيل دخول أخرى.' : 'This email uses another sign-in method.';
    }
  }
  return null;
}

export function LoginView({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'primary' | 'guest' | 'social' | 'reset' | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [lang, setLang] = useState<Lang>(readStoredLanguage);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';
  const copy = useMemo(() => COPY[lang], [lang]);

  useEffect(() => {
    setErrors({});
    setFormError(null);
  }, [mode]);

  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  const toggleLanguage = () => {
    const next: Lang = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
    setErrors({});
    localStorage.setItem('forma_lang', next);
    localStorage.setItem('kinetic_lang', next);
    localStorage.setItem('mygym_lang', next);
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (mode === 'signup' && !name.trim()) nextErrors.name = copy.nameMissing;
    if (!email.trim()) nextErrors.email = copy.emailMissing;
    else if (!emailPattern.test(email.trim())) nextErrors.email = copy.emailError;
    if (!password) nextErrors.password = copy.passwordMissing;
    else if (password.length < MIN_PASSWORD) nextErrors.password = copy.passwordShort;
    if (mode === 'signup' && password !== confirmPassword) nextErrors.confirmPassword = copy.confirmMismatch;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const revalidateField = (field: keyof FieldErrors) => {
    if (!errors[field]) return;
    const next = { ...errors };
    if (field === 'name') {
      if (!name.trim()) return;
      delete next.name;
    }
    if (field === 'email') {
      if (!email.trim() || !emailPattern.test(email.trim())) return;
      delete next.email;
    }
    if (field === 'password') {
      if (password.length < MIN_PASSWORD) return;
      delete next.password;
    }
    if (field === 'confirmPassword') {
      if (password !== confirmPassword) return;
      delete next.confirmPassword;
    }
    setErrors(next);
  };

  const failWith = (message: string) => {
    setFormError(message);
    setIsSubmitting(false);
    setPendingAction(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) {
      setFormError(null);
      return;
    }
    setIsSubmitting(true);
    setPendingAction('primary');
    setFormError(null);

    try {
      const userEmail = email.trim();

      if (mode === 'signin') {
        let displayName = userEmail.split('@')[0] || 'Athlete';
        let isAdmin = false;

        if (auth) {
          let signedInUser = auth.currentUser;
          try {
            await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
            const cred = await signInWithEmailAndPassword(auth, userEmail, password);
            signedInUser = cred.user;
            displayName = cred.user?.displayName || displayName;
          } catch (authErr: unknown) {
            failWith(authError(authErr, isRTL, mode) ?? copy.genericError);
            return;
          }
          isAdmin = await isUserAdmin(signedInUser, true);
        }

        await onLogin({ email: userEmail, name: displayName, isAdmin });
        notify(
          isAdmin
            ? (isRTL ? 'مرحباً بك في لوحة التحكم.' : 'Welcome to Admin Dashboard.')
            : (isRTL ? 'مرحباً بك مجدداً في FORMA.' : 'Welcome back to FORMA.'),
          'success'
        );
      } else {
        let displayName = name.trim() || 'Athlete';

        if (auth) {
          await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
          const cred = await createUserWithEmailAndPassword(auth, userEmail, password);
          if (cred.user && name.trim()) {
            await updateProfile(cred.user, { displayName: name.trim() });
          }
          displayName = cred.user?.displayName || displayName;
        }
        const signupIsAdmin = await isUserAdmin();
        await onLogin({ email: userEmail, name: displayName, isAdmin: signupIsAdmin });
        notify(isRTL ? 'تم إنشاء الحساب بنجاح! مرحباً بك في FORMA ⚡' : 'Account created successfully! Welcome to FORMA ⚡', 'success');
      }
    } catch (error) {
      failWith(authError(error, isRTL, mode) ?? copy.genericError);
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const quickGuestLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPendingAction('guest');
    setFormError(null);
    try {
      await onLogin({
        email: 'guest@forma.app',
        name: isRTL ? 'رياضي FORMA' : 'FORMA Athlete'
      });
      notify(isRTL ? 'تم تسجيل الدخول كرياضي زائر بنجاح ⚡' : 'Signed in as Guest Athlete ⚡', 'success');
    } catch (error) {
      notify(authError(error, isRTL, mode) ?? copy.networkError, 'error');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const socialSignIn = async (provider: 'google' | 'apple') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPendingAction('social');
    setFormError(null);
    try {
      let userEmail = `${provider}@guest.forma.app`;
      let userName = `${provider.toUpperCase()} Athlete`;

      if (auth) {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const cred = await signInWithPopup(auth, provider === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com'));
        if (cred.user) {
          userEmail = cred.user.email || userEmail;
          userName = cred.user.displayName || userName;
        }
        const isAdmin = await isUserAdmin(cred.user, true);
        await onLogin({ email: userEmail, name: userName, isAdmin });
      } else {
        await onLogin({ email: userEmail, name: userName, isAdmin: false });
      }
      notify(isRTL ? `تم تسجيل الدخول عبر ${provider === 'google' ? 'Google' : 'Apple'}.` : `Signed in with ${provider === 'google' ? 'Google' : 'Apple'}.`, 'success');
    } catch (error) {
      const message = authError(error, isRTL, mode);
      if (message !== 'Sign-in was cancelled.' && message !== 'تم إلغاء عملية تسجيل الدخول.') {
        notify(message ?? copy.networkError, 'error');
      }
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const sendReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setErrors({ email: copy.emailError });
      setResetOpen(false);
      return;
    }
    setIsSubmitting(true);
    setPendingAction('reset');
    try {
      if (auth) await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      notify(isRTL ? 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك.' : 'Password reset instructions have been sent.', 'success');
    } catch (error) {
      notify(authError(error, isRTL, mode) ?? copy.networkError, 'error');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const busy = pendingAction;

  return (
    <main className="forma-login" dir={isRTL ? 'rtl' : 'ltr'}>
      <a className="forma-skip-link" href="#forma-auth-form">
        {copy.skipToForm}
      </a>

      <div className="forma-shell">
        <aside className="forma-hero">
          <div className="forma-brand-header">
            <div className="forma-brand-pill">
              <span className="forma-brand-gem" aria-hidden="true">
                <Dumbbell size={18} />
              </span>
              <span className="forma-brand-name">FORMA</span>
              <span className="forma-badge-pro">{copy.brandTag}</span>
            </div>

            <button type="button" className="forma-lang-btn" onClick={toggleLanguage} title={copy.changeLanguage} aria-label={copy.changeLanguage}>
              <Globe size={14} aria-hidden="true" />
              <span>{isRTL ? 'English' : 'العربية'}</span>
            </button>
          </div>

          <div className="forma-hero-content">
            <h1 className="forma-hero-title">
              {copy.heroLine1} <strong>{copy.heroLine1Strong}</strong>
              <br />
              {copy.heroLine2} <strong>{copy.heroLine2Strong}</strong>
            </h1>

            <p className="forma-hero-desc">{copy.heroBody}</p>

            <ul className="forma-hero-pills">
              <li className="forma-pill">
                <span className="forma-pill-dot" style={{ background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} aria-hidden="true" />
                {copy.pill1}
              </li>
              <li className="forma-pill">
                <span className="forma-pill-dot" style={{ background: '#bef264', boxShadow: '0 0 8px #bef264' }} aria-hidden="true" />
                {copy.pill2}
              </li>
              <li className="forma-pill">
                <span className="forma-pill-dot" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} aria-hidden="true" />
                {copy.pill3}
              </li>
            </ul>

            <div className="forma-trust-card">
              <span className="forma-trust-icon" aria-hidden="true">
                <ShieldCheck size={18} />
              </span>
              <div>
                <strong>{copy.trustTitle}</strong>
                <p>{copy.trustBody}</p>
              </div>
            </div>
          </div>

          <p className="forma-hero-foot">
            <WifiOff size={14} aria-hidden="true" />
            {copy.offlineReady}
          </p>
        </aside>

        <section className="forma-panel" aria-labelledby="forma-auth-title">
          <div className="forma-panel-header">
            <span className="forma-eyebrow">{mode === 'signin' ? copy.eyebrowSignIn : copy.eyebrowSignUp}</span>
            <h2 className="forma-panel-title" id="forma-auth-title">
              {mode === 'signin' ? copy.titleSignIn : copy.titleSignUp}
            </h2>
            <p className="forma-panel-subtitle">{mode === 'signin' ? copy.subtitleSignIn : copy.subtitleSignUp}</p>
          </div>

          <div className="forma-mode-switch" role="tablist" aria-label={mode === 'signin' ? copy.eyebrowSignIn : copy.eyebrowSignUp}>
            <button
              type="button"
              role="tab"
              id="forma-tab-signin"
              aria-selected={mode === 'signin'}
              aria-controls="forma-auth-form"
              className={mode === 'signin' ? 'is-active' : ''}
              onClick={() => setMode('signin')}
              disabled={isSubmitting}
            >
              {copy.tabSignIn}
            </button>
            <button
              type="button"
              role="tab"
              id="forma-tab-signup"
              aria-selected={mode === 'signup'}
              aria-controls="forma-auth-form"
              className={mode === 'signup' ? 'is-active' : ''}
              onClick={() => setMode('signup')}
              disabled={isSubmitting}
            >
              {copy.tabSignUp}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {formError && (
              <motion.div
                key="form-error"
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="forma-alert"
              >
                <AlertCircle size={18} aria-hidden="true" className="shrink-0" />
                <span>{formError}</span>
                <button type="button" className="forma-alert-dismiss" onClick={() => setFormError(null)} aria-label={copy.close}>
                  <X size={15} aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            ref={formRef}
            id="forma-auth-form"
            className="forma-form"
            onSubmit={submit}
            noValidate
            aria-busy={isSubmitting}
          >
            {mode === 'signup' && (
              <AuthField
                id="forma-name"
                label={copy.nameLabel}
                icon={<User size={17} aria-hidden="true" />}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  revalidateField('name');
                }}
                onBlur={() => revalidateField('name')}
                error={errors.name}
                autoComplete="name"
                placeholder={copy.namePlaceholder}
                disabled={isSubmitting}
              />
            )}

            <AuthField
              id="forma-email"
              label={copy.emailLabel}
              type="email"
              inputMode="email"
              autoComplete="email"
              icon={<Mail size={17} aria-hidden="true" />}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                revalidateField('email');
              }}
              onBlur={() => revalidateField('email')}
              error={errors.email}
              placeholder={copy.emailPlaceholder}
              disabled={isSubmitting}
              autoFocus
            />

            <AuthField
              id="forma-password"
              label={copy.passwordLabel}
              type={passwordVisible ? 'text' : 'password'}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              icon={<LockKeyhole size={17} aria-hidden="true" />}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                revalidateField('password');
                revalidateField('confirmPassword');
              }}
              onBlur={() => revalidateField('password')}
              error={errors.password}
              helperText={mode === 'signup' ? copy.passwordHint : undefined}
              placeholder="••••••••"
              disabled={isSubmitting}
              trailing={
                <button
                  type="button"
                  className="forma-field-action"
                  onClick={() => setPasswordVisible((current) => !current)}
                  aria-label={passwordVisible ? copy.hidePassword : copy.showPassword}
                  aria-pressed={passwordVisible}
                >
                  {passwordVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              }
            />

            {mode === 'signup' && (
              <AuthField
                id="forma-confirm"
                label={copy.confirmLabel}
                type="password"
                autoComplete="new-password"
                icon={<LockKeyhole size={17} aria-hidden="true" />}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  revalidateField('confirmPassword');
                }}
                onBlur={() => revalidateField('confirmPassword')}
                error={errors.confirmPassword}
                placeholder={copy.confirmPlaceholder}
                disabled={isSubmitting}
              />
            )}

            {mode === 'signin' && (
              <div className="forma-form-meta">
                <label className="forma-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="forma-check-box" aria-hidden="true">
                    <Check size={12} />
                  </span>
                  <span>{copy.remember}</span>
                </label>

                <button
                  type="button"
                  className="forma-forgot-btn"
                  onClick={() => {
                    setResetOpen(true);
                    setResetSent(false);
                  }}
                  disabled={isSubmitting}
                >
                  {copy.forgot}
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="cyan"
              size="lg"
              fullWidth
              isLoading={busy === 'primary'}
              disabled={isSubmitting && busy !== 'primary'}
              className="forma-primary-cta"
            >
              {busy === 'primary' ? copy.working : mode === 'signin' ? copy.submitSignIn : copy.submitSignUp}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={quickGuestLogin}
              disabled={isSubmitting}
              leftIcon={<UserCheck size={18} aria-hidden="true" />}
            >
              {copy.guest}
            </Button>

            <p className="forma-guest-note">{copy.guestNote}</p>

            <div className="forma-divider">
              <span>{copy.orContinue}</span>
            </div>

            <div className="forma-social-row">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void socialSignIn('google')}
                disabled={isSubmitting}
                leftIcon={<span className="forma-social-glyph" aria-hidden="true">G</span>}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void socialSignIn('apple')}
                disabled={isSubmitting}
                leftIcon={<Apple size={16} aria-hidden="true" />}
              >
                Apple
              </Button>
            </div>
          </form>
        </section>
      </div>

      <AnimatePresence>
        {resetOpen && (
          <motion.div
            className="forma-reset-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onClick={() => setResetOpen(false)}
          >
            <motion.form
              className="forma-reset-modal"
              onSubmit={sendReset}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="forma-reset-title"
              aria-describedby="forma-reset-desc"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  setResetOpen(false);
                }
              }}
            >
              <button className="forma-modal-close" type="button" aria-label={copy.close} onClick={() => setResetOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
              <div className="forma-reset-icon" aria-hidden="true">
                {resetSent ? <Sparkles size={26} /> : <KeyRound size={26} />}
              </div>
              <h3 className="forma-reset-title" id="forma-reset-title">
                {copy.resetTitle}
              </h3>
              <p className="forma-reset-desc" id="forma-reset-desc">
                {resetSent ? copy.resetSentBody : copy.resetBody(email.trim())}
              </p>
              <Button type="submit" variant="primary" fullWidth isLoading={busy === 'reset'} disabled={resetSent || (isSubmitting && busy !== 'reset')}>
                {resetSent ? copy.resetDone : copy.resetSend}
              </Button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            key="busy-overlay"
            className="forma-busy-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <Loader2 size={18} className="forma-busy-spinner" aria-hidden="true" />
            <span>{copy.working}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function AuthField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  icon,
  trailing,
  ...inputProps
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'value' | 'id'>) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = [error ? errorId : '', helperText && !error ? helperId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`ui-input-wrapper ${error ? 'is-invalid' : ''}`}>
      <label className="ui-input-label" htmlFor={id}>
        {label}
      </label>
      <div className={`ui-input-box ${error ? 'has-error' : ''}`}>
        {icon && (
          <span className="text-[var(--text-muted)] shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          className="ui-input-field"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {trailing}
      </div>
      {error ? (
        <span className="ui-input-error" id={errorId}>
          {error}
        </span>
      ) : helperText ? (
        <span className="ui-input-helper" id={helperId}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
