import type { User } from 'firebase/auth';
import { auth } from './firebase';

const ADMIN_CLAIM_KEY = 'admin';

export async function isUserAdmin(user?: User | null, forceRefresh = false): Promise<boolean> {
  const target = user ?? auth?.currentUser ?? null;
  if (!target) return false;
  try {
    const token = await target.getIdTokenResult(forceRefresh);
    return token.claims[ADMIN_CLAIM_KEY] === true;
  } catch {
    return false;
  }
}

export function getCurrentUserEmail(): string {
  return auth?.currentUser?.email ?? '';
}
