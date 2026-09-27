import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Apple, Dumbbell, Globe, KeyRound, LockKeyhole, Mail, User, UserCheck, X } from 'lucide-react';
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
import { Input } from '../components/ui/Input';
import { isUserAdmin, ADMIN_CREDENTIALS } from '../lib/adminAuth';

type LoginProps = {
  onLogin: (user?: { email: string; name: string; isAdmin?: boolean }) => Promise<void> | void
};
type FieldErrors = { name?: string; email?: string; password?: string; confirmPassword?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authError(error: unknown, isArabic: boolean) {
  const code = (error as { code?: string })?.code;
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code || '')) {
    return isArabic ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password. Please try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return isArabic ? 'هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول.' : 'This email is already registered. Please sign in.';
  }
  if (code === 'auth/weak-password') {
    return isArabic ? 'كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى.' : 'Password is too weak. Please choose a stronger password.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return isArabic ? 'تم إلغاء عملية تسجيل الدخول.' : 'Sign-in was cancelled.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return isArabic ? 'هذا البريد مسجل بطريقة تسجيل دخول أخرى.' : 'This email uses another sign-in method.';
  }
  if (code === 'auth/too-many-requests') {
    return isArabic ? 'محاولات كثيرة. يرجى الانتظار لحظات والمحاولة ثانية.' : 'Too many attempts. Please wait a moment and try again.';
  }
  return isArabic ? 'تعذر إتمام العملية. يرجى المحاولة لاحقاً.' : 'Operation failed. Please try again.';
}

export function LoginView({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Active language state (English default unless changed or device is Arabic)
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('forma_lang') || localStorage.getItem('kinetic_lang') || localStorage.getItem('mygym_lang');
      if (stored === 'ar' || stored === 'en') return stored;
      const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
      if (navLang.startsWith('ar')) return 'ar';
    }
    return 'en';
  });

  const isRTL = lang === 'ar';

  const toggleLanguage = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
    localStorage.setItem('forma_lang', next);
    localStorage.setItem('kinetic_lang', next);
    localStorage.setItem('mygym_lang', next);
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (mode === 'signup' && !name.trim()) {
      nextErrors.name = isRTL ? 'يرجى إدخال اسم الرياضي.' : 'Please enter your name.';
    }
    if (!email.trim() || !emailPattern.test(email.trim())) {
      nextErrors.email = isRTL ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = isRTL ? 'يرجى إدخال كلمة المرور.' : 'Enter your password.';
    } else if (password.length < 6) {
      nextErrors.password = isRTL ? 'يجب ألا تقل كلمة المرور عن 6 خانات.' : 'Your password must be at least 6 characters.';
    }
    if (mode === 'signup' && password !== confirmPassword) {
      nextErrors.confirmPassword = isRTL ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const userEmail = email.trim();
      const isAdmin = isUserAdmin(userEmail);

      if (mode === 'signin') {
        let displayName = userEmail.split('@')[0] || 'Athlete';

        if (isAdmin) {
          if (password !== ADMIN_CREDENTIALS.password) {
            notify(isRTL ? 'كلمة المرور غير صحيحة لحساب المسؤول.' : 'Incorrect password for admin account.', 'error');
            setIsSubmitting(false);
            return;
          }

          // Admin authenticated successfully
          if (auth) {
            try {
              await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
              const cred = await signInWithEmailAndPassword(auth, userEmail, password);
              displayName = cred.user?.displayName || 'Admin';
            } catch (authErr: any) {
              // If account doesn't exist yet in Firebase, automatically create it
              if (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential') {
                try {
                  const newCred = await createUserWithEmailAndPassword(auth, userEmail, password);
                  displayName = newCred.user?.displayName || 'Admin';
                } catch {
                  displayName = 'Admin';
                }
              } else {
                displayName = 'Admin';
              }
            }
          }

          await onLogin({ 
            email: userEmail, 
            name: displayName || 'Admin',
            isAdmin: true 
          });
          notify(isRTL ? 'مرحباً بك في لوحة التحكم.' : 'Welcome to Admin Dashboard.', 'success');
          return;
        }

        // Regular athlete signin
        if (auth) {
          await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
          const cred = await signInWithEmailAndPassword(auth, userEmail, password);
          displayName = cred.user?.displayName || displayName;
        }
        await onLogin({ 
          email: userEmail, 
          name: displayName,
          isAdmin: false 
        });
        notify(isRTL ? 'مرحباً بك مجدداً في FORMA.' : 'Welcome back to FORMA.', 'success');
      } else {
        // Sign Up Mode
        let displayName = name.trim() || 'Athlete';

        if (isAdmin && password !== ADMIN_CREDENTIALS.password) {
          notify(isRTL ? 'كلمة المرور غير مطابقة لكلمة مرور المسؤول المحددة.' : 'Password does not match designated admin password.', 'error');
          setIsSubmitting(false);
          return;
        }

        if (auth) {
          await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
          const cred = await createUserWithEmailAndPassword(auth, userEmail, password);
          if (cred.user && name.trim()) {
            await updateProfile(cred.user, { displayName: name.trim() });
          }
          displayName = cred.user?.displayName || displayName;
        }
        await onLogin({ 
          email: userEmail, 
          name: displayName,
          isAdmin 
        });
        notify(isRTL ? 'تم إنشاء الحساب بنجاح! مرحباً بك في FORMA ⚡' : 'Account created successfully! Welcome to FORMA ⚡', 'success');
      }
    } catch (error) {
      notify(authError(error, isRTL), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickGuestLogin = async () => {
    setIsSubmitting(true);
    try {
      await onLogin({
        email: 'guest@forma.app',
        name: isRTL ? 'رياضي FORMA' : 'FORMA Athlete'
      });
      notify(isRTL ? 'تم تسجيل الدخول كرياضي زائر بنجاح ⚡' : 'Signed in as Guest Athlete ⚡', 'success');
    } catch (error) {
      notify(authError(error, isRTL), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialSignIn = async (provider: 'google' | 'apple') => {
    setIsSubmitting(true);
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
      }

      const isAdmin = isUserAdmin(userEmail);
      await onLogin({
        email: userEmail,
        name: userName,
        isAdmin
      });
      notify(isRTL ? `تم تسجيل الدخول عبر ${provider === 'google' ? 'Google' : 'Apple'}.` : `Signed in with ${provider === 'google' ? 'Google' : 'Apple'}.`, 'success');
    } catch (error) {
      const message = authError(error, isRTL);
      if (message !== 'Sign-in was cancelled.' && message !== 'تم إلغاء عملية تسجيل الدخول.') {
        notify(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setErrors({ email: isRTL ? 'أدخل بريدك الإلكتروني أولاً ثم اضغط استعادة.' : 'Enter your email above, then request a reset.' });
      setResetOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      if (auth) await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      notify(isRTL ? 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك.' : 'Password reset instructions have been sent.', 'success');
    } catch (error) {
      notify(authError(error, isRTL), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="forma-login" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="forma-shell">
        {/* Visual Hero Panel */}
        <aside className="forma-hero">
          <div className="forma-brand-header">
            <div className="forma-brand-pill">
              <div className="forma-brand-gem">
                <Dumbbell size={18} />
              </div>
              <span className="forma-brand-name">FORMA</span>
              <span className="forma-badge-pro">PRO</span>
            </div>

            <button
              type="button"
              className="forma-lang-btn"
              onClick={toggleLanguage}
              title={isRTL ? 'تغيير اللغة / Change Language' : 'Change Language'}
            >
              <Globe size={14} />
              <span>{isRTL ? 'English' : 'العربية'}</span>
            </button>
          </div>

          <div className="forma-hero-content">
            <h1 className="forma-hero-title">
              {isRTL ? (
                <>
                  أتقن <strong>التكنيك.</strong><br />
                  وتجاوز حدود <strong>قوتك.</strong>
                </>
              ) : (
                <>
                  MASTER YOUR <strong>FORM.</strong><br />
                  OWN YOUR <strong>PROGRESS.</strong>
                </>
              )}
            </h1>

            <p className="forma-hero-desc">
              {isRTL
                ? 'نظام تدريبي احترافي متكامل: تتبع أوزان وجولات بدقة مليمترية، ذكاء اصطناعي متطور، وإدارة شاملة لتغذيتك وأهدافك البدنية.'
                : 'Engineered for dedicated athletes: progressive overload precision, AI strength coaching, and real-time nutrition intelligence.'}
            </p>

            <div className="forma-hero-pills">
              <span className="forma-pill">
                <span className="forma-pill-dot" />
                {isRTL ? 'مدرب الذكاء الاصطناعي' : 'AI Gym Coach'}
              </span>
              <span className="forma-pill">
                <span className="forma-pill-dot" style={{ background: '#bef264', boxShadow: '0 0 8px #bef264' }} />
                {isRTL ? 'حمل تدريبي تدريجي' : 'Progressive Overload'}
              </span>
              <span className="forma-pill">
                <span className="forma-pill-dot" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
                {isRTL ? 'يعمل بدون إنترنت 100%' : '100% Offline Ready'}
              </span>
            </div>
          </div>
        </aside>

        {/* Authentication Form Panel */}
        <section className="forma-panel">
          <div className="forma-panel-header">
            <div>
              <span className="forma-eyebrow">
                {isRTL ? 'بوابة الرياضيين' : 'ATHLETE ACCESS'}
              </span>
              <h2 className="forma-panel-title">
                {mode === 'signin' 
                  ? (isRTL ? 'مرحباً بك مجدداً' : 'Welcome Back')
                  : (isRTL ? 'إنشاء حساب رياضي جديد' : 'Create Athlete Account')}
              </h2>
              <p className="forma-panel-subtitle">
                {mode === 'signin'
                  ? (isRTL ? 'سجل دخولك لمتابعة خطتك التدريبية وجداولك الحالية' : 'Sign in to access your training plan and metrics')
                  : (isRTL ? 'انضم إلى FORMA وابدأ رحلة التطور الرياضي الدقيق' : 'Join FORMA and unlock precision athletic performance')}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[var(--surface-input)] p-1 rounded-xl border border-[var(--border-card)] mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-[var(--surface-card-hover)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => {
                setMode('signin');
                setErrors({});
              }}
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--surface-card-hover)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => {
                setMode('signup');
                setErrors({});
              }}
            >
              {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
            </button>
          </div>

          <form onSubmit={submit} className="forma-form flex flex-col gap-4" noValidate>
            {/* Name Field for Sign Up */}
            {mode === 'signup' && (
              <Input
                label={isRTL ? 'اسم الرياضي' : 'ATHLETE NAME'}
                placeholder={isRTL ? 'مثال: أحمد علي' : 'e.g. Alex Hunter'}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((cur) => ({ ...cur, name: undefined }));
                }}
                leftIcon={<User size={18} />}
                error={errors.name}
              />
            )}

            {/* Email Field */}
            <Input
              label={isRTL ? 'البريد الإلكتروني' : 'EMAIL ADDRESS'}
              type="email"
              autoComplete="email"
              placeholder={isRTL ? 'athlete@forma.app' : 'athlete@forma.app'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((cur) => ({ ...cur, email: undefined }));
              }}
              leftIcon={<Mail size={18} />}
              error={errors.email}
            />

            {/* Password Field */}
            <Input
              label={isRTL ? 'كلمة المرور' : 'PASSWORD'}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((cur) => ({ ...cur, password: undefined }));
              }}
              leftIcon={<LockKeyhole size={18} />}
              error={errors.password}
              helperText={mode === 'signup' ? (isRTL ? 'يجب أن لا تقل عن 6 خانات' : 'At least 6 characters') : undefined}
            />

            {/* Confirm Password Field for Sign Up */}
            {mode === 'signup' && (
              <Input
                label={isRTL ? 'تأكيد كلمة المرور' : 'CONFIRM PASSWORD'}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((cur) => ({ ...cur, confirmPassword: undefined }));
                }}
                leftIcon={<LockKeyhole size={18} />}
                error={errors.confirmPassword}
              />
            )}

            {/* Forgot Password link and Remember Me (Sign In Mode) */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-[var(--border-card)] bg-[var(--surface-input)] text-[var(--accent-cyan)] focus:ring-0"
                  />
                  <span>{isRTL ? 'تذكر جهازي' : 'Remember this device'}</span>
                </label>

                <button
                  type="button"
                  className="forma-forgot-btn"
                  onClick={() => {
                    setResetOpen(true);
                    setResetSent(false);
                  }}
                >
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant={mode === 'signup' ? 'cyan' : 'primary'}
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="mt-2"
            >
              {mode === 'signin'
                ? (isRTL ? 'تسجيل الدخول إلى FORMA' : 'SIGN IN TO FORMA')
                : (isRTL ? 'إنشاء حساب وبدء التدريب' : 'CREATE ACCOUNT & START')}
            </Button>

            {/* Instant Guest Access Button */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={quickGuestLogin}
              disabled={isSubmitting}
              leftIcon={<UserCheck size={18} className="text-[var(--accent-cyan)]" />}
            >
              {isRTL ? 'دخول فوري كرياضي زائر (بدون حساب)' : 'Continue as Guest Athlete'}
            </Button>

            {/* Divider */}
            <div className="forma-divider my-2">
              <span>{isRTL ? 'أو عبر' : 'OR CONTINUE WITH'}</span>
            </div>

            {/* Social Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => socialSignIn('google')}
                disabled={isSubmitting}
                leftIcon={<span style={{ color: '#bef264', fontWeight: 900 }}>G</span>}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => socialSignIn('apple')}
                disabled={isSubmitting}
                leftIcon={<Apple size={16} />}
              >
                Apple
              </Button>
            </div>
          </form>
        </section>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetOpen && (
          <motion.div
            className="forma-reset-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
          >
            <motion.form
              className="forma-reset-modal"
              onSubmit={sendReset}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                className="forma-modal-close"
                type="button"
                aria-label="Close"
                onClick={() => setResetOpen(false)}
              >
                <X size={18} />
              </button>
              <div className="forma-reset-icon">
                <KeyRound size={26} />
              </div>
              <h3 className="forma-reset-title">
                {isRTL ? 'استعادة كلمة المرور' : 'RESET YOUR PASSWORD'}
              </h3>
              <p className="forma-reset-desc">
                {resetSent
                  ? (isRTL ? 'تفقد بريدك الإلكتروني للحصول على رابط الاستعادة.' : 'Check your inbox for the recovery link.')
                  : (isRTL
                      ? `سنرسل تعليمات الاستعادة إلى ${email || 'بريدك الإلكتروني'}.`
                      : `We'll send recovery instructions to ${email || 'your email address'}.`)}
              </p>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={resetSent}
              >
                {resetSent
                  ? (isRTL ? 'تم الإرسال بنجاح' : 'EMAIL SENT')
                  : (isRTL ? 'إرسال رابط الاستعادة' : 'SEND RESET LINK')}
              </Button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
