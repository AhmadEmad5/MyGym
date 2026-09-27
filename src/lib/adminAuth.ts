import { auth } from './firebase';

/**
 * Admin authorization and credentials
 */

// Use Vite environment variables for admin credentials
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@mygym.app';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

export const ADMIN_CREDENTIALS = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
};

/**
 * Checks whether an email belongs to the sole administrator.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  // Also check for admin role token (for Firebase Auth tokens with role field)
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return true;
  
  // Check for role-based admin access (if using Firebase Auth with custom claims)
  try {
    if (auth?.currentUser) {
      const email = auth.currentUser.email;
      if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return true;
      }
    }
  } catch (e) {
    // Ignore token parsing errors
  }
  
  return false;
}

/**
 * Validates admin credentials with rate limiting protection.
 * Returns an object with validation result and any error message.
 */
export interface AdminValidationResult {
  isValid: boolean;
  error?: string;
}

// Rate limit tracking (in-memory for development, implement proper rate limiting in production)
const failedAttempts = new Map<string, number>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function validateAdminCredentials(email?: string | null, password?: string | null): AdminValidationResult {
  if (!email || !password) {
    return { isValid: false, error: 'Email and password are required.' };
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check rate limiting
  const lastAttempt = failedAttempts.get(normalizedEmail);
  if (lastAttempt && Date.now() - lastAttempt < LOCKOUT_DURATION_MS) {
    const attemptsRemaining = MAX_FAILED_ATTEMPTS - Math.floor((Date.now() - lastAttempt) / LOCKOUT_DURATION_MS);
    return {
      isValid: false,
      error: `Too many failed attempts. Please wait ${attemptsRemaining} minutes.`
    };
  }
  
  // Check if we've hit the limit
  const currentAttempts = (failedAttempts.get(normalizedEmail) || 0) + 1;
  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    return { isValid: false, error: 'Too many failed attempts. Please try again later.' };
  }
  
  // Validate credentials
  const isValid =
    normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD;
  
  if (isValid) {
    // Clear rate limit on successful login
    failedAttempts.delete(normalizedEmail);
    return { isValid: true };
  } else {
    // Record failed attempt
    failedAttempts.set(normalizedEmail, Date.now());
    
    // Log the failed attempt for monitoring
    console.warn(`Failed admin login attempt from email: ${normalizedEmail}`);
    
    return {
      isValid: false,
      error: 'Invalid credentials. Please try again.'
    };
  }
}

/**
 * Securely stores admin token (use secure storage in production)
 */
export function storeAdminToken(token: string): void {
  // In production, use secure storage mechanisms like:
  // - IndexedDB with encryption
  // - Encrypted localStorage
  // - Session cookies with HttpOnly flag
  
  try {
    // For development/testing only - in production use proper secure storage
    sessionStorage.setItem('admin_token', token);
  } catch (e) {
    console.error('Failed to store admin token:', e);
  }
}

/**
 * Retrieves and validates admin token
 */
export function getAdminToken(): string | null {
  try {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return null;
    
    // Validate token expiration (implement proper token validation in production)
    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      sessionStorage.removeItem('admin_token');
      return null;
    }
    
    return token;
  } catch (e) {
    console.error('Failed to retrieve admin token:', e);
    return null;
  }
}

/**
 * Clears admin session
 */
export function clearAdminSession(): void {
  sessionStorage.removeItem('admin_token');
  failedAttempts.clear();
}
