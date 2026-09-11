import React, { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import './LoginView.css';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password is too weak. It must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export function LoginView({ onLogin }: { onLogin: (user?: { email: string, name: string }) => void }) {
  const [isActive, setIsActive] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        setError(getFriendlyErrorMessage(err.code));
        setLoading(false);
      }
    } else {
      setLoading(false);
      onLogin({ email: email || 'guest@example.com', name: 'Guest' });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } catch (err: any) {
        setError(getFriendlyErrorMessage(err.code));
        setLoading(false);
      }
    } else {
      setLoading(false);
      const displayName = name || email.split('@')[0] || 'Guest';
      onLogin({ email: email || 'guest@example.com', name: displayName.charAt(0).toUpperCase() + displayName.slice(1) });
    }
  };

  return (
    <div className="login-wrapper">
      <div className={`container ${isActive ? 'active' : ''}`}>
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>

        {/* LOGIN FORM */}
        <div className="form-box Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 21 } as React.CSSProperties}>Login</h2>
          <form onSubmit={handleLoginSubmit}>
            {error && !isActive && <div className="error-message animation" style={{ '--D': 0, '--S': 21 } as React.CSSProperties}>{error}</div>}
            
            <div className="input-box animation" style={{ '--D': 1, '--S': 22 } as React.CSSProperties}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              <label>Email</label>
              <Mail className="icon" />
            </div>

            <div className="input-box animation" style={{ '--D': 2, '--S': 23 } as React.CSSProperties}>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              <label>Password</label>
              <Lock className="icon" />
            </div>

            <div className="input-box animation" style={{ '--D': 3, '--S': 24 } as React.CSSProperties}>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
            </div>
            
            <div className="input-box animation" style={{ '--D': 3, '--S': 24 } as React.CSSProperties}>
              <button className="btn-guest" type="button" onClick={() => onLogin()}>Continue as Guest</button>
            </div>

            <div className="regi-link animation" style={{ '--D': 4, '--S': 25 } as React.CSSProperties}>
              <p>Don't have an account? <br /> 
                 <a href="#" className="SignUpLink" onClick={(e) => { e.preventDefault(); setIsActive(true); setError(''); }}>Sign Up</a>
              </p>
            </div>
          </form>
        </div>

        {/* LOGIN INFO CONTENT */}
        <div className="info-content Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 20 } as React.CSSProperties}>WELCOME BACK!</h2>
          <p className="animation" style={{ '--D': 1, '--S': 21 } as React.CSSProperties}>Ready to crush your goals today? Let's get to work and make every set count.</p>
        </div>

        {/* REGISTER FORM */}
        <div className="form-box Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>Register</h2>
          <form onSubmit={handleRegisterSubmit}>
            {error && isActive && <div className="error-message animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>{error}</div>}
            
            <div className="input-box animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} />
              <label>Username</label>
              <User className="icon" />
            </div>

            <div className="input-box animation" style={{ '--li': 19, '--S': 2 } as React.CSSProperties}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              <label>Email</label>
              <Mail className="icon" />
            </div>

            <div className="input-box animation" style={{ '--li': 19, '--S': 3 } as React.CSSProperties}>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              <label>Password</label>
              <Lock className="icon" />
            </div>

            <div className="input-box animation" style={{ '--li': 20, '--S': 4 } as React.CSSProperties}>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Loading...' : 'Register'}</button>
            </div>
            
            <div className="input-box animation" style={{ '--li': 20, '--S': 4 } as React.CSSProperties}>
              <button className="btn-guest" type="button" onClick={() => onLogin()}>Continue as Guest</button>
            </div>

            <div className="regi-link animation" style={{ '--li': 21, '--S': 5 } as React.CSSProperties}>
              <p>Already have an account? <br /> 
                 <a href="#" className="SignInLink" onClick={(e) => { e.preventDefault(); setIsActive(false); setError(''); }}>Login</a>
              </p>
            </div>
          </form>
        </div>

        {/* REGISTER INFO CONTENT */}
        <div className="info-content Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>WELCOME!</h2>
          <p className="animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>Start your fitness journey with us. Track your workouts, smash your PRs, and build the best version of yourself.</p>
        </div>
      </div>
    </div>
  );
}
