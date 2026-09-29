import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eraser,
  Gauge,
  HardDrive,
  Languages,
  LogOut,
  Moon,
  Palette,
  Rows3,
  Scale,
  Shield,
  Sparkles,
  Sun,
  Type,
  Upload,
  User,
  Volume2,
  Waves,
  Wifi
} from 'lucide-react';
import type { UserSettings } from '../lib/api';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { useAdminStatus } from '../lib/useAdminStatus';
import { notify } from '../lib/feedback';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  testWorkoutReminderNotification
} from '../lib/notifications';
import { Button, SegmentedControl } from '../components/ui';
import { InlineSaveStatus } from '../components/primitives/InlineSaveStatus';
import { OnboardingTour } from '../components/OnboardingTour';
import { validateClientFile, ALLOWED_IMAGE_MIME_TYPES } from '../lib/fileValidation';
import type { SaveState } from '../types/ui';

const MAX_PFP_UPLOAD_BYTES = 2 * 1024 * 1024;

type ThemeId = 'dark' | 'light' | 'midnight' | 'neon' | 'ocean' | 'forest' | 'sunset' | 'paper';

type ThemeDefinition = {
  id: ThemeId;
  name: string;
  note: string;
  surface: string;
  panel: string;
  accent: string;
  dark: boolean;
};

const THEMES: ThemeDefinition[] = [
  { id: 'dark', name: 'Obsidian', note: 'Refined dark', surface: '#0b1020', panel: '#1d2944', accent: '#62e4ff', dark: true },
  { id: 'light', name: 'Cloud', note: 'Clean and bright', surface: '#edf5ff', panel: '#d2e0f0', accent: '#0284c7', dark: false },
  { id: 'midnight', name: 'Midnight', note: 'Deep blue focus', surface: '#071834', panel: '#123a7a', accent: '#60a5fa', dark: true },
  { id: 'neon', name: 'Neon', note: 'Electric contrast', surface: '#1b1422', panel: '#6f286e', accent: '#f472b6', dark: true },
  { id: 'ocean', name: 'Ocean', note: 'Cool and immersive', surface: '#063243', panel: '#0e6378', accent: '#4ce4e7', dark: true },
  { id: 'forest', name: 'Forest', note: 'Grounded and calm', surface: '#112b19', panel: '#376a42', accent: '#b9e875', dark: true },
  { id: 'sunset', name: 'Sunset', note: 'Warm afterglow', surface: '#3a1a2a', panel: '#914653', accent: '#ffbc67', dark: true },
  { id: 'paper', name: 'Paper', note: 'Editorial minimal', surface: '#fbf5ec', panel: '#d7c9b9', accent: '#aa5546', dark: false }
];

type SectionId = 'account' | 'appearance' | 'training' | 'comfort' | 'reminders' | 'data' | 'danger';

type ConfirmConfig = {
  title: string;
  description: string;
  bullets?: string[];
  confirmLabel: string;
  phraseLabel?: string;
  phraseHint?: string;
  onConfirm: () => void | Promise<void>;
};

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
};

export function SettingsView() {
  const { data, updateSettings: saveSettings, saveSessions, saveRoutine, theme, setTheme, exportBackup, importBackup, signOutUser } = useData();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const baseId = useId().replace(/:/g, '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const saveTimers = useRef<Map<string, number>>(new Map());

  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('account');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [notifPermission, setNotifPermission] = useState(getNotificationPermissionStatus());
  const [testSent, setTestSent] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const { isAdmin } = useAdminStatus();

  useEffect(
    () => () => {
      saveTimers.current.forEach((timer) => window.clearTimeout(timer));
      saveTimers.current.clear();
    },
    []
  );

  const settings = data?.settings;
  const activeTheme = (theme || settings?.theme || 'dark') as ThemeId;

  const setRowState = useCallback((rowId: string, next: SaveState) => {
    setSaveState((current) => ({ ...current, [rowId]: next }));
    const existing = saveTimers.current.get(rowId);
    if (existing) window.clearTimeout(existing);
    if (next === 'saved' || next === 'error') {
      saveTimers.current.set(
        rowId,
        window.setTimeout(() => {
          setSaveState((current) => {
            const clone = { ...current };
            delete clone[rowId];
            return clone;
          });
          saveTimers.current.delete(rowId);
        }, 2400)
      );
    }
  }, []);

  const persist = useCallback(
    async (rowId: string, next: Partial<UserSettings>) => {
      if (!data || !settings) return;
      setRowState(rowId, 'saving');
      try {
        if (next.theme) await setTheme(next.theme);

        if (next.weightUnit && next.weightUnit !== settings.weightUnit) {
          const target = next.weightUnit;
          const convert = (value: number, unit: string) =>
            unit === target ? value : Math.round(value * (target === 'kg' ? 0.453592 : 2.20462) * 10) / 10;

          const updatedSessions = data.sessions.map((session) => ({
            ...session,
            exercises: (session.exercises || []).map((exercise) => ({
              ...exercise,
              sets: (exercise.sets || []).map((set) => ({
                ...set,
                unit: target,
                weight: convert(set.weight, set.unit || settings.weightUnit)
              }))
            }))
          }));
          await saveSessions(updatedSessions);
          await Promise.all(
            data.routines.map((routine) =>
              saveRoutine({
                ...routine,
                exercises: (routine.exercises || []).map((exercise) => ({
                  ...exercise,
                  sets: (exercise.sets || []).map((set) => ({
                    ...set,
                    unit: target,
                    weight: convert(set.weight, set.unit || settings.weightUnit)
                  }))
                }))
              })
            )
          );
        }

        const patch = { ...next };
        delete patch.theme;
        delete patch.language;
        if (Object.keys(patch).length > 0) {
          await saveSettings({ ...settings, ...patch });
        }
        setRowState(rowId, 'saved');
      } catch {
        setRowState(rowId, 'error');
      }
    },
    [data, saveRoutine, saveSessions, saveSettings, setRowState, setTheme, settings]
  );

  const changeLanguage = useCallback(
    async (rowId: string, next: 'en' | 'ar') => {
      if (next === language) return;
      setRowState(rowId, 'saving');
      try {
        await setLanguage(next);
        if (settings) await saveSettings({ ...settings, language: next });
        setRowState(rowId, 'saved');
      } catch {
        setRowState(rowId, 'error');
      }
    },
    [language, saveSettings, setLanguage, setRowState, settings]
  );

  const chooseTheme = useCallback(
    async (rowId: string, next: ThemeId) => {
      if (next === activeTheme) return;
      setRowState(rowId, 'saving');
      try {
        await setTheme(next);
        setRowState(rowId, 'saved');
      } catch {
        setRowState(rowId, 'error');
      }
    },
    [activeTheme, setRowState, setTheme]
  );

  const sections = useMemo(
    () => [
      { id: 'account' as SectionId, icon: User, label: t('yourAccount') },
      { id: 'appearance' as SectionId, icon: Palette, label: t('appearance') },
      { id: 'training' as SectionId, icon: Gauge, label: t('trainingPreferences') },
      { id: 'comfort' as SectionId, icon: Sun, label: t('ergonomicsSection') },
      { id: 'reminders' as SectionId, icon: Bell, label: t('workoutReminders') },
      { id: 'data' as SectionId, icon: HardDrive, label: t('dataBackupSection') },
      { id: 'danger' as SectionId, icon: Shield, label: t('accountControls') }
    ],
    [t]
  );

  useEffect(() => {
    if (!isDesktop) return;
    const nodes = sections
      .map((section) => document.getElementById(`${baseId}-${section.id}`))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.id.replace(`${baseId}-`, '') as SectionId;
        setActiveSection(id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.3, 0.6] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [baseId, isDesktop, sections]);

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    if (!isDesktop) {
      setExpandedSection((current) => (current === id ? null : id));
      return;
    }
    document.getElementById(`${baseId}-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/today');
      notify(isRTL ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.', 'info');
    } catch (error) {
      console.error('Sign out error:', error);
      notify(isRTL ? 'تعذر تسجيل الخروج. حاول مرة أخرى.' : 'Could not sign out. Please try again.', 'error');
    }
  };

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const runImport = async () => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const ok = await importBackup(evt.target?.result as string);
          setImportStatus({ type: ok ? 'success' : 'error', message: ok ? t('importSuccess') : t('importError') });
        } catch {
          setImportStatus({ type: 'error', message: t('importError') });
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    };
    setConfirm({
      title: t('importBackup'),
      description: t('confirmImport'),
      confirmLabel: t('apply'),
      onConfirm: runImport
    });
  };

  const handlePfpChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !data?.user || !settings) return;
    const validation = validateClientFile(file, {
      maxSizeBytes: MAX_PFP_UPLOAD_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES
    });
    if (!validation.valid) {
      notify(
        file.size > MAX_PFP_UPLOAD_BYTES ? t('imageSizeLimitAlert') : (validation.error ?? t('imageSizeLimitAlert')),
        'warning'
      );
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    setRowState('photo', 'saving');
    reader.onloadend = () => {
      void saveSettings(settings, { ...data.user!, pfp: reader.result as string })
        .then(() => setRowState('photo', 'saved'))
        .catch(() => setRowState('photo', 'error'));
    };
    reader.readAsDataURL(file);
  };

  if (!data || !settings) return null;

  const rowId = (key: string) => `${baseId}-${key}`;

  const sectionBlock = (id: SectionId, children: ReactNode) => {
    const section = sections.find((item) => item.id === id);
    if (!section) return null;
    const Icon = section.icon;
    const headingId = `${baseId}-${id}-heading`;
    const panelId = `${baseId}-${id}-panel`;
    const open = isDesktop || expandedSection === id;

    return (
      <section id={`${baseId}-${id}`} className="scroll-mt-28" aria-labelledby={headingId}>
        {isDesktop ? (
          <>
            <div className="settings-section-title">
              <Icon size={18} aria-hidden="true" />
              <h2 id={headingId}>{section.label}</h2>
            </div>
            <div>{children}</div>
          </>
        ) : (
          <>
            <h2 id={headingId} className="sr-only">
              {section.label}
            </h2>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--premium-line)] bg-[var(--premium-surface)] px-4 py-3.5"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => {
                setActiveSection(id);
                setExpandedSection((current) => (current === id ? null : id));
              }}
            >
              <span className="flex items-center gap-2.5 text-[0.95rem] font-bold text-[var(--text-primary)]">
                <Icon size={17} className="text-[var(--accent-primary)]" aria-hidden="true" />
                {section.label}
              </span>
              <ChevronDown
                size={17}
                aria-hidden="true"
                className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            <div id={panelId} className={open ? 'mt-4' : 'mt-4 hidden'}>
              {children}
            </div>
          </>
        )}
      </section>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34 }}
      className="zen-page-container settings-page"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <header className="settings-hero">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> {t('personalizeForma')}
          </span>
          <h1>{t('settingsTitle')}</h1>
          <p>{t('settingsSubtitle')}</p>
        </div>
        <div className="settings-status">
          <span className="status-pulse" aria-hidden="true" /> {t('syncedLocally')}
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-start">
        <nav aria-label={t('navSettings')} className="hidden lg:sticky lg:top-24 lg:block">
          <ul className="flex flex-col gap-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const current = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-current={current ? 'true' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start text-[0.86rem] font-bold transition-colors ${
                      current
                        ? 'border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--text-primary)]'
                        : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--premium-soft)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-9">
          {sectionBlock(
            'account',
            <div className="settings-profile card">
              <label className="profile-avatar" title={t('updatePhoto')}>
                <input
                  ref={pfpInputRef}
                  type="file"
                  accept="image/*"
                  aria-label={t('updatePhoto')}
                  onChange={handlePfpChange}
                />
                {data.user?.pfp ? (
                  <img src={data.user.pfp} alt="" />
                ) : (
                  <span>{data.user?.name?.slice(0, 2).toUpperCase() || 'G'}</span>
                )}
                <i aria-hidden="true">+</i>
              </label>
              <div className="profile-copy">
                <span className="section-label">{t('yourAccount')}</span>
                <h2>{data.user?.name || t('guestAthlete')}</h2>
                <p>{data.user?.email || t('guestEmailNote')}</p>
              </div>
              <div className="flex items-center gap-3">
                <InlineSaveStatus
                  state={saveState.photo ?? 'idle'}
                  savingLabel={isRTL ? 'جارٍ الحفظ' : 'Saving'}
                  savedLabel={isRTL ? 'تم الحفظ' : 'Saved'}
                  errorLabel={isRTL ? 'أعد المحاولة' : 'Try again'}
                />
                <button type="button" className="subtle-action" onClick={() => pfpInputRef.current?.click()}>
                  {t('updatePhoto')}
                </button>
              </div>
            </div>
          )}

          {sectionBlock(
            'appearance',
            <AppearanceSection
              settings={settings}
              t={t}
              isRTL={isRTL}
              activeTheme={activeTheme}
              chooseTheme={chooseTheme}
              saveState={saveState}
              rowId={rowId}
              persist={persist}
            />
          )}

          {sectionBlock(
            'training',
            <TrainingSection
              settings={settings}
              t={t}
              isRTL={isRTL}
              language={language}
              changeLanguage={changeLanguage}
              saveState={saveState}
              rowId={rowId}
              persist={persist}
            />
          )}

          {sectionBlock(
            'comfort',
            <ComfortSection settings={settings} t={t} isRTL={isRTL} saveState={saveState} rowId={rowId} persist={persist} />
          )}

          {sectionBlock(
            'reminders',
            <ReminderSection
              settings={settings}
              t={t}
              isRTL={isRTL}
              saveState={saveState}
              rowId={rowId}
              persist={persist}
              permission={notifPermission}
              onRequestPermission={async () => setNotifPermission((await requestNotificationPermission()) ? 'granted' : 'denied')}
              testSent={testSent}
              onTest={() => {
                testWorkoutReminderNotification(isRTL);
                setTestSent(true);
                window.setTimeout(() => setTestSent(false), 3500);
              }}
            />
          )}

          {sectionBlock(
            'data',
            <DataSection
              t={t}
              isRTL={isRTL}
              onExport={() => {
                exportBackup();
                notify(isRTL ? 'تم تنزيل النسخة الاحتياطية.' : 'Backup downloaded.', 'success');
              }}
              onImport={() => fileInputRef.current?.click()}
              onStartTour={() => setIsOnboardingOpen(true)}
              onOpenAdmin={isAdmin ? () => navigate('/admin/dashboard') : undefined}
              importStatus={importStatus}
            />
          )}

          {sectionBlock(
            'danger',
            <DangerSection
              t={t}
              isRTL={isRTL}
              onSignOut={() =>
                setConfirm({
                  title: t('signOut'),
                  description: t('signOutDesc'),
                  confirmLabel: t('signOut'),
                  onConfirm: handleSignOut
                })
              }
              onClearData={() =>
                setConfirm({
                  title: isRTL ? 'مسح البيانات المحلية' : 'Erase local training data',
                  description: isRTL
                    ? 'يحذف هذا الإجراء نسخة البيانات المخزنة على هذا الجهاز فقط. لا يمكن التراجع عنه.'
                    : 'This removes the locally cached copy of your training data on this device. It cannot be undone.',
                  bullets: isRTL
                    ? ['يحذف التمارين والوجبات والقياسات المخزنة محلياً', 'يبقى حسابك السحابي كما هو', 'سيتم إعادة تحميل التطبيق']
                    : ['Removes cached workouts, meals, and measurements', 'Your cloud account is untouched', 'The app reloads afterwards'],
                  confirmLabel: isRTL ? 'مسح نهائي' : 'Erase everything',
                  phraseLabel: isRTL ? 'اكتب مسح للمتابعة' : 'Type ERASE to continue',
                  phraseHint: 'ERASE',
                  onConfirm: () => {
                    localStorage.removeItem('gym_data');
                    window.location.reload();
                  }
                })
              }
            />
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" aria-hidden="true" tabIndex={-1} onChange={handleImportFile} />

      <ConfirmDialog config={confirm} isRTL={isRTL} onClose={() => setConfirm(null)} />

      {isOnboardingOpen && <OnboardingTour onFinish={() => setIsOnboardingOpen(false)} />}
    </motion.div>
  );
}

type SectionProps = {
  settings: UserSettings;
  t: Copy;
  isRTL: boolean;
  saveState: Record<string, SaveState>;
  rowId: (key: string) => string;
  persist: (rowId: string, next: Partial<UserSettings>) => Promise<void>;
};

type Copy = ReturnType<typeof useTranslation>['t'];

const ON_OFF = (t: Copy) => [
  { value: 'on', label: t('on') },
  { value: 'off', label: t('off') }
];

function AppearanceSection({ settings, t, isRTL, activeTheme, chooseTheme, saveState, rowId, persist }: SectionProps & { activeTheme: ThemeId; chooseTheme: (rowId: string, id: ThemeId) => Promise<void> }) {
  const themeRowId = rowId('theme');
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[1.15rem] border border-[var(--premium-line)] p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="m-0 text-[0.95rem] font-extrabold text-[var(--text-primary)]">
              {isRTL ? 'ثيم التطبيق' : 'App theme'}
            </h3>
            <p className="m-0 mt-1 text-[0.78rem] text-[var(--text-muted)]">
              {isRTL ? 'اختر من بين 8 أجواء بصرية — ينعكس التغيير فوراً على كل الشاشات.' : 'Pick one of eight atmospheres. The change applies instantly across the whole app.'}
            </p>
          </div>
          <InlineSaveStatus state={saveState.theme ?? 'idle'} savingLabel={isRTL ? 'جارٍ التطبيق' : 'Applying'} savedLabel={isRTL ? 'تم' : 'Applied'} errorLabel={isRTL ? 'أعد المحاولة' : 'Try again'} />
        </div>
        <div role="radiogroup" aria-labelledby={`${themeRowId}-label`} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {THEMES.map((option) => {
            const selected = activeTheme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => void chooseTheme(themeRowId, option.id)}
                className={`group flex flex-col items-stretch gap-2 rounded-[0.9rem] border p-2 text-start transition-all ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_22%,transparent)]'
                    : 'border-[var(--premium-line)] hover:border-[var(--accent-primary)]'
                }`}
              >
                <span
                  className="flex h-14 flex-col justify-between rounded-[0.65rem] p-2"
                  style={{ background: option.surface, border: `1px solid ${option.panel}` }}
                  aria-hidden="true"
                >
                  <span className="flex gap-1">
                    <i className="h-1.5 flex-1 rounded-full" style={{ background: option.accent }} />
                    <i className="h-1.5 w-6 rounded-full" style={{ background: option.panel }} />
                  </span>
                  <i className="block h-6 w-full rounded-[0.35rem]" style={{ background: option.panel }} />
                  <i className="block h-2 w-3/5 rounded-full" style={{ background: option.accent, opacity: 0.7 }} />
                </span>
                <span className="flex items-center gap-1.5 px-0.5">
                  {option.dark ? <Moon size={13} className="text-[var(--text-muted)]" aria-hidden="true" /> : <Sun size={13} className="text-[var(--text-muted)]" aria-hidden="true" />}
                  <strong className="truncate text-[0.78rem] text-[var(--text-primary)]">{option.name}</strong>
                  {selected && <Check size={14} className="ms-auto text-[var(--accent-primary)]" aria-hidden="true" />}
                </span>
                <small className="truncate px-0.5 text-[0.66rem] text-[var(--text-muted)]">{option.note}</small>
              </button>
            );
          })}
        </div>
        <span id={`${themeRowId}-label`} className="sr-only">
          {isRTL ? 'ثيم التطبيق' : 'App theme'}
        </span>
      </div>

      <div className="settings-list card">
        <ChoiceRow
          id={rowId('fontScale')}
          icon={<Type size={19} aria-hidden="true" />}
          title={isRTL ? 'حجم النص' : 'Text size'}
          detail={isRTL ? 'تكبير النص في جميع الشاشات.' : 'Increase text across every screen.'}
          value={settings.fontScale || 'default'}
          onChange={(value) => void persist(rowId('fontScale'), { fontScale: value as 'default' | 'large' })}
          options={[
            { value: 'default', label: isRTL ? 'عادي' : 'Default' },
            { value: 'large', label: isRTL ? 'كبير' : 'Large' }
          ]}
          saveState={saveState.fontScale}
          isRTL={isRTL}
        />
        <ChoiceRow
          id={rowId('contrast')}
          icon={<Waves size={19} aria-hidden="true" />}
          title={isRTL ? 'تباين أعلى' : 'High contrast'}
          detail={isRTL ? 'ألوان وحدود أوضح لقراءة أسهل.' : 'Stronger colors and borders for easier reading.'}
          value={settings.highContrast ? 'on' : 'off'}
          onChange={(value) => void persist(rowId('contrast'), { highContrast: value === 'on' })}
          options={ON_OFF(t)}
          saveState={saveState.contrast}
          isRTL={isRTL}
        />
        <ChoiceRow
          id={rowId('density')}
          icon={<Rows3 size={19} aria-hidden="true" />}
          title={isRTL ? 'كثافة العرض' : 'Layout density'}
          detail={isRTL ? 'مضغوط يعرض صفحات أكثر دون تمرير مطوّل.' : 'Compact fits more rows on screen with less scrolling.'}
          value={settings.density || 'comfortable'}
          onChange={(value) => void persist(rowId('density'), { density: value as 'comfortable' | 'compact' })}
          options={[
            { value: 'comfortable', label: isRTL ? 'مريحة' : 'Comfortable' },
            { value: 'compact', label: isRTL ? 'مكثفة' : 'Compact' }
          ]}
          saveState={saveState.density}
          isRTL={isRTL}
        />
        <ChoiceRow
          id={rowId('motion')}
          icon={<Sparkles size={19} aria-hidden="true" />}
          title={t('motionTitle')}
          detail={t('motionDetail')}
          value={settings.motion || 'full'}
          onChange={(value) => void persist(rowId('motion'), { motion: value as 'full' | 'reduced' })}
          options={[
            { value: 'full', label: t('motionFull') },
            { value: 'reduced', label: t('motionReduced') }
          ]}
          saveState={saveState.motion}
          isRTL={isRTL}
        />
      </div>
    </div>
  );
}

function TrainingSection({ settings, t, isRTL, language, changeLanguage, saveState, rowId, persist }: SectionProps & { language: 'en' | 'ar'; changeLanguage: (rowId: string, next: 'en' | 'ar') => Promise<void> }) {
  return (
    <div className="settings-list card">
      <ChoiceRow
        id={rowId('language')}
        icon={<Languages size={19} aria-hidden="true" />}
        title={t('languageTitle')}
        detail={t('languageDetail')}
        value={settings.language || language}
        onChange={(value) => void changeLanguage(rowId('language'), value as 'en' | 'ar')}
        options={[
          { value: 'en', label: t('english') },
          { value: 'ar', label: t('arabic') }
        ]}
        saveState={saveState.language}
        isRTL={isRTL}
      />
      <ChoiceRow
        id={rowId('weightUnit')}
        icon={<Scale size={19} aria-hidden="true" />}
        title={t('weightUnitTitle')}
        detail={t('weightUnitDetail')}
        value={settings.weightUnit}
        onChange={(value) => void persist(rowId('weightUnit'), { weightUnit: value as 'kg' | 'lb' })}
        options={[
          { value: 'kg', label: 'kg' },
          { value: 'lb', label: 'lb' }
        ]}
        saveState={saveState.weightUnit}
        isRTL={isRTL}
      />

      <SettingRow id={rowId('restTimer')} icon={<Clock3 size={19} aria-hidden="true" />} title={t('restTimerTitle')} detail={t('restTimerDetail')} saveState={saveState.restTimer} isRTL={isRTL} controlId={rowId('restTimer')}>
        <select
          id={rowId('restTimer')}
          aria-describedby={`${rowId('restTimer')}-detail`}
          className="min-h-[40px] rounded-[10px] border border-[var(--premium-line)] bg-[var(--bg-input)] px-3 text-[0.8rem] font-semibold text-[var(--text-primary)]"
          value={settings.restTimerSeconds || 90}
          onChange={(event) => void persist(rowId('restTimer'), { restTimerSeconds: Number(event.target.value) })}
        >
          <option value="60">60 {t('secondsWord')}</option>
          <option value="90">90 {t('secondsWord')}</option>
          <option value="120">2 {t('minutes')}</option>
          <option value="180">3 {t('minutes')}</option>
        </select>
      </SettingRow>

      <ChoiceRow
        id={rowId('soundAlerts')}
        icon={<Volume2 size={19} aria-hidden="true" />}
        title={t('restSoundAlertsTitle')}
        detail={t('restSoundAlertsDetail')}
        value={settings.soundAlerts === false ? 'off' : 'on'}
        onChange={(value) => void persist(rowId('soundAlerts'), { soundAlerts: value === 'on' })}
        options={ON_OFF(t)}
        saveState={saveState.soundAlerts}
        isRTL={isRTL}
      />
      <ChoiceRow
        id={rowId('vibrationAlerts')}
        icon={<BellRing size={19} aria-hidden="true" />}
        title={t('restVibrationAlertsTitle')}
        detail={t('restVibrationAlertsDetail')}
        value={settings.vibrationAlerts === false ? 'off' : 'on'}
        onChange={(value) => void persist(rowId('vibrationAlerts'), { vibrationAlerts: value === 'on' })}
        options={ON_OFF(t)}
        saveState={saveState.vibrationAlerts}
        isRTL={isRTL}
      />
      <ChoiceRow
        id={rowId('weekStart')}
        icon={<CalendarIcon />}
        title={t('weekStartsTitle')}
        detail={t('weekStartsDetail')}
        value={settings.weekStartsOn || 'saturday'}
        onChange={(value) => void persist(rowId('weekStart'), { weekStartsOn: value as 'saturday' | 'sunday' | 'monday' })}
        options={[
          { value: 'saturday', label: t('sat') },
          { value: 'sunday', label: t('sun') },
          { value: 'monday', label: t('mon') }
        ]}
        saveState={saveState.weekStart}
        isRTL={isRTL}
      />
    </div>
  );
}

function ComfortSection({ settings, t, isRTL, saveState, rowId, persist }: SectionProps) {
  return (
    <div className="settings-list card">
      <ChoiceRow
        id={rowId('warmTint')}
        icon={<Sun size={19} aria-hidden="true" />}
        title={t('warmTintTitle')}
        detail={t('warmTintDetail')}
        value={settings.warmTint || 'auto'}
        onChange={(value) => void persist(rowId('warmTint'), { warmTint: value as 'off' | 'auto' | 'on' })}
        options={[
          { value: 'off', label: t('warmTintOff') },
          { value: 'auto', label: t('warmTintAuto') },
          { value: 'on', label: t('warmTintOn') }
        ]}
        saveState={saveState.warmTint}
        isRTL={isRTL}
      />
      <ChoiceRow
        id={rowId('keepAwake')}
        icon={<Waves size={19} aria-hidden="true" />}
        title={t('keepScreenAwakeTitle')}
        detail={t('keepScreenAwakeDetail')}
        value={settings.keepScreenAwake === false ? 'off' : 'on'}
        onChange={(value) => void persist(rowId('keepAwake'), { keepScreenAwake: value === 'on' })}
        options={ON_OFF(t)}
        saveState={saveState.keepAwake}
        isRTL={isRTL}
      />
      <ChoiceRow
        id={rowId('autoCollapse')}
        icon={<Gauge size={19} aria-hidden="true" />}
        title={t('autoCollapseTitle')}
        detail={t('autoCollapseDetail')}
        value={settings.autoCollapseFinishedExercises === false ? 'off' : 'on'}
        onChange={(value) => void persist(rowId('autoCollapse'), { autoCollapseFinishedExercises: value === 'on' })}
        options={ON_OFF(t)}
        saveState={saveState.autoCollapse}
        isRTL={isRTL}
      />
    </div>
  );
}

function ReminderSection({ settings, t, isRTL, saveState, rowId, persist, permission, onRequestPermission, testSent, onTest }: SectionProps & { permission: string; onRequestPermission: () => Promise<void>; testSent: boolean; onTest: () => void }) {
  return (
    <div className="settings-list card">
      <ChoiceRow
        id={rowId('reminderEnabled')}
        icon={<Bell size={19} aria-hidden="true" />}
        title={t('workoutReminderTitle')}
        detail={t('workoutReminderDetail')}
        value={settings.workoutReminderEnabled === false ? 'off' : 'on'}
        onChange={(value) => void persist(rowId('reminderEnabled'), { workoutReminderEnabled: value === 'on' })}
        options={ON_OFF(t)}
        saveState={saveState.reminderEnabled}
        isRTL={isRTL}
      />

      <SettingRow id={rowId('reminderTime')} icon={<Clock3 size={19} aria-hidden="true" />} title={t('reminderTimeTitle')} detail={t('reminderTimeDetail')} saveState={saveState.reminderTime} isRTL={isRTL} controlId={rowId('reminderTime')}>
        <input
          id={rowId('reminderTime')}
          type="time"
          aria-describedby={`${rowId('reminderTime')}-detail`}
          className="min-h-[40px] rounded-[10px] border border-[var(--premium-line)] bg-[var(--bg-input)] px-3 text-[0.85rem] font-semibold text-[var(--text-primary)]"
          value={settings.workoutReminderTime || '18:00'}
          onChange={(event) => void persist(rowId('reminderTime'), { workoutReminderTime: event.target.value })}
        />
      </SettingRow>

      <SettingRow id={rowId('permission')} icon={<BellRing size={19} aria-hidden="true" />} title={t('notificationsPermission')} detail={permission === 'granted' ? t('permissionGranted') : t('enableNotifications')} saveState={saveState.permission} isRTL={isRTL}>
        <div className="flex flex-wrap items-center gap-2">
          {permission === 'granted' ? (
            <StatusChip tone="ok" label={t('permissionGranted')} />
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => void onRequestPermission()}>
              {t('enableNotifications')}
            </Button>
          )}
          <Button type="button" variant="primary" size="sm" onClick={onTest} leftIcon={<BellRing size={14} aria-hidden="true" />}>
            {testSent ? (isRTL ? 'تم الإرسال ✓' : 'Sent ✓') : t('testReminder')}
          </Button>
        </div>
      </SettingRow>
    </div>
  );
}

function DataSection({ t, isRTL, onExport, onImport, onStartTour, onOpenAdmin, importStatus }: { t: Copy; isRTL: boolean; onExport: () => void; onImport: () => void; onStartTour: () => void; onOpenAdmin?: () => void; importStatus: { type: 'success' | 'error'; message: string } | null }) {
  return (
    <div className="settings-list card">
      <SettingRow id="settings-offline" icon={<Wifi size={19} aria-hidden="true" />} title={t('offlineModeActive')} detail={t('offlineModeDesc')} isRTL={isRTL}>
        <StatusChip tone="ok" label={isRTL ? 'جاهز بدون إنترنت' : 'Ready offline'} />
      </SettingRow>

      <SettingRow id="settings-export" icon={<Download size={19} aria-hidden="true" />} title={t('exportBackup')} detail={t('exportBackupDesc')} isRTL={isRTL}>
        <Button type="button" variant="secondary" size="sm" onClick={onExport} leftIcon={<Download size={15} aria-hidden="true" />}>
          {t('exportBackup')}
        </Button>
      </SettingRow>

      <SettingRow id="settings-import" icon={<Upload size={19} aria-hidden="true" />} title={t('importBackup')} detail={t('importBackupDesc')} isRTL={isRTL}>
        <Button type="button" variant="secondary" size="sm" onClick={onImport} leftIcon={<Upload size={15} aria-hidden="true" />}>
          {t('importBackup')}
        </Button>
      </SettingRow>

      <SettingRow id="settings-tour" icon={<Sparkles size={19} aria-hidden="true" />} title={isRTL ? 'جولة شرح الميزات' : 'App features tour'} detail={isRTL ? 'جولة تفاعلية قصيرة لأهم ما في FORMA' : 'A short interactive walkthrough of the essentials'} isRTL={isRTL}>
        <Button type="button" variant="secondary" size="sm" onClick={onStartTour} leftIcon={<Sparkles size={14} aria-hidden="true" />}>
          {isRTL ? 'بدء الجولة' : 'Start tour'}
        </Button>
      </SettingRow>

      {onOpenAdmin && (
        <SettingRow id="settings-admin" icon={<Shield size={19} aria-hidden="true" />} title={isRTL ? 'لوحة تحكم المسؤول' : 'Admin dashboard'} detail={isRTL ? 'إدارة الرياضيين والتمارين والتحليلات العامة' : 'Manage athletes, workouts, and platform analytics'} isRTL={isRTL}>
          <Button type="button" variant="cyan" size="sm" onClick={onOpenAdmin}>
            {isRTL ? 'فتح' : 'Open'}
          </Button>
        </SettingRow>
      )}

      {importStatus && (
        <div className="border-t border-[var(--premium-line)] px-4 py-3">
          <StatusChip tone={importStatus.type === 'success' ? 'ok' : 'bad'} label={importStatus.message} />
        </div>
      )}
    </div>
  );
}

function DangerSection({ t, isRTL, onSignOut, onClearData }: { t: Copy; isRTL: boolean; onSignOut: () => void; onClearData: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-[12rem] flex-1">
          <strong className="block text-[0.95rem] text-[var(--text-primary)]">{t('signOut')}</strong>
          <p className="m-0 mt-1 text-[0.8rem] text-[var(--text-secondary)]">{t('signOutDesc')}</p>
        </div>
        <Button variant="danger" onClick={onSignOut} leftIcon={<LogOut size={16} aria-hidden="true" />}>
          {t('signOut')}
        </Button>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] p-5">
        <div className="min-w-[12rem] flex-1">
          <strong className="block text-[0.95rem] text-[var(--text-primary)]">{isRTL ? 'مسح البيانات المحلية' : 'Erase local training data'}</strong>
          <p className="m-0 mt-1 text-[0.8rem] text-[var(--text-secondary)]">
            {isRTL ? 'يحذف النسخة المخزنة على هذا الجهاز. لا يمكن التراجع عن هذا الإجراء.' : 'Deletes the copy cached on this device. This cannot be undone.'}
          </p>
        </div>
        <Button variant="danger" onClick={onClearData} leftIcon={<Eraser size={16} aria-hidden="true" />}>
          {isRTL ? 'مسح' : 'Erase'}
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  id,
  icon,
  title,
  detail,
  children,
  saveState,
  isRTL,
  controlId
}: {
  id: string;
  icon: ReactNode;
  title: string;
  detail: string;
  children: ReactNode;
  saveState?: SaveState;
  isRTL: boolean;
  controlId?: string;
}) {
  return (
    <div className="setting-row flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <div className="setting-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="setting-copy min-w-[11rem] flex-1">
        {controlId ? (
          <label id={`${id}-label`} htmlFor={controlId} className="block cursor-pointer text-[0.9rem] font-bold text-[var(--text-primary)]">
            {title}
          </label>
        ) : (
          <span id={`${id}-label`} className="block text-[0.9rem] font-bold text-[var(--text-primary)]">
            {title}
          </span>
        )}
        <span id={`${id}-detail`} className="mt-0.5 block text-[0.75rem] text-[var(--text-muted)]">
          {detail}
        </span>
      </div>
      <div className="ms-auto flex items-center gap-2.5">
        <InlineSaveStatus
          state={saveState ?? 'idle'}
          savingLabel={isRTL ? 'جارٍ الحفظ' : 'Saving'}
          savedLabel={isRTL ? 'تم الحفظ' : 'Saved'}
          errorLabel={isRTL ? 'أعد المحاولة' : 'Try again'}
        />
        {children}
      </div>
    </div>
  );
}

function ChoiceRow<T extends string>({
  id,
  icon,
  title,
  detail,
  value,
  options,
  onChange,
  saveState,
  isRTL
}: {
  id: string;
  icon: ReactNode;
  title: string;
  detail: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
  saveState?: SaveState;
  isRTL: boolean;
}) {
  return (
    <SettingRow id={id} icon={icon} title={title} detail={detail} saveState={saveState} isRTL={isRTL}>
      <SegmentedControl
        size="sm"
        aria-label={title}
        value={value}
        onChange={onChange}
        options={options}
      />
    </SettingRow>
  );
}

function StatusChip({ tone, label }: { tone: 'ok' | 'bad' | 'info'; label: string }) {
  const map = {
    ok: 'border-[color-mix(in_srgb,#22c55e_45%,transparent)] bg-[color-mix(in_srgb,#22c55e_14%,transparent)] text-[#16a34a]',
    bad: 'border-[color-mix(in_srgb,#ef4444_45%,transparent)] bg-[color-mix(in_srgb,#ef4444_14%,transparent)] text-[#dc2626]',
    info: 'border-[color-mix(in_srgb,var(--accent-cyan)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)] text-[var(--accent-cyan)]'
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-bold ${map}`}>
      {tone === 'ok' ? <CheckCircle2 size={13} aria-hidden="true" /> : tone === 'bad' ? <Eraser size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

function CalendarIcon() {
  return (
    <span className="calendar-glyph" aria-hidden="true">
      ▦
    </span>
  );
}

function ConfirmDialog({ config, isRTL, onClose }: { config: ConfirmConfig | null; isRTL: boolean; onClose: () => void }) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!config) return;
    setPhrase('');
    setBusy(false);
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [config]);

  const phraseReady = !config?.phraseHint || phrase.trim().toUpperCase() === config.phraseHint.toUpperCase();

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          className="fixed inset-0 z-[10060] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            dir={isRTL ? 'rtl' : 'ltr'}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="forma-confirm-title"
            aria-describedby="forma-confirm-desc"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
              }
              if (event.key !== 'Tab') return;
              const nodes = Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])') ?? []
              );
              if (nodes.length === 0) return;
              const first = nodes[0];
              const last = nodes[nodes.length - 1];
              const active = document.activeElement as HTMLElement | null;
              if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
              } else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
              }
            }}
            className="w-full max-w-md rounded-[1.25rem] border border-[var(--premium-line)] bg-[var(--premium-surface)] p-6 shadow-[var(--shadow-modal)]"
          >
            <h2 id="forma-confirm-title" className="m-0 text-[1.15rem] font-extrabold text-[var(--text-primary)]">
              {config.title}
            </h2>
            <p id="forma-confirm-desc" className="mt-2 mb-0 text-[0.86rem] leading-relaxed text-[var(--text-secondary)]">
              {config.description}
            </p>

            {config.bullets && (
              <ul className="mt-3 mb-0 flex flex-col gap-1.5 ps-5 text-[0.82rem] text-[var(--text-secondary)]">
                {config.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}

            {config.phraseHint && (
              <label className="mt-4 block text-[0.78rem] font-bold text-[var(--text-secondary)]">
                {config.phraseLabel}
                <input
                  type="text"
                  value={phrase}
                  onChange={(event) => setPhrase(event.target.value)}
                  placeholder={config.phraseHint}
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--premium-line)] bg-[var(--bg-input)] px-3 text-[0.88rem] text-[var(--text-primary)]"
                />
              </label>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                ref={confirmRef}
                type="button"
                variant="danger"
                disabled={!phraseReady || busy}
                isLoading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await config.onConfirm();
                    onClose();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {config.confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
