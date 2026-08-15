import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function formatDisplayUsername(username) {
  return username.trim();
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.error('Auth load timed out');
        setProfile(null);
        setAuthLoading(false);
      }
    }, 3000);

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!isMounted) return;

        setFirebaseUser(user);

        if (!user) {
          setProfile(null);
          setAuthLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth state error:', error);
        setProfile(null);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsub();
    };
  }, []);

  const signUp = async ({ email, password, username }) => {
    const cleanUsername = normalizeUsername(username);
    const displayUsername = formatDisplayUsername(username);

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    const userData = {
      uid: user.uid,
      email: user.email,
      username: cleanUsername,
      displayUsername,
      blockedUsers: [],
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    setProfile({
      ...userData,
      createdAt: new Date().toISOString(),
    });
  };

  const logIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('No signed-in user found.');
    }

    console.error('DELETE STEP 1: current user uid =', currentUser.uid);

    try {
      console.error('DELETE STEP 2: deleting Firestore user doc...');
      await deleteDoc(doc(db, 'users', currentUser.uid));
      console.error('DELETE STEP 3: Firestore user doc deleted');
    } catch (firestoreError) {
      console.error('DELETE FIRESTORE ERROR FULL:', firestoreError);
      console.error('DELETE FIRESTORE ERROR CODE:', firestoreError?.code);
      console.error('DELETE FIRESTORE ERROR MESSAGE:', firestoreError?.message);
      throw firestoreError;
    }

    try {
      console.error('DELETE STEP 4: deleting Firebase Auth user...');
      await deleteUser(currentUser);
      console.error('DELETE STEP 5: Firebase Auth user deleted');
    } catch (authError) {
      console.error('DELETE AUTH ERROR FULL:', authError);
      console.error('DELETE AUTH ERROR CODE:', authError?.code);
      console.error('DELETE AUTH ERROR MESSAGE:', authError?.message);
      throw authError;
    }

    setProfile(null);
    setFirebaseUser(null);
  };

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      authLoading,
      isAuthed: !!firebaseUser,
      signUp,
      logIn,
      logOut,
      deleteAccount,
    }),
    [firebaseUser, profile, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}