
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Badge Definitions ---
const badges = {
    'xp-100': { id: 'xp-100', name: '100 XP Club', tier: 'bronze' },
    'xp-500': { id: 'xp-500', name: '500 XP Baller', tier: 'silver' },
    'xp-1000': { id: 'xp-1000', name: '1K XP All-Star', tier: 'gold' },
    'missions-10': { id: 'missions-10', name: 'Mission Specialist', tier: 'bronze' },
    'missions-50': { id: 'missions-50', name: 'Mission Elite', tier: 'silver' },
    'streak-7': { id: 'streak-7', name: '7-Day Grinder', tier: 'silver' },
    'streak-30': { id: 'streak-30', name: '30-Day Legend', tier: 'gold' },
};


exports.onMissionComplete = functions.firestore
  .document('users/{uid}/goals/{goalId}/missions/{missionId}')
  .onUpdate(async (change, ctx) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === 'completed' || after.status !== 'completed') return;

    const { uid, goalId, missionId } = ctx.params;
    const xp = after.xp || 0;
    
    const userRef = db.collection('users').doc(uid);
    const countersRef = db.collection('users').doc(uid).collection('counters').doc('main');
    const notificationsRef = db.collection('users').doc(uid).collection('notifications');

    await db.runTransaction(async (trx) => {
      const userDoc = await trx.get(userRef);
      const countersDoc = await trx.get(countersRef);
      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const countersData = countersDoc.exists ? countersDoc.data() : { xp: 0, missionsCompleted: 0, lastCompletionDate: 0, streak: 0 };
      
      const newTotalXP = (countersData.xp || 0) + xp;
      const newMissionsCompleted = (countersData.missionsCompleted || 0) + 1;

      // --- Streak Logic ---
      const today = new Date(); today.setHours(0,0,0,0);
      const last = countersData.lastCompletionDate ? new Date(countersData.lastCompletionDate) : null;
      let newStreak = countersData.streak || 0;
      if (!last) {
        newStreak = 1;
      } else {
        const lastDate = new Date(last); lastDate.setHours(0,0,0,0);
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) newStreak++;
        else if (diffDays > 1) newStreak = 1;
      }

      // --- Badge Unlocking Logic ---
      const userBadges = userData.badges || [];
      const newBadges = [];

      if (newTotalXP >= 100 && !userBadges.find(b => b.id === 'xp-100')) newBadges.push(badges['xp-100']);
      if (newTotalXP >= 500 && !userBadges.find(b => b.id === 'xp-500')) newBadges.push(badges['xp-500']);
      if (newTotalXP >= 1000 && !userBadges.find(b => b.id === 'xp-1000')) newBadges.push(badges['xp-1000']);
      if (newMissionsCompleted >= 10 && !userBadges.find(b => b.id === 'missions-10')) newBadges.push(badges['missions-10']);
      if (newMissionsCompleted >= 50 && !userBadges.find(b => b.id === 'missions-50')) newBadges.push(badges['missions-50']);
      if (newStreak >= 7 && !userBadges.find(b => b.id === 'streak-7')) newBadges.push(badges['streak-7']);
      if (newStreak >= 30 && !userBadges.find(b => b.id === 'streak-30')) newBadges.push(badges['streak-30']);

      // --- Database Updates ---
      // 1. Update counters subcollection
      trx.set(countersRef, {
        xp: newTotalXP,
        missionsCompleted: newMissionsCompleted,
        lastCompletionDate: Date.now(),
        streak: newStreak
      }, { merge: true });

      // 2. Update main user document with xp, streak, and any new badges
      const userUpdatePayload = {
          xp: newTotalXP,
          trainingStreak: newStreak,
      };
      if (newBadges.length > 0) {
        userUpdatePayload.badges = admin.firestore.FieldValue.arrayUnion(...newBadges);
      }
      trx.update(userRef, userUpdatePayload);

      // 3. Create notifications (outside of transaction)
      const missionCompletionNotif = {
        title: "Mission Complete! ✅",
        body: `You just earned +${xp} XP for completing: ${after.title}`,
        type: "mission",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        link: `/missions`,
        meta: { goalId, missionId, xp },
      };
      notificationsRef.add(missionCompletionNotif);

      newBadges.forEach(badge => {
        const badgeNotif = {
            title: "Badge Unlocked! 🏆",
            body: `You earned the "${badge.name}" badge. Keep up the grind!`,
            type: "badge",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            link: `/player/${uid}`,
            meta: { badgeId: badge.id },
        };
        notificationsRef.add(badgeNotif);
      });
    });
  });

exports.onMissionCreated = functions.firestore
    .document("users/{uid}/goals/{goalId}/missions/{missionId}")
    .onCreate(async (snap, context) => {
        const { uid, goalId, missionId } = context.params;
        const mission = snap.data();
        if (!mission) return;

        const notification = {
            userId: uid,
            title: "New Mission Added 🎯",
            body: `Coach M2DG just assigned: ${mission.title || "a new goal"}`,
            type: "mission",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            link: `/missions`,
            meta: { goalId, missionId },
        };

        await db.collection("users").doc(uid).collection("notifications").add(notification);
    });

exports.onMilestoneXP = functions.firestore
    .document("users/{uid}/counters/main")
    .onUpdate(async (change, context) => {
        const before = change.before.data() || {};
        const after = change.after.data() || {};
        const prevXP = typeof before.xp === "number" ? before.xp : 0;
        const nextXP = typeof after.xp === "number" ? after.xp : 0;

        const prevMilestone = Math.floor(prevXP / 100);
        const nextMilestone = Math.floor(nextXP / 100);

        if (nextMilestone <= prevMilestone) return;

        const { uid } = context.params;
        const notification = {
            userId: uid,
            title: "XP Milestone 💥",
            body: `You just hit ${nextMilestone * 100} XP. Keep pushing!`,
            type: "xp",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            link: `/player/${uid}`,
            meta: { xp: nextXP },
        };

        await db.collection("users").doc(uid).collection("notifications").add(notification);
    });

// Export new notification functions
const { onNewNotification } = require('./notifications');
exports.onNewNotification = onNewNotification;

const { onMissionComplete: onMissionCompleteV2 } = require('./onMissionComplete');
exports.onMissionCompleteV2 = onMissionCompleteV2;
