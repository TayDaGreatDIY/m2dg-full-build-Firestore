
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
 * This is a placeholder for a secure, server-side implementation (e.g., Cloud Function).
 * @param firestore Firestore instance.
 * @param userId The ID of the user to update.
 * @param amount The amount of XP to add.
 */
export async function incrementXP(firestore: any, userId: string, amount: number) {
    if (!firestore || !userId || !amount) {
        console.error("Missing parameters for incrementXP");
        return;
    }
    const { doc, updateDoc, increment } = await import("firebase/firestore");
    const userRef = doc(firestore, 'users', userId);

    try {
        await updateDoc(userRef, {
            xp: increment(amount)
        });
    } catch (error) {
        console.error("Error incrementing XP:", error);
    }
}
