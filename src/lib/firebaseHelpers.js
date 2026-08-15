import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentDayKey } from './day';
import { msuBars } from './bars';

const REENTRY_COOLDOWN_MS = 20 * 60 * 1000;
const INVITE_COOLDOWN_MS = 5 * 60 * 1000;

async function createNotification({ toUid, type, title, body, fromUid = '', fromUsername = '', barId = '', barName = '', meta = {} }) {
  if (!toUid) return;
  await addDoc(collection(db, 'notifications'), { toUid, type, title, body, fromUid, fromUsername, barId, barName, meta, read: false, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}

async function notifyFriendsOfCheckIn({ uid, username, barId, barName }) {
  const friendshipsQuery = query(collection(db, 'friendships'), where('memberUids', 'array-contains', uid));
  const snap = await getDocs(friendshipsQuery);
  const friendUids = snap.docs.map((item) => item.data()).map((friendship) => friendship.userAUid === uid ? friendship.userBUid : friendship.userAUid).filter(Boolean);
  await Promise.all(friendUids.map((friendUid) => createNotification({ toUid: friendUid, type: 'friend_checkin', title: `@${username} is out tonight`, body: `${username} checked into ${barName}.`, fromUid: uid, fromUsername: username, barId, barName })));
}

export async function seedBarsIfNeeded() {
  await Promise.all(msuBars.map(async (bar) => {
    const ref = doc(db, 'bars', bar.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { ...bar, createdAt: serverTimestamp() });
  }));
}

export function subscribeToTodayCollection(collectionName, callback) {
  const dayKey = getCurrentDayKey();
  const q = query(collection(db, collectionName), where('dayKey', '==', dayKey));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
      createdAtMillis: item.data().createdAt?.toMillis?.() ?? item.data().createdAtMillis ?? Date.now(),
      checkedInAtMillis: item.data().checkedInAt?.toMillis?.() ?? item.data().checkedInAtMillis ?? item.data().createdAt?.toMillis?.() ?? Date.now(),
    })));
  });
}

export function subscribeToComments(barId, callback) {
  const q = query(collection(db, 'comments'), where('dayKey', '==', getCurrentDayKey()), where('barId', '==', barId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((item) => ({ id: item.id, ...item.data(), createdAtMillis: item.data().createdAt?.toMillis?.() ?? Date.now() }))));
}

export function subscribeToInvitesForUser(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'invites'), where('toUid', '==', uid), where('status', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data(), createdAtMillis: item.data().createdAt?.toMillis?.() ?? item.data().createdAtMillis ?? Date.now() })).sort((a, b) => b.createdAtMillis - a.createdAtMillis);
    callback(items);
  });
}

export function subscribeToNotificationsForUser(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'notifications'), where('toUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data(), createdAtMillis: item.data().createdAt?.toMillis?.() ?? item.data().createdAtMillis ?? Date.now() })).sort((a, b) => b.createdAtMillis - a.createdAtMillis).slice(0, 15);
    callback(items);
  });
}

export async function markNotificationRead(notificationId) {
  await setDoc(doc(db, 'notifications', notificationId), { read: true, readAt: serverTimestamp(), readAtMillis: Date.now() }, { merge: true });
}

export function subscribeToFriendRequestsForUser(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'friendRequests'), where('toUid', '==', uid), where('status', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data(), createdAtMillis: item.data().createdAt?.toMillis?.() ?? item.data().createdAtMillis ?? Date.now() })).sort((a, b) => b.createdAtMillis - a.createdAtMillis);
    callback(items);
  });
}

export function subscribeToFriendsForUser(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'friendships'), where('memberUids', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data(), createdAtMillis: item.data().createdAt?.toMillis?.() ?? item.data().createdAtMillis ?? Date.now() })).sort((a, b) => b.createdAtMillis - a.createdAtMillis);
    callback(items);
  });
}

export function subscribeToUserBarStats(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'userBarStats'), where('uid', '==', uid));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data(), lastVisitAtMillis: item.data().lastVisitAt?.toMillis?.() ?? item.data().lastVisitAtMillis ?? 0 })).sort((a, b) => b.lastVisitAtMillis - a.lastVisitAtMillis);
    callback(items);
  });
}

export function subscribeToHiddenCommentsForUser(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'hiddenComments'), where('uid', '==', uid));
  return onSnapshot(q, (snap) => callback(snap.docs.map((item) => ({ id: item.id, ...item.data() }))));
}

export async function findUserByUsername(username) {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  const usernameQuery = query(collection(db, 'publicProfiles'), where('username', '==', clean));
  const usernameSnap = await getDocs(usernameQuery);
  if (!usernameSnap.empty) {
    const first = usernameSnap.docs[0];
    return { id: first.id, ...first.data() };
  }

  const displayQuery = query(collection(db, 'publicProfiles'), where('displayUsernameLower', '==', clean));
  const displaySnap = await getDocs(displayQuery);
  if (displaySnap.empty) return null;
  const first = displaySnap.docs[0];
  return { id: first.id, ...first.data() };
}

export async function sendFriendRequest({ fromUid, fromUsername, toUid, toUsername }) {
  const directRequestId = `${fromUid}_${toUid}`;
  const reverseRequestId = `${toUid}_${fromUid}`;
  const friendshipId = [fromUid, toUid].sort().join('_');
  const friendshipSnap = await getDoc(doc(db, 'friendships', friendshipId));
  if (friendshipSnap.exists()) throw new Error('ALREADY_FRIENDS');
  const reverseSnap = await getDoc(doc(db, 'friendRequests', reverseRequestId));
  if (reverseSnap.exists() && reverseSnap.data()?.status === 'pending') {
    await respondToFriendRequest({ requestId: reverseRequestId, fromUid: toUid, fromUsername: toUsername, toUid: fromUid, toUsername: fromUsername, status: 'accepted' });
    return;
  }
  await setDoc(doc(db, 'friendRequests', directRequestId), { fromUid, fromUsername, toUid, toUsername: toUsername.trim().toLowerCase(), status: 'pending', createdAt: serverTimestamp(), createdAtMillis: Date.now() });
  await createNotification({ toUid, type: 'friend_request', title: 'New friend request', body: `@${fromUsername} sent you a friend request.`, fromUid, fromUsername });
}

export async function respondToFriendRequest({ requestId, fromUid, fromUsername, toUid, toUsername, status }) {
  await setDoc(doc(db, 'friendRequests', requestId), { status, respondedAt: serverTimestamp(), respondedAtMillis: Date.now() }, { merge: true });
  if (status !== 'accepted') return;
  const friendshipId = [fromUid, toUid].sort().join('_');
  await setDoc(doc(db, 'friendships', friendshipId), { memberUids: [fromUid, toUid], userAUid: fromUid, userAUsername: fromUsername, userBUid: toUid, userBUsername: toUsername, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
  await createNotification({ toUid: fromUid, type: 'friend_accept', title: 'Friend request accepted', body: `@${toUsername} accepted your friend request.`, fromUid: toUid, fromUsername: toUsername });
}

export async function upsertCheckIn({ uid, username, barId }) {
  const now = Date.now();
  const dayKey = getCurrentDayKey();
  const activeRef = doc(db, 'activeCheckins', uid);
  const userBarRef = doc(db, 'userBarStats', `${uid}_${barId}`);
  const userStatsRef = doc(db, 'userStats', uid);
  const newCheckinRef = doc(collection(db, 'checkins'));

  await runTransaction(db, async (transaction) => {
    const activeSnap = await transaction.get(activeRef);
    const userBarSnap = await transaction.get(userBarRef);
    const userStatsSnap = await transaction.get(userStatsRef);
    const activeData = activeSnap.exists() ? activeSnap.data() : null;
    const userStatsData = userStatsSnap.exists() ? userStatsSnap.data() : {};

    if (activeData?.barId) {
      if (activeData.barId === barId) throw new Error('ALREADY_CHECKED_IN');
      throw new Error(`ACTIVE_AT_OTHER_BAR_${activeData.barId}`);
    }

    const lastLeftAtMillis = userStatsData.lastLeftAtMillis ?? 0;
    if (lastLeftAtMillis && now - lastLeftAtMillis < REENTRY_COOLDOWN_MS) {
      throw new Error(`CHECKIN_COOLDOWN_${REENTRY_COOLDOWN_MS - (now - lastLeftAtMillis)}`);
    }

    const currentVisitCount = userBarSnap.data()?.visitCount ?? 0;
    const previousTotalVisits = userStatsData.totalVisits ?? 0;
    const previousUniqueBars = userStatsData.uniqueBars ?? 0;
    const isFirstVisitToBar = !userBarSnap.exists();

    transaction.set(newCheckinRef, {
      uid,
      username,
      barId,
      dayKey,
      active: true,
      countedVisit: true,
      checkedInAt: serverTimestamp(),
      checkedInAtMillis: now,
      createdAt: serverTimestamp(),
      createdAtMillis: now,
    });

    transaction.set(activeRef, {
      uid,
      username,
      barId,
      dayKey,
      checkinDocId: newCheckinRef.id,
      activeSinceAt: serverTimestamp(),
      activeSinceMillis: now,
      updatedAt: serverTimestamp(),
      updatedAtMillis: now,
    });

    transaction.set(userBarRef, {
      uid,
      username,
      barId,
      visitCount: currentVisitCount + 1,
      firstVisitAt: userBarSnap.exists() ? userBarSnap.data()?.firstVisitAt ?? serverTimestamp() : serverTimestamp(),
      firstVisitAtMillis: userBarSnap.exists() ? userBarSnap.data()?.firstVisitAtMillis ?? now : now,
      lastVisitAt: serverTimestamp(),
      lastVisitAtMillis: now,
      updatedAt: serverTimestamp(),
      updatedAtMillis: now,
    }, { merge: true });

    transaction.set(userStatsRef, {
      uid,
      username,
      totalVisits: previousTotalVisits + 1,
      uniqueBars: isFirstVisitToBar ? previousUniqueBars + 1 : previousUniqueBars,
      lastVisitBarId: barId,
      lastVisitAt: serverTimestamp(),
      lastVisitAtMillis: now,
      updatedAt: serverTimestamp(),
      updatedAtMillis: now,
    }, { merge: true });
  });

  const barMeta = msuBars.find((bar) => bar.id === barId);
  await notifyFriendsOfCheckIn({ uid, username, barId, barName: barMeta?.name || barId });
}

export async function leaveBar(uid) {
  const now = Date.now();
  const activeRef = doc(db, 'activeCheckins', uid);
  const userStatsRef = doc(db, 'userStats', uid);

  await runTransaction(db, async (transaction) => {
    const activeSnap = await transaction.get(activeRef);
    const userStatsSnap = await transaction.get(userStatsRef);
    if (!activeSnap.exists()) return;

    const activeData = activeSnap.data();

    if (activeData.checkinDocId) {
      transaction.set(doc(db, 'checkins', activeData.checkinDocId), {
        active: false,
        leftAt: serverTimestamp(),
        leftAtMillis: now,
        updatedAt: serverTimestamp(),
        updatedAtMillis: now,
      }, { merge: true });
    }

    transaction.delete(activeRef);
    transaction.set(userStatsRef, {
      uid,
      username: activeData.username || userStatsSnap.data()?.username || '',
      lastLeftBarId: activeData.barId || '',
      lastLeftAt: serverTimestamp(),
      lastLeftAtMillis: now,
      updatedAt: serverTimestamp(),
      updatedAtMillis: now,
    }, { merge: true });
  });
}

export async function updateVibe({ uid, username, barId, vibe }) {
  const dayKey = getCurrentDayKey();
  await setDoc(doc(db, 'vibes', `${uid}_${barId}_${dayKey}`), { uid, username, barId, vibe, dayKey, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}
export async function updateCover({ uid, username, barId, range }) {
  const dayKey = getCurrentDayKey();
  await setDoc(doc(db, 'coverReports', `${uid}_${barId}_${dayKey}`), { uid, username, barId, range, dayKey, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}
export async function updateLineLength({ uid, username, barId, lineLength }) {
  const dayKey = getCurrentDayKey();
  await setDoc(doc(db, 'lineReports', `${uid}_${barId}_${dayKey}`), { uid, username, barId, lineLength, dayKey, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}
export async function addComment({ uid, username, barId, text }) {
  await addDoc(collection(db, 'comments'), { uid, username, barId, text, hidden: false, dayKey: getCurrentDayKey(), createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}
export async function deleteCommentById(commentId) { await deleteDoc(doc(db, 'comments', commentId)); }
export async function hideCommentForUser({ uid, commentId }) { await setDoc(doc(db, 'hiddenComments', `${uid}_${commentId}`), { uid, commentId, hiddenAt: serverTimestamp(), hiddenAtMillis: Date.now() }); }

export async function reportComment({ reporterUid, reporterUsername, commentId, commentOwnerUid, commentOwnerUsername, commentText, barId, barName }) {
  await addDoc(collection(db, 'reports'), { type: 'comment', dayKey: getCurrentDayKey(), commentId, commentOwnerUid: commentOwnerUid || '', commentOwnerUsername: commentOwnerUsername || '', commentText: commentText || '', barId: barId || '', barName: barName || '', reporterUid: reporterUid || '', reporterUsername: reporterUsername || '', status: 'open', createdAt: serverTimestamp(), createdAtMillis: Date.now() });
  if (reporterUid && commentId) await hideCommentForUser({ uid: reporterUid, commentId });
}

export async function hideComment(commentId) { await setDoc(doc(db, 'comments', commentId), { hidden: true, hiddenAt: serverTimestamp(), hiddenAtMillis: Date.now() }, { merge: true }); }
export async function blockUser({ blockerUid, blockedUid }) { await updateDoc(doc(db, 'users', blockerUid), { blockedUsers: arrayUnion(blockedUid) }); }
export async function unblockUser({ blockerUid, blockedUid }) { await updateDoc(doc(db, 'users', blockerUid), { blockedUsers: arrayRemove(blockedUid) }); }

export async function sendInvite({ fromUid, fromUsername, toUid, toUsername, barId, barName, message }) {
  const now = Date.now();
  const cooldownRef = doc(db, 'inviteCooldowns', `${fromUid}_${toUid}_${barId}`);
  const cooldownSnap = await getDoc(cooldownRef);
  if (cooldownSnap.exists()) {
    const lastSentAtMillis = cooldownSnap.data()?.lastSentAtMillis ?? 0;
    if (lastSentAtMillis && now - lastSentAtMillis < INVITE_COOLDOWN_MS) throw new Error('COOLDOWN');
  }
  await addDoc(collection(db, 'invites'), { fromUid, fromUsername, toUid, toUsername: toUsername.trim().toLowerCase(), barId, barName, message, status: 'pending', createdAt: serverTimestamp(), createdAtMillis: now });
  await setDoc(cooldownRef, { fromUid, toUid, barId, lastSentAt: serverTimestamp(), lastSentAtMillis: now });
  await createNotification({ toUid, type: 'invite', title: `@${fromUsername} invited you out`, body: message || `Come to ${barName}, it's packed!`, fromUid, fromUsername, barId, barName });
}

export async function dismissInvite(inviteId) { await setDoc(doc(db, 'invites', inviteId), { status: 'dismissed', updatedAt: serverTimestamp(), updatedAtMillis: Date.now() }, { merge: true }); }

export async function toggleReaction({ uid, username, commentId, emoji }) {
  const ref = doc(db, 'commentReactions', `${commentId}_${uid}`);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().emoji === emoji) { await deleteDoc(ref); return; }
  await setDoc(ref, { uid, username, commentId, emoji, dayKey: getCurrentDayKey(), createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}
