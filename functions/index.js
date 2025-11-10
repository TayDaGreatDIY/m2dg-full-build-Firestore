
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.onMissionComplete = functions.firestore
  .document('users/{uid}/goals/{goalId}/missions/{missionId}')
  .onUpdate(async (change, ctx) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === 'completed' || after.status !== 'completed') return;

    const xp = after.xp || 0;
    const countersRef = db.collection('users').doc(ctx.params.uid).collection('counters').doc('main');
    
    // Also increment XP on the main user document
    const userRef = db.collection('users').doc(ctx.params.uid);

    await db.runTransaction(async (trx) => {
      const snap = await trx.get(countersRef);
      const data = snap.exists ? snap.data() : { xp: 0, missionsCompleted: 0, lastCompletionDate: 0, streak: 0 };
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const last = data.lastCompletionDate ? new Date(data.lastCompletionDate) : null;
      let streak = data.streak || 0;

      if (!last) {
        streak = 1;
      } else {
        const lastDate = new Date(last);
        lastDate.setHours(0,0,0,0);
        
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak = streak + 1;
        } else if (diffDays > 1) {
          streak = 1;
        }
        // if diffDays is 0, do nothing to the streak
      }

      // Update counters subcollection
      trx.set(countersRef, {
        xp: (data.xp || 0) + xp,
        missionsCompleted: (data.missionsCompleted || 0) + 1,
        lastCompletionDate: Date.now(),
        streak
      }, { merge: true });

      // Update main user document
      trx.update(userRef, {
          xp: admin.firestore.FieldValue.increment(xp),
          trainingStreak: streak
      });
    });
  });
