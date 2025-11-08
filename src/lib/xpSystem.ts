
import { doc, updateDoc, increment, serverTimestamp, getDoc, Firestore } from "firebase/firestore";
import type { User } from './types';

export type Rank = {
    title: string;
    minXp: number;
    nextRankXp: number;
};

const ranks: Omit<Rank, 'nextRankXp'>[] = [
    { title: 'Rookie', minXp: 0 },
    { title: 'Starter', minXp: 100 },
    { title: 'Hooper', minXp: 250 },
    { title: 'Baller', minXp: 500 },
    { title: 'All-Star', minXp: 1000 },
    { title: 'MVP', minXp: 2500 },
    { title: 'Legend', minXp: 5000 },
    { title: 'GOAT', minXp: 10000 },
];

/**
 * Calculates the player's current rank and XP needed for the next rank.
 * @param xp The player's current XP.
 * @returns A Rank object with title, minXp, and nextRankXp.
 */
export function getPlayerRank(xp: number): Rank {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (xp >= ranks[i].minXp) {
            const currentRank = ranks[i];
            const nextRank = ranks[i + 1];
            return {
                ...currentRank,
                nextRankXp: nextRank ? nextRank.minXp : currentRank.minXp,
            };
        }
    }
    // Fallback for XP less than 0, though this shouldn't happen
    return { ...ranks[0], nextRankXp: ranks[1].minXp };
}

/**
 * Safely increments a user's XP in Firestore.
 * This can be called from a client-side event.
 * @param firestore Firestore instance.
 * @param userId The ID of the user to update.
 * @param amount The amount of XP to add.
 */
export async function incrementXP(firestore: any, userId: string, amount: number) {
    if (!firestore || !userId || !amount) {
        console.error("Missing parameters for incrementXP");
        return;
    }
    const userRef = doc(firestore, 'users', userId);

    try {
        await updateDoc(userRef, {
            xp: increment(amount)
        });
    } catch (error) {
        console.error("Error incrementing XP:", error);
    }
}


/**
 * Handles the logic for updating XP and training streaks upon a successful check-in.
 * @param firestore - The Firestore instance.
 * @param user - The current user object from Firestore.
 */
export async function handleCheckInXPAndStreak(firestore: Firestore, user: User) {
    if (!firestore || !user) return;

    const userRef = doc(firestore, 'users', user.uid);
    const today = new Date();
    const lastCheckInDate = user.lastCheckIn?.toDate();

    let newStreak = user.trainingStreak || 0;

    if (lastCheckInDate) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // Check if the last check-in was yesterday
        if (lastCheckInDate.toDateString() === yesterday.toDateString()) {
            newStreak++;
        }
        // If the last check-in was NOT today, reset streak to 1
        else if (lastCheckInDate.toDateString() !== today.toDateString()) {
            newStreak = 1; 
        }
    } else {
        // First check-in ever
        newStreak = 1;
    }

    try {
        await updateDoc(userRef, {
            xp: increment(25),
            trainingStreak: newStreak,
            lastCheckIn: serverTimestamp(),
        });
        console.log(`User ${user.uid} XP and streak updated.`);
    } catch (error) {
        console.error("Error updating XP and streak:", error);
    }
}
