const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');

admin.initializeApp();
const db = admin.firestore();

exports.resetNightlyCollections = onSchedule(
  {
    schedule: '0 4 * * *',
    timeZone: 'America/Detroit',
  },
  async () => {
    const collections = ['activeCheckins', 'checkins', 'vibes', 'coverReports', 'comments', 'commentReactions'];

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      if (!snapshot.empty) {
        await batch.commit();
      }
    }

    await db.collection('nightlyResets').add({
      ranAt: admin.firestore.FieldValue.serverTimestamp(),
      note: '4AM Eastern reset completed.',
    });
  }
);
