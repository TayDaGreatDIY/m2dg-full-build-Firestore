
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

export const onMissionComplete = functions.firestore
  .document("users/{uid}/goals/{goalId}/missions/{missionId}")
  .onUpdate(async (change, context) => {
    const { uid } = context.params;
    const after = change.after.data();
    const before = change.before.data();

    // Only act when mission just changed to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      const userRef = db.collection("users").doc(uid);
      const statsRef = userRef.collection("stats").doc("main");

      const statsSnap = await statsRef.get();
      const stats = statsSnap.exists
        ? statsSnap.data()
        : { xp: 0, level: 1, streak: 0, totalMissionsCompleted: 0 };

      const newXP = (stats.xp || 0) + 10;
      const newTotal = (stats.totalMissionsCompleted || 0) + 1;

      // Level thresholds
      const level = Math.floor(newXP / 100) + 1;

      // Handle streak
      const lastActive = stats.lastActive?.toDate?.() || new Date(0);
      const diff = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
      const newStreak = diff < 2 ? (stats.streak || 0) + 1 : 1;

      await statsRef.set(
        {
          xp: newXP,
          level,
          streak: newStreak,
          totalMissionsCompleted: newTotal,
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 🔰 Award badges
      const badgesRef = userRef.collection("badges");
      const badgeList = [];

      if (newTotal === 1)
        badgeList.push({ name: "Rookie", description: "Completed your first mission", icon: "🎯" });
      if (newXP >= 100)
        badgeList.push({ name: "100 Club", description: "Earned 100 XP!", icon: "💪🏽" });
      if (newStreak >= 7)
        badgeList.push({ name: "Grind Week", description: "7-day streak!", icon: "🔥" });

      for (const badge of badgeList) {
        const existing = await badgesRef
          .where("name", "==", badge.name)
          .get();
        if (existing.empty) {
          await badgesRef.add({
            ...badge,
            earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // 🎯 Send notification
      await userRef.collection("notifications").add({
        title: "🏅 Mission Complete!",
        body: `You earned +10 XP! Total XP: ${newXP}.`,
        type: "progress",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`XP updated for ${uid}: +10XP`);
    }
  });
