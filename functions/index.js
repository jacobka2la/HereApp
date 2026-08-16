const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();
const db = admin.firestore();

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return 0;

  const writer = db.bulkWriter();
  snapshot.docs.forEach((document) => writer.delete(document.ref));
  await writer.close();
  return snapshot.size;
}

async function archiveCheckins() {
  const snapshot = await db.collection('checkins').where('active', '==', true).get();
  if (snapshot.empty) return 0;

  const writer = db.bulkWriter();
  const resetAtMillis = Date.now();

  snapshot.docs.forEach((document) => {
    writer.set(
      document.ref,
      {
        active: false,
        endedByNightlyReset: true,
        resetAt: admin.firestore.FieldValue.serverTimestamp(),
        resetAtMillis,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtMillis: resetAtMillis,
      },
      { merge: true }
    );
  });

  await writer.close();
  return snapshot.size;
}

async function sendPushToUser({ toUid, title, body, data = {} }) {
  if (!toUid) return;

  const tokenSnapshot = await db.collection('deviceTokens').where('uid', '==', toUid).get();
  const tokenDocs = tokenSnapshot.docs.filter((document) => document.data()?.token);
  if (!tokenDocs.length) return;

  const tokens = [...new Set(tokenDocs.map((document) => document.data().token))];
  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value ?? '')])
  );

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: stringData,
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  });

  const invalidCodes = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
  ]);

  const writer = db.bulkWriter();
  let hasDeletes = false;
  response.responses.forEach((result, index) => {
    if (!result.success && invalidCodes.has(result.error?.code)) {
      const invalidToken = tokens[index];
      tokenDocs
        .filter((document) => document.data().token === invalidToken)
        .forEach((document) => {
          writer.delete(document.ref);
          hasDeletes = true;
        });
    }
  });
  if (hasDeletes) await writer.close();
  else await writer.close();
}

exports.pushFriendRequest = onDocumentCreated('friendRequests/{requestId}', async (event) => {
  const request = event.data?.data();
  if (!request || request.status !== 'pending') return;

  const fromUsername = request.fromUsername || 'Someone';
  await sendPushToUser({
    toUid: request.toUid,
    title: 'New Friend Request',
    body: `@${fromUsername} requested you.`,
    data: {
      type: 'friend_request',
      fromUid: request.fromUid || '',
      fromUsername,
      route: '/friends',
    },
  });
});

exports.pushBarInvite = onDocumentCreated('invites/{inviteId}', async (event) => {
  const invite = event.data?.data();
  if (!invite || invite.status !== 'pending') return;

  const fromUsername = invite.fromUsername || 'A friend';
  const barName = invite.barName || 'a bar';
  await sendPushToUser({
    toUid: invite.toUid,
    title: `@${fromUsername} Invited You`,
    body: `${fromUsername} invited you to ${barName}.`,
    data: {
      type: 'bar_invite',
      fromUid: invite.fromUid || '',
      fromUsername,
      barId: invite.barId || '',
      barName,
      route: invite.barId ? `/bar/${invite.barId}` : '/friends',
    },
  });
});

exports.resetNightlyCollections = onSchedule(
  {
    schedule: '0 4 * * *',
    timeZone: 'America/Detroit',
  },
  async () => {
    // Keep check-in history permanently so personal stats/history can never be
    // destroyed by the 4 AM reset. Only end any still-active check-ins.
    const archivedCheckins = await archiveCheckins();

    // These collections are only for the current night/live experience.
    // Permanent user data lives in userStats and userBarStats and is NEVER
    // touched by this reset.
    const ephemeralCollections = [
      'activeCheckins',
      'vibes',
      'coverReports',
      'lineReports',
      'comments',
      'commentReactions',
    ];

    const deletedCounts = {};
    for (const collectionName of ephemeralCollections) {
      deletedCounts[collectionName] = await deleteCollection(collectionName);
    }

    await db.collection('nightlyResets').add({
      ranAt: admin.firestore.FieldValue.serverTimestamp(),
      ranAtMillis: Date.now(),
      timeZone: 'America/Detroit',
      archivedCheckins,
      deletedCounts,
      note: '4AM Eastern reset completed. Personal stats and check-in history preserved.',
    });
  }
);