import { useRef, useState } from 'react';
import { Check, ChevronRight, Clock3, Gauge, LogOut, Moon, Palette, Scale, Sparkles, Sun, User, Zap, Languages, Volume2, Smartphone, HardDrive, Download, Upload, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { UserSettings } from '../lib/api';
import { useData } from '../hooks/useData';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useTranslation } from '../lib/i18n';

const themes = [
  { id: 'dark', name: 'Obsidian', note: 'Refined dark', icon: Moon },
  { id: 'light', name: 'Cloud', note: 'Clean and bright', icon: Sun },
  { id: 'midnight', name: 'Midnight', note: 'Deep blue focus', icon: Moon },
  { id: 'neon', name: 'Neon', note: 'Electric contrast', icon: Sparkles },
  { id: 'ocean', name: 'Ocean', note: 'Cool and immersive', icon: Moon },
  { id: 'forest', name: 'Forest', note: 'Grounded and calm', icon: Sparkles },
  { id: 'sunset', name: 'Sunset', note: 'Warm afterglow', icon: Sun },
  { id: 'paper', name: 'Paper', note: 'Editorial minimal', icon: Palette },
];
const spring = { type: 'spring' as const, stiffness: 360, damping: 28 };

export function SettingsView() {
  const { data, updateSettings: saveSettings, saveSessions, saveRoutine, theme, setTheme, exportBackup, importBackup } = useData();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!data) return null;
  const settings = data.settings;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm(t('confirmImport'))) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const ok = await importBackup(content);
        if (ok) {
          setImportStatus({ type: 'success', message: t('importSuccess') });
          setTimeout(() => setImportStatus(null), 5000);
        } else {
          setImportStatus({ type: 'error', message: t('importError') });
          setTimeout(() => setImportStatus(null), 5000);
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: t('importError') });
        setTimeout(() => setImportStatus(null), 5000);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const updateSettings = async (next: Partial<UserSettings>) => {
    if (next.theme) {
      await setTheme(next.theme);
    }
    if (next.weightUnit && next.weightUnit !== settings.weightUnit) {
      const target = next.weightUnit;
      const convert = (value: number, unit: string) => unit === target ? value : Math.round(value * (target === 'kg' ? .453592 : 2.20462) * 10) / 10;
      
      const updatedSessions = data.sessions.map(session => ({
        ...session,
        exercises: (session.exercises || []).map(exercise => ({
          ...exercise,
          sets: (exercise.sets || []).map(set => ({
            ...set,
            unit: target,
            weight: convert(set.weight, set.unit || settings.weightUnit)
          }))
        }))
      }));
      await saveSessions(updatedSessions);

      await Promise.all(
        data.routines.map(routine => saveRoutine({
          ...routine,
          exercises: (routine.exercises || []).map(exercise => ({
            ...exercise,
            sets: (exercise.sets || []).map(set => ({
              ...set,
              unit: target,
              weight: convert(set.weight, set.unit || settings.weightUnit)
            }))
          }))
        }))
      );
    }
    const otherSettings = { ...next };
    delete otherSettings.theme;
    if (Object.keys(otherSettings).length > 0) {
      await saveSettings({ ...settings, ...otherSettings });
    }
  };

  const handlePfpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !data.user) return;
    if (file.size > 2 * 1024 * 1024) return alert(t('imageSizeLimitAlert'));
    const reader = new FileReader();
    reader.onloadend = () => saveSettings(settings, { ...data.user!, pfp: reader.result as string });
    reader.readAsDataURL(file);
  };

  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .38 }} className="page-surface settings-page">
    <header className="settings-hero">
      <div><span className="eyebrow"><span className="eyebrow-dot" /> {t('personalizeMyGym')}</span><h1>{t('settingsTitle')}</h1><p>{t('settingsSubtitle')}</p></div>
      <div className="settings-status"><span className="status-pulse" /> {t('syncedLocally')}</div>
    </header>

    <section className="settings-profile card">
      <label className="profile-avatar" title={t('updatePhoto')}><input type="file" accept="image/*" onChange={handlePfpChange} />{data.user?.pfp ? <img src={data.user.pfp} alt="Profile" /> : <span>{data.user?.name?.slice(0, 2).toUpperCase() || 'G'}</span>}<i>+</i></label>
      <div className="profile-copy"><span className="section-label">{t('yourAccount')}</span><h2>{data.user?.name || t('guestAthlete')}</h2><p>{data.user?.email || t('guestEmailNote')}</p></div>
      <button className="subtle-action" onClick={() => document.querySelector<HTMLInputElement>('.profile-avatar input')?.click()}>{t('updatePhoto')} <ChevronRight size={16} /></button>
    </section>

    <section className="settings-section"><div className="settings-section-title"><Palette size={18} /><div><span className="section-label">{t('appearance')}</span><h2>{t('chooseAtmosphere')}</h2></div></div>
      <div className="theme-grid">{themes.map((tItem, index) => { const Icon = tItem.icon; const selected = (theme || settings.theme) === tItem.id; return <motion.button type="button" key={tItem.id} className={`theme-choice ${tItem.id} ${selected ? 'selected' : ''}`} onClick={() => setTheme(tItem.id)} whileTap={{ scale: .97 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05, ...spring }}><span className="theme-preview"><i /><i /><i /></span><span className="theme-label"><Icon size={15} /> <strong>{tItem.name}</strong>{selected && <Check size={15} />}</span><small>{tItem.note}</small></motion.button>})}</div>
    </section>

    <section className="settings-section"><div className="settings-section-title"><Gauge size={18} /><div><span className="section-label">{t('trainingPreferences')}</span><h2>{t('fitAppToRhythm')}</h2></div></div>
      <div className="settings-list card">
        <SettingRow icon={<Languages size={19} />} title={t('languageTitle')} detail={t('languageDetail')}>
          <div className="segmented">
            <button 
              className={(settings.language || language) === 'ar' ? 'active' : ''} 
              onClick={async () => {
                await setLanguage('ar');
                await updateSettings({ language: 'ar' });
              }}
            >
              {t('arabic')}
            </button>
            <button 
              className={(settings.language || language) === 'en' ? 'active' : ''} 
              onClick={async () => {
                await setLanguage('en');
                await updateSettings({ language: 'en' });
              }}
            >
              {t('english')}
            </button>
          </div>
        </SettingRow>
        <SettingRow icon={<Scale size={19} />} title={t('weightUnitTitle')} detail={t('weightUnitDetail')}><div className="segmented"><button className={settings.weightUnit === 'kg' ? 'active' : ''} onClick={() => updateSettings({ weightUnit: 'kg' })}>kg</button><button className={settings.weightUnit === 'lb' ? 'active' : ''} onClick={() => updateSettings({ weightUnit: 'lb' })}>lb</button></div></SettingRow>
        <SettingRow icon={<Clock3 size={19} />} title={t('restTimerTitle')} detail={t('restTimerDetail')}><select value={settings.restTimerSeconds || 90} onChange={e => updateSettings({ restTimerSeconds: Number(e.target.value) })}><option value="60">60 {t('secondsWord')}</option><option value="90">90 {t('secondsWord')}</option><option value="120">2 {t('minutes')}</option><option value="180">3 {t('minutes')}</option></select></SettingRow>
        <SettingRow icon={<Volume2 size={19} />} title={t('restSoundAlertsTitle')} detail={t('restSoundAlertsDetail')}>
          <div className="segmented">
            <button 
              className={settings.soundAlerts !== false ? 'active' : ''} 
              onClick={() => updateSettings({ soundAlerts: true })}
            >
              {t('on')}
            </button>
            <button 
              className={settings.soundAlerts === false ? 'active' : ''} 
              onClick={() => updateSettings({ soundAlerts: false })}
            >
              {t('off')}
            </button>
          </div>
        </SettingRow>
        <SettingRow icon={<Smartphone size={19} />} title={t('restVibrationAlertsTitle')} detail={t('restVibrationAlertsDetail')}>
          <div className="segmented">
            <button 
              className={settings.vibrationAlerts !== false ? 'active' : ''} 
              onClick={() => updateSettings({ vibrationAlerts: true })}
            >
              {t('on')}
            </button>
            <button 
              className={settings.vibrationAlerts === false ? 'active' : ''} 
              onClick={() => updateSettings({ vibrationAlerts: false })}
            >
              {t('off')}
            </button>
          </div>
        </SettingRow>
        <SettingRow icon={<Zap size={19} />} title={t('motionTitle')} detail={t('motionDetail')}><div className="segmented"><button className={(settings.motion || 'full') === 'full' ? 'active' : ''} onClick={() => updateSettings({ motion: 'full' })}>{t('motionFull')}</button><button className={settings.motion === 'reduced' ? 'active' : ''} onClick={() => updateSettings({ motion: 'reduced' })}>{t('motionReduced')}</button></div></SettingRow>
        <SettingRow icon={<CalendarGlyph />} title={t('weekStartsTitle')} detail={t('weekStartsDetail')}><div className="segmented"><button className={(settings.weekStartsOn || 'sunday') === 'sunday' ? 'active' : ''} onClick={() => updateSettings({ weekStartsOn: 'sunday' })}>{t('sun')}</button><button className={settings.weekStartsOn === 'monday' ? 'active' : ''} onClick={() => updateSettings({ weekStartsOn: 'monday' })}>{t('mon')}</button></div></SettingRow>
      </div>
    </section>

    <section className="settings-section">
      <div className="settings-section-title">
        <HardDrive size={18} />
        <div>
          <span className="section-label">{t('dataBackupSection')}</span>
          <h2>{t('dataBackupSubtitle')}</h2>
        </div>
      </div>
      <div className="settings-list card">
        <SettingRow icon={<Download size={19} />} title={t('exportBackup')} detail={t('exportBackupDesc')}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={exportBackup}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <Download size={15} />
            <span>{t('exportBackup')}</span>
          </button>
        </SettingRow>

        <SettingRow icon={<Upload size={19} />} title={t('importBackup')} detail={t('importBackupDesc')}>
          <input 
            type="file" 
            accept=".json,application/json" 
            ref={fileInputRef} 
            onChange={handleImportFile} 
            style={{ display: 'none' }} 
          />
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <Upload size={15} />
            <span>{t('importBackup')}</span>
          </button>
        </SettingRow>
      </div>

      {importStatus && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: importStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: importStatus.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${importStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {importStatus.type === 'success' ? <CheckCircle2 size={16} /> : null}
          <span>{importStatus.message}</span>
        </div>
      )}
    </section>

    <section className="settings-section settings-danger"><div className="settings-section-title"><User size={18} /><div><span className="section-label">{t('sessionSection')}</span><h2>{t('accountControls')}</h2></div></div><div className="card danger-card"><div><strong>{t('signOut')}</strong><p>{t('signOutDesc')}</p></div><button className="danger-button" onClick={async () => { if (auth?.currentUser) localStorage.removeItem('gym_data'); if (auth) await signOut(auth); await saveSettings(settings, undefined); navigate('/today'); }}><LogOut size={16} /> {t('signOut')}</button></div></section>
  </motion.div>;
}

function CalendarGlyph() { return <span className="calendar-glyph" aria-hidden="true">□</span>; }
function SettingRow({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: string; children: ReactNode }) { return <div className="setting-row"><div className="setting-icon">{icon}</div><div className="setting-copy"><strong>{title}</strong><span>{detail}</span></div><div className="setting-control">{children}</div></div>; }
