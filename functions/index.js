
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.onMissionComplete = functions.firestore
  .document("users/{uid}/goals/{goalId}/missions/{missionId}")
  .onUpdate(async (change, context) => {
    const { uid, goalId, missionId } = context.params;

    const before = change.before.data();
    const after = change.after.data();

    // Mission must transition from not-completed → completed
    if (before?.status === "completed" || after?.status !== "completed") {
      return null;
    }

    try {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.error("User document missing:", uid);
        return null;
      }

      const rewardXp = after.xp || 10; // Use 'xp' from the mission doc, fallback to 10

      // Update user XP + record completed mission
      await userRef.update({
        xp: admin.firestore.FieldValue.increment(rewardXp),
        completedMissions: admin.firestore.FieldValue.arrayUnion(missionId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create a notification for the user
      await db
        .collection("users")
        .doc(uid)
        .collection("notifications")
        .add({
          type: "mission_complete",
          missionId,
          goalId,
          xpGained: rewardXp,
          title: "🏅 Mission Complete!",
          body: `You completed "${after.title}" and earned ${rewardXp} XP!`,
          link: '/missions',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });

      console.log(
        `Mission ${missionId} under goal ${goalId} completed for user ${uid}`
      );

      return null;
    } catch (err) {
      console.error("onMissionComplete error:", err);
      return null;
    }
  });
