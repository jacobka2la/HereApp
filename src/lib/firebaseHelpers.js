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

const SAME_BAR_REENTRY_COOLDOWN_MS = 20 * 60 * 1000;
const OTHER_BAR_REENTRY_COOLDOWN_MS = 5 * 60 * 1000;
const INVITE_COOLDOWN_MS = 5 * 60 * 1000;

async function createNotification({ toUid, type, title, body, fromUid = '', fromUsername = '', barId = '', barName = '', meta = {} }) {
  if (!toUid) return;
  try {
    await addDoc(collection(db, 'notifications'), { toUid, type, title, body, fromUid, fromUsername, barId, barName, meta, read: false, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
  } catch (error) {
    console.warn('In-app notification write failed:', error?.message || error);
  }
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
  }, (error) => {
    console.error('Friend request subscription failed:', error?.message || error);
    callback([]);
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

export async function getPublicProfilesByUids(uids = []) {
  const uniqueUids = [...new Set(uids.filter(Boolean))];
  const entries = await Promise.all(uniqueUids.map(async (uid) => {
    const snap = await getDoc(doc(db, 'publicProfiles', uid));
    if (!snap.exists()) return null;
    return [uid, { id: snap.id, ...snap.data(), uid }];
  }));
  return Object.fromEntries(entries.filter(Boolean));
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

function publicProfileFromDoc(profileDoc) {
  if (!profileDoc) return null;
  return { id: profileDoc.id, ...profileDoc.data(), uid: profileDoc.id };
}

export async function findUserByUsername(username) {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;
  const usernameQuery = query(collection(db, 'publicProfiles'), where('username', '==', clean));
  const usernameSnap = await getDocs(usernameQuery);
  if (!usernameSnap.empty) return publicProfileFromDoc(usernameSnap.docs[0]);
  const displayQuery = query(collection(db, 'publicProfiles'), where('displayUsernameLower', '==', clean));
  const displaySnap = await getDocs(displayQuery);
  if (displaySnap.empty) return null;
  return publicProfileFromDoc(displaySnap.docs[0]);
}

export async function sendFriendRequest({ fromUid, fromUsername, toUid, toUsername }) {
  if (!fromUid || !toUid || fromUid === toUid) throw new Error('INVALID_REQUEST');
  const safeFromUsername = String(fromUsername || '').trim();
  const safeToUsername = String(toUsername || '').trim();
  const directRequestId = `${fromUid}_${toUid}`;
  const reverseRequestId = `${toUid}_${fromUid}`;
  const friendshipId = [fromUid, toUid].sort().join('_');
  const [friendshipSnap, directSnap, reverseSnap] = await Promise.all([
    getDoc(doc(db, 'friendships', friendshipId)),
    getDoc(doc(db, 'friendRequests', directRequestId)),
    getDoc(doc(db, 'friendRequests', reverseRequestId)),
  ]);
  if (friendshipSnap.exists()) throw new Error('ALREADY_FRIENDS');
  if (directSnap.exists() && directSnap.data()?.status === 'pending') throw new Error('REQUEST_ALREADY_SENT');
  if (reverseSnap.exists() && reverseSnap.data()?.status === 'pending') {
    await respondToFriendRequest({ requestId: reverseRequestId, fromUid: toUid, fromUsername: safeToUsername, toUid: fromUid, toUsername: safeFromUsername, status: 'accepted' });
    return { status: 'accepted_existing_request' };
  }
  await setDoc(doc(db, 'friendRequests', directRequestId), { fromUid, fromUsername: safeFromUsername, toUid, toUsername: safeToUsername.toLowerCase(), status: 'pending', createdAt: serverTimestamp(), createdAtMillis: Date.now() });
  createNotification({ toUid, type: 'friend_request', title: 'New Friend Request', body: `@${safeFromUsername} requested you.`, fromUid, fromUsername: safeFromUsername });
  return { status: 'sent' };
}

export async function respondToFriendRequest({ requestId, fromUid, fromUsername, toUid, toUsername, status }) {
  await setDoc(doc(db, 'friendRequests', requestId), { status, respondedAt: serverTimestamp(), respondedAtMillis: Date.now() }, { merge: true });
  if (status !== 'accepted') return;
  const friendshipId = [fromUid, toUid].sort().join('_');
  await setDoc(doc(db, 'friendships', friendshipId), { memberUids: [fromUid, toUid], userAUid: fromUid, userAUsername: fromUsername, userBUid: toUid, userBUsername: toUsername, createdAt: serverTimestamp(), createdAtMillis: Date.now() });
  createNotification({ toUid: fromUid, type: 'friend_accept', title: 'Friend Request Accepted', body: `@${toUsername} accepted your friend request.`, fromUid: toUid, fromUsername: toUsername });
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
    const lastLeftBarId = userStatsData.lastLeftBarId ?? '';
    const elapsedSinceLeaving = lastLeftAtMillis ? now - lastLeftAtMillis : Number.POSITIVE_INFINITY;
    if (lastLeftBarId === barId && elapsedSinceLeaving < SAME_BAR_REENTRY_COOLDOWN_MS) throw new Error(`SAME_BAR_COOLDOWN_${SAME_BAR_REENTRY_COOLDOWN_MS - elapsedSinceLeaving}`);
    if (lastLeftBarId && lastLeftBarId !== barId && elapsedSinceLeaving < OTHER_BAR_REENTRY_COOLDOWN_MS) throw new Error(`OTHER_BAR_COOLDOWN_${OTHER_BAR_REENTRY_COOLDOWN_MS - elapsedSinceLeaving}`);
    const currentVisitCount = userBarSnap.data()?.visitCount ?? 0;
    const previousTotalVisits = userStatsData.totalVisits ?? 0;
    const previousUniqueBars = userStatsData.uniqueBars ?? 0;
    const isFirstVisitToBar = !userBarSnap.exists();
    transaction.set(newCheckinRef, { uid, username, barId, dayKey, active: true, countedVisit: true, checkedInAt: serverTimestamp(), checkedInAtMillis: now, createdAt: serverTimestamp(), createdAtMillis: now });
    transaction.set(activeRef, { uid, username, barId, dayKey, checkinDocId: newCheckinRef.id, activeSinceAt: serverTimestamp(), activeSinceMillis: now, updatedAt: serverTimestamp(), updatedAtMillis: now });
    transaction.set(userBarRef, { uid, username, barId, visitCount: currentVisitCount + 1, firstVisitAt: userBarSnap.exists() ? userBarSnap.data()?.firstVisitAt ?? serverTimestamp() : serverTimestamp(), firstVisitAtMillis: userBarSnap.exists() ? userBarSnap.data()?.firstVisitAtMillis ?? now : now, lastVisitAt: serverTimestamp(), lastVisitAtMillis: now, updatedAt: serverTimestamp(), updatedAtMillis: now }, { merge: true });
    transaction.set(userStatsRef, { uid, username, totalVisits: previousTotalVisits + 1, uniqueBars: isFirstVisitToBar ? previousUniqueBars + 1 : previousUniqueBars, lastVisitBarId: barId, lastVisitAt: serverTimestamp(), lastVisitAtMillis: now, updatedAt: serverTimestamp(), updatedAtMillis: now }, { merge: true });
  });
  const barMeta = msuBars.find((bar) => bar.id === barId);
  notifyFriendsOfCheckIn({ uid, username, barId, barName: barMeta?.name || barId }).catch(() => {});
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
    if (activeData.checkinDocId) transaction.set(doc(db, 'checkins', activeData.checkinDocId), { active: false, leftAt: serverTimestamp(), leftAtMillis: now, updatedAt: serverTimestamp(), updatedAtMillis: now }, { merge: true });
    transaction.delete(activeRef);
    transaction.set(userStatsRef, { uid, username: activeData.username || userStatsSnap.data()?.username || '', lastLeftBarId: activeData.barId || '', lastLeftAt: serverTimestamp(), lastLeftAtMillis: now, updatedAt: serverTimestamp(), updatedAtMillis: now }, { merge: true });
  });
}

export async function updateVibe({ uid, username, barId, vibe }) { const dayKey = getCurrentDayKey(); await setDoc(doc(db, 'vibes', `${uid}_${barId}_${dayKey}`), { uid, username, barId, vibe, dayKey, createdAt: serverTimestamp(), createdAtMillis: Date.now() }); }
export async function updateCover({ uid, username, barId, range }) { const dayKey = getCurrentDayKey(); await setDoc(doc(db, 'covers', `${uid}_${barId}_${dayKey}`), { uid, username, barId, range, dayKey, createdAt: serverTimestamp(), createdAtMillis: Date.now() }); }
export async function updateLine({ uid, username, barId, range }) { const dayKey = getCurrentDayKey(); await setDoc(doc(db, 'lines', `${uid}_${barId}_${dayKey}`), { uid, username, barId, range, dayKey, createdAt: serverTimestamp(), createdAtMillis: Date.now() }); }

export async function addComment({ uid, username, barId, text }) {
  const clean = text.trim();
  if (!clean) return;
  await addDoc(collection(db, 'comments'), { uid, username, barId, text: clean, dayKey: getCurrentDayKey(), createdAt: serverTimestamp() });
}

export async function reportContent({ reporterUid, targetType, targetId, reason, details = '' }) { await addDoc(collection(db, 'reports'), { reporterUid, targetType, targetId, reason, details, createdAt: serverTimestamp() }); }
export async function hideComment({ uid, commentId }) { await setDoc(doc(db, 'hiddenComments', `${uid}_${commentId}`), { uid, commentId, createdAt: serverTimestamp() }); }
export async function unhideComment({ uid, commentId }) { await deleteDoc(doc(db, 'hiddenComments', `${uid}_${commentId}`)); }
export async function blockUser({ uid, targetUid }) { await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayUnion(targetUid) }); }
export async function unblockUser({ uid, targetUid }) { await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayRemove(targetUid) }); }

export async function sendInvite({ fromUid, fromUsername, toUid, toUsername, barId, barName, message = '' }) {
  const now = Date.now();
  const inviteId = `${fromUid}_${toUid}_${barId}`;
  const inviteRef = doc(db, 'invites', inviteId);
  const inviteSnap = await getDoc(inviteRef);
  const previousSentAt = inviteSnap.data()?.sentAtMillis ?? 0;
  if (inviteSnap.exists() && now - previousSentAt < INVITE_COOLDOWN_MS) throw new Error('INVITE_COOLDOWN');
  await setDoc(inviteRef, { fromUid, fromUsername, toUid, toUsername, barId, barName, message, status: 'pending', sentAt: serverTimestamp(), sentAtMillis: now, createdAt: inviteSnap.exists() ? inviteSnap.data()?.createdAt ?? serverTimestamp() : serverTimestamp() }, { merge: true });
  createNotification({ toUid, type: 'bar_invite', title: `@${fromUsername} invited you`, body: message || `Come to ${barName}.`, fromUid, fromUsername, barId, barName });
}

export async function dismissInvite(inviteId) { await setDoc(doc(db, 'invites', inviteId), { status: 'dismissed', dismissedAt: serverTimestamp(), dismissedAtMillis: Date.now() }, { merge: true }); }

export async function toggleCommentReaction({ uid, username, commentId, emoji }) {
  const reactionId = `${commentId}_${uid}_${emoji}`;
  const ref = doc(db, 'commentReactions', reactionId);
  const snap = await getDoc(ref);
  if (snap.exists()) await deleteDoc(ref);
  else await setDoc(ref, { uid, username, commentId, emoji, dayKey: getCurrentDayKey(), createdAt: serverTimestamp(), createdAtMillis: Date.now() });
}

export function subscribeToCommentReactions(commentIds, callback) {
  if (!commentIds?.length) { callback([]); return () => {}; }
  const q = query(collection(db, 'commentReactions'), where('dayKey', '==', getCurrentDayKey()));
  return onSnapshot(q, (snap) => callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => commentIds.includes(item.commentId))));
}