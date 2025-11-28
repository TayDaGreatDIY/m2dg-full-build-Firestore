
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.onMissionComplete = functions.firestore
  .document("users/{uid}/goals/{goalId}/missions/{missionId}")
  .onUpdate(async (change, context) => {
    const { uid, missionId, goalId } = context.params;

    const before = change.before.data();
    const after = change.after.data();

    // Only proceed when mission goes from incomplete → complete
    if (before.status === 'completed' || after.status !== 'completed') {
      return null;
    }

    try {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.error("User document not found:", uid);
        return null;
      }

      const rewardXp = after.xp || 10; // default XP for missions

      // Update XP + add missionId to completedMissions array
      await userRef.update({
        xp: admin.firestore.FieldValue.increment(rewardXp),
        completedMissions: admin.firestore.FieldValue.arrayUnion(missionId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create notification document
      const notifRef = db
        .collection("users")
        .doc(uid)
        .collection("notifications")
        .doc();

      await notifRef.set({
        type: "mission_complete",
        missionId,
        goalId,
        xpGained: rewardXp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        title: "🏅 Mission Complete!",
        body: `You completed "${after.title}" and earned ${rewardXp} XP!`,
        link: `/missions`,
      });

      console.log(`Mission ${missionId} completed successfully for user ${uid}`);
      return null;

    } catch (err) {
      console.error("onMissionComplete error:", err);
      return null;
    }
  });
