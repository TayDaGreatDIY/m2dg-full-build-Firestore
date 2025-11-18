
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
    // Use the user's ID as the check-in ID to easily find/update it if needed, or just create a new one.
    const checkinRef = courtRef.collection('checkins').doc(); 

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    // --- Transaction to ensure atomicity ---
    const xpGained = 25;
    const { newStreak } = await db.runTransaction(async (transaction) => {
        const userData = (await transaction.get(userRef)).data();
        if (!userData) {
            throw new Error("User data could not be retrieved inside transaction.");
        }
        
        let currentStreak = userData?.trainingStreak || 0;
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
            // If the last check-in was yesterday, increment streak
            if (lastCheckIn.toDateString() === yesterday.toDateString()) {
                currentStreak++;
            } 
            // If last check-in was NOT today (and not yesterday), reset streak
            else if (lastCheckIn.toDateString() !== now.toDateString()) {
                currentStreak = 1;
            }
            // If last check-in was today, streak remains the same
        } else {
            currentStreak = 1; // First check-in
        }

        // 1. Update user document
        transaction.update(userRef, {
            xp: FieldValue.increment(xpGained),
            trainingStreak: currentStreak,
            lastCheckIn: FieldValue.serverTimestamp(),
            currentCourtId: courtId,
        });

        // 2. Create new check-in document
        transaction.set(checkinRef, {
            userId: userId,
            timestamp: FieldValue.serverTimestamp(),
            user: { // Denormalize user data for easier display in feeds
                uid: userId,
                displayName: userData?.displayName || 'Unknown Player',
                avatarURL: userData?.avatarURL || '',
            }
        });

        return { newStreak: currentStreak };
    });

    return NextResponse.json({ success: true, message: "Checked in successfully!", xpGained, newStreak }, { status: 200 });

  } catch (error: any) {
    console.error('Check-in API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}

    