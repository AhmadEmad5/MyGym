import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { isUserAdmin } from './adminAuth';

export function useAdminStatus() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [isAdmin, setIsAdmin] = useState(false);
  const resolvedUid = useRef<string | null>(null);

  const refresh = useCallback(async (forceRefresh = false) => {
    const admin = await isUserAdmin(null, forceRefresh);
    setIsAdmin(admin);
    return admin;
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      const uid = nextUser?.uid ?? null;
      if (uid === resolvedUid.current) return;
      resolvedUid.current = uid;
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      void isUserAdmin(nextUser, true).then((admin) => {
        if (resolvedUid.current === uid) setIsAdmin(admin);
      });
    });
    return unsubscribe;
  }, []);

  return { user, email: user?.email ?? '', isAdmin, refresh };
}
