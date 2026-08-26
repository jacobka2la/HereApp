import { useEffect, useState } from 'react';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getCurrentDayKey } from '../lib/day';

async function clearStaleCheckIn(uid) {
  if (!uid) return;

  const currentDayKey = getCurrentDayKey();
  const activeRef = doc(db, 'activeCheckins', uid);

  await runTransaction(db, async (transaction) => {
    const activeSnap = await transaction.get(activeRef);
    if (!activeSnap.exists()) return;

    const activeData = activeSnap.data();
    if (!activeData?.barId || activeData.dayKey === currentDayKey) return;

    if (activeData.checkinDocId) {
      const checkinRef = doc(db, 'checkins', activeData.checkinDocId);
      const checkinSnap = await transaction.get(checkinRef);

      if (checkinSnap.exists()) {
        transaction.set(checkinRef, {
          active: false,
          autoExpired: true,
          autoExpiredAt: serverTimestamp(),
          autoExpiredAtMillis: Date.now(),
          updatedAt: serverTimestamp(),
          updatedAtMillis: Date.now(),
        }, { merge: true });
      }
    }

    transaction.delete(activeRef);
  });
}

export default function StaleCheckinGuard({ children }) {
  const { firebaseUser } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!firebaseUser?.uid) {
      setReady(true);
      return () => { cancelled = true; };
    }

    setReady(false);

    clearStaleCheckIn(firebaseUser.uid)
      .catch((error) => {
        console.warn('Could not clear stale check-in:', error?.message || error);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => { cancelled = true; };
  }, [firebaseUser?.uid]);

  if (!ready) return null;
  return children;
}
