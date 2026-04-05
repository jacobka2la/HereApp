import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { normalizeUsername } from '../lib/day';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      setProfile(profileSnap.exists() ? profileSnap.data() : null);
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const signUp = async ({ email, password, username }) => {
    const normalized = normalizeUsername(username);

    if (!normalized) {
      throw new Error('Use lowercase letters, numbers, and underscores only.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const usernameRef = doc(db, 'usernames', normalized);
    const usernameSnap = await getDoc(usernameRef);

    if (usernameSnap.exists()) {
      throw new Error('That username is already taken.');
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', credential.user.uid), {
      username: normalized,
      createdAt: serverTimestamp(),
    });

    await setDoc(usernameRef, {
      uid: credential.user.uid,
      username: normalized,
      createdAt: serverTimestamp(),
    });
  };

  const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logOut = () => signOut(auth);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      authLoading,
      signUp,
      logIn,
      logOut,
      isAuthed: Boolean(firebaseUser),
    }),
    [firebaseUser, profile, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
