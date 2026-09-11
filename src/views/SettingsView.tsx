import { LogOut, User, Moon, Sun, Scale } from 'lucide-react';
import { UserSettings } from '../lib/api';
import { useData } from '../hooks/useData';
import { useNavigate } from 'react-router-dom';

import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export function SettingsView() {
  const { data, updateData } = useData();
  const navigate = useNavigate();

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!data) return;
    
    let updatedData = { ...data };
    
    if (newSettings.weightUnit && newSettings.weightUnit !== data.settings.weightUnit) {
      const fromUnit = data.settings.weightUnit;
      const toUnit = newSettings.weightUnit;
      
      const convert = (val: number, currentUnit: string) => {
        if (currentUnit === 'lb' && toUnit === 'kg') return Math.round(val * 0.453592 * 10) / 10;
        if (currentUnit === 'kg' && toUnit === 'lb') return Math.round(val * 2.20462 * 10) / 10;
        return val;
      };

      updatedData.sessions = updatedData.sessions.map(s => ({
        ...s,
        exercises: s.exercises.map(e => ({
          ...e,
          sets: e.sets.map(set => ({ 
            ...set, 
            unit: toUnit,
            weight: convert(set.weight, set.unit || fromUnit)
          }))
        }))
      }));

      updatedData.routines = updatedData.routines.map(r => ({
        ...r,
        exercises: r.exercises.map(e => ({
          ...e,
          sets: e.sets.map(set => ({ 
            ...set, 
            unit: toUnit,
            weight: convert(set.weight, set.unit || fromUnit)
          }))
        }))
      }));
    }

    updatedData = {
      ...updatedData,
      settings: { ...updatedData.settings, ...newSettings }
    };
    
    await updateData(updatedData);
  };

  const handlePfpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentUser = data?.user;
    if (!file || !data || !currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await updateData({
        ...data,
        user: { 
          email: currentUser.email, 
          name: currentUser.name, 
          pfp: base64 
        }
      });
    };
    reader.readAsDataURL(file);
  };

  if (!data) return null;

  return (
    <div className="flex-col h-full" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem', fontSize: '2.5rem' }}>Settings</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage your account and app preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Account Section */}
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User className="w-5 h-5" /> Account & Privacy
          </h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: 600, overflow: 'hidden', cursor: 'pointer', position: 'relative' }} title="Change profile picture">
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePfpChange} />
                {data.user?.pfp ? (
                  <img src={data.user.pfp} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  data.user ? data.user.name.substring(0, 2).toUpperCase() : 'G'
                )}
              </label>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{data.user ? data.user.name : 'Guest'}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{data.user ? data.user.email : 'Not signed in'}</div>
              </div>
            </div>
            


            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
              <button 
                onClick={async () => {
                  // If we are logging out of a real cloud account, clear the local cache 
                  // so the next person who logs in doesn't inherit our data!
                  if (auth?.currentUser) {
                    localStorage.removeItem('gym_data');
                  }
                  if (auth) await signOut(auth);
                  await updateData({ ...data, user: undefined });
                  navigate('/today');
                }}
                className="btn-ghost" 
                style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sun className="w-5 h-5" /> Preferences
          </h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            
            {/* Theme Toggle */}
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {data.settings.theme === 'light' ? <Sun className="w-5 h-5 text-muted" /> : <Moon className="w-5 h-5 text-muted" />}
                <div>
                  <div style={{ fontWeight: 500 }}>App Theme</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose your preferred color scheme</div>
                </div>
              </div>
              <select 
                className="input" 
                style={{ width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer' }}
                value={data.settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value })}
              >
                <option value="dark">Dark (Default)</option>
                <option value="light">Light</option>
                <option value="midnight">Midnight</option>
                <option value="neon">Neon</option>
              </select>
            </div>

            {/* Weight Unit */}
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Scale className="w-5 h-5 text-muted" />
                <div>
                  <div style={{ fontWeight: 500 }}>Weight Unit</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Default unit for new sets</div>
                </div>
              </div>
              <select 
                className="input" 
                style={{ width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer' }}
                value={data.settings.weightUnit}
                onChange={(e) => updateSettings({ weightUnit: e.target.value as 'lb' | 'kg' })}
              >
                <option value="lb">Pounds (lb)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
