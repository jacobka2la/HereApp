import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentDayKey } from './day';
import { msuBars } from './bars';

export async function seedBarsIfNeeded() {
  await Promise.all(
    msuBars.map(async (bar) => {
      const ref = doc(db, 'bars', bar.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          ...bar,
          createdAt: serverTimestamp(),
        });
      }
    })
  );
}

export function subscribeToTodayCollection(collectionName, callback) {
  const dayKey = getCurrentDayKey();
  const q = query(collection(db, collectionName), where('dayKey', '==', dayKey));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAtMillis: item.data().createdAt?.toMillis?.() ?? item.data().createdAtMillis ?? Date.now(),
        checkedInAtMillis:
          item.data().checkedInAt?.toMillis?.() ?? item.data().checkedInAtMillis ?? item.data().createdAt?.toMillis?.() ?? Date.now(),
      }))
    );
  });
}

export function subscribeToComments(barId, callback) {
  const q = query(
    collection(db, 'comments'),
    where('dayKey', '==', getCurrentDayKey()),
    where('barId', '==', barId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAtMillis: item.data().createdAt?.toMillis?.() ?? Date.now(),
      }))
    );
  });
}

export async function upsertCheckIn({ uid, username, barId }) {
  const dayKey = getCurrentDayKey();
  const activeRef = doc(db, 'activeCheckins', uid);
  const activeSnap = await getDoc(activeRef);

  if (activeSnap.exists()) {
    const previous = activeSnap.data();
    if (previous.checkinDocId) {
      await setDoc(doc(db, 'checkins', previous.checkinDocId), { active: false }, { merge: true });
    }
  }

  const newCheckinRef = doc(collection(db, 'checkins'));
  await setDoc(newCheckinRef, {
    uid,
    username,
    barId,
    dayKey,
    active: true,
    checkedInAt: serverTimestamp(),
    checkedInAtMillis: Date.now(),
  });

  await setDoc(activeRef, {
    uid,
    username,
    barId,
    dayKey,
    checkinDocId: newCheckinRef.id,
    updatedAt: serverTimestamp(),
  });
}

export async function updateVibe({ uid, username, barId, vibe }) {
  const dayKey = getCurrentDayKey();
  const ref = doc(db, 'vibes', `${uid}_${barId}_${dayKey}`);
  await setDoc(ref, {
    uid,
    username,
    barId,
    vibe,
    dayKey,
    createdAt: serverTimestamp(),
    createdAtMillis: Date.now(),
  });
}

export async function updateCover({ uid, username, barId, range }) {
  const dayKey = getCurrentDayKey();
  const ref = doc(db, 'coverReports', `${uid}_${barId}_${dayKey}`);
  await setDoc(ref, {
    uid,
    username,
    barId,
    range,
    dayKey,
    createdAt: serverTimestamp(),
    createdAtMillis: Date.now(),
  });
}

export async function addComment({ uid, username, barId, text }) {
  await addDoc(collection(db, 'comments'), {
    uid,
    username,
    barId,
    text,
    dayKey: getCurrentDayKey(),
    createdAt: serverTimestamp(),
  });
}

export async function toggleReaction({ uid, username, commentId, emoji }) {
  const ref = doc(db, 'commentReactions', `${commentId}_${uid}`);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().emoji === emoji) {
    await deleteDoc(ref);
    return;
  }

  await setDoc(ref, {
    uid,
    username,
    commentId,
    emoji,
    dayKey: getCurrentDayKey(),
    createdAt: serverTimestamp(),
    createdAtMillis: Date.now(),
  });
}
