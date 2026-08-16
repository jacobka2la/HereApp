import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

let registeredUid = '';
let actionListenerHandle = null;

function tokenDocId(uid, token) {
  return `${uid}_${encodeURIComponent(token)}`;
}

async function saveToken(uid, token) {
  if (!uid || !token) return;
  await setDoc(
    doc(db, 'deviceTokens', tokenDocId(uid, token)),
    {
      uid,
      token,
      platform: 'ios',
      updatedAt: serverTimestamp(),
      updatedAtMillis: Date.now(),
    },
    { merge: true }
  );
}

export async function registerPushNotifications(uid, navigate) {
  if (!uid || registeredUid === uid) return;

  try {
    const supported = await FirebaseMessaging.isSupported();
    if (!supported?.isSupported) return;

    let permission = await FirebaseMessaging.checkPermissions();
    if (permission.receive === 'prompt') {
      permission = await FirebaseMessaging.requestPermissions();
    }
    if (permission.receive !== 'granted') return;

    const tokenResult = await FirebaseMessaging.getToken();
    if (tokenResult?.token) {
      await saveToken(uid, tokenResult.token);
      registeredUid = uid;
    }

    await FirebaseMessaging.removeAllListeners();

    await FirebaseMessaging.addListener('tokenReceived', async (event) => {
      if (event?.token) await saveToken(uid, event.token);
    });

    actionListenerHandle = await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      const route = event?.notification?.data?.route;
      if (route && typeof navigate === 'function') navigate(route);
    });
  } catch (error) {
    console.warn('Push notification setup skipped:', error?.message || error);
  }
}

export async function resetPushRegistration() {
  registeredUid = '';
  if (actionListenerHandle?.remove) await actionListenerHandle.remove();
  actionListenerHandle = null;
}
