const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');

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
