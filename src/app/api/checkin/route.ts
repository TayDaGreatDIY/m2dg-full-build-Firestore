
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    const { userId, courtId } = await request.json();

    if (!userId || !courtId) {
      return NextResponse.json({ success: false, error: 'Missing userId or courtId' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(userId);
    const courtRef = db.collection('courts').doc(courtId);
    const checkinRef = courtRef.collection('checkins').doc();

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    // --- Transaction to ensure atomicity ---
    await db.runTransaction(async (transaction) => {
        const userData = userDoc.data();
        let newStreak = userData?.trainingStreak || 0;
        const lastCheckIn = userData?.lastCheckIn?.toDate();
        const now = new Date();
        
        // Cooldown check: prevent check-in if last one was less than 2 hours ago
        if (lastCheckIn) {
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            if (lastCheckIn > twoHoursAgo) {
                throw new Error("You can only check in once every 2 hours.");
            }
        }

        // Streak logic
        if (lastCheckIn) {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            if (lastCheckIn.toDateString() === yesterday.toDateString()) {
                newStreak++; // Incremented streak
            } else if (lastCheckIn.toDateString() !== now.toDateString()) {
                newStreak = 1; // Reset streak
            }
        } else {
            newStreak = 1; // First check-in
        }

        // 1. Update user document
        transaction.update(userRef, {
            xp: FieldValue.increment(25),
            trainingStreak: newStreak,
            lastCheckIn: FieldValue.serverTimestamp(),
            currentCourtId: courtId,
        });

        // 2. Create new check-in document
        transaction.set(checkinRef, {
            userId: userId,
            timestamp: FieldValue.serverTimestamp(),
            user: { // Denormalize user data for feed
                uid: userId,
                displayName: userData?.displayName || 'Unknown Player',
                avatarURL: userData?.avatarURL || '',
            }
        });
    });

    return NextResponse.json({ success: true, message: "Checked in successfully!", xpGained: 25 }, { status: 200 });

  } catch (error: any) {
    console.error('Check-in API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
