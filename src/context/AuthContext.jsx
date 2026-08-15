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
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { avatars } from '../lib/avatars';

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function formatDisplayUsername(username) {
  return username.trim();
}

function buildPublicProfile(userData) {
  return {
    uid: userData.uid,
    username: userData.username,
    displayUsername: userData.displayUsername || userData.username,
    displayUsernameLower: (userData.displayUsername || userData.username || '').toLowerCase(),
    avatarId: userData.avatarId || null,
    updatedAt: serverTimestamp(),
  };
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
          const userData = userSnap.data();
          setProfile(userData);

          await setDoc(
            doc(db, 'publicProfiles', user.uid),
            buildPublicProfile(userData),
            { merge: true }
          );
        } else {
          setProfile(null);
        }
      } catch {
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
      displayUsernameLower: displayUsername.toLowerCase(),
      avatarId: null,
      blockedUsers: [],
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    await setDoc(doc(db, 'publicProfiles', user.uid), buildPublicProfile(userData));

    setProfile({
      ...userData,
      createdAt: new Date().toISOString(),
    });
  };

  const setAvatarOnce = async (avatarId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('NOT_AUTHENTICATED');
    if (!avatars.some((avatar) => avatar.id === avatarId)) throw new Error('INVALID_AVATAR');

    const userRef = doc(db, 'users', currentUser.uid);
    const publicRef = doc(db, 'publicProfiles', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) throw new Error('PROFILE_NOT_FOUND');

    const currentData = userSnap.data();
    if (currentData.avatarId) {
      setProfile(currentData);
      throw new Error('AVATAR_ALREADY_SET');
    }

    const batch = writeBatch(db);
    batch.set(userRef, {
      avatarId,
      avatarSelectedAt: serverTimestamp(),
    }, { merge: true });
    batch.set(publicRef, {
      avatarId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await batch.commit();

    setProfile((current) => ({
      ...(current || currentData),
      avatarId,
    }));
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

    await deleteDoc(doc(db, 'publicProfiles', currentUser.uid));
    await deleteDoc(doc(db, 'users', currentUser.uid));
    await deleteUser(currentUser);

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
      setAvatarOnce,
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
