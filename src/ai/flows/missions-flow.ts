
'use server';
/**
 * @fileOverview Generates weekly basketball missions for a user based on their goals.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { addDoc, collection, serverTimestamp, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { firestore } from '@/firebase'; // Assuming you have a central firebase export
import { googleAI } from '@genkit-ai/google-genai';

// 1. Define Input Schema
const MissionsInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting missions.'),
  playerInput: z.string().describe("The user's stated goal, e.g., 'I want to improve my three-point shooting.'"),
});
export type MissionsInput = z.infer<typeof MissionsInputSchema>;

// 2. Define AI Output Schema (for a single mission)
const MissionSchema = z.object({
    title: z.string().describe("A short, actionable title for the mission. e.g., 'Make 50 Free Throws'"),
    description: z.string().describe("A one-sentence description of the mission."),
    xpValue: z.number().describe("The XP value of completing the mission, from 10 to 50."),
});

const MissionsOutputSchema = z.object({
  goalTitle: z.string().describe("A short, motivational title for the overall weekly goal. e.g., 'Sharpshooter's Challenge'"),
  missions: z.array(MissionSchema).length(3).describe('An array of exactly 3 missions for the week.'),
});
export type MissionsOutput = z.infer<typeof MissionsOutputSchema>;

// 3. Define the Prompt
const generateMissionsPrompt = ai.definePrompt({
    name: 'generateMissionsPrompt',
    input: { schema: z.object({ playerInput: z.string() }) },
    output: { schema: MissionsOutputSchema },
    prompt: `You are Coach M2DG, an elite basketball trainer. A player has a new goal.
    Based on their goal: "{{playerInput}}", create a motivational weekly goal title and generate exactly 3 distinct, actionable basketball training missions they can complete.
    Each mission should have a clear title, a short description, and an appropriate XP value between 10 and 50 based on its difficulty.
    Return the response in the specified JSON format.
    `,
    config: {
        temperature: 0.8,
    }
});


// 4. Define the Main Flow
export const missionsFlow = ai.defineFlow(
  {
    name: 'missionsFlow',
    inputSchema: MissionsInputSchema,
    outputSchema: z.object({}), // Flow will write to DB, not return data to client directly
  },
  async ({ userId, playerInput }) => {
    console.log(`Generating missions for user ${userId} with input: "${playerInput}"`);

    // Step 1: Invalidate previous 'in-progress' goals
    const goalsRef = collection(firestore, 'users', userId, 'goals');
    const q = query(goalsRef, where('status', '==', 'in-progress'));
    const oldGoalsSnapshot = await getDocs(q);
    
    if (!oldGoalsSnapshot.empty) {
        const batch = writeBatch(firestore);
        oldGoalsSnapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'expired' });
        });
        await batch.commit();
        console.log(`Expired ${oldGoalsSnapshot.size} old goals for user ${userId}.`);
    }

    // Step 2: Generate new missions from the AI model
    const { output } = await generateMissionsPrompt({ playerInput });

    if (!output) {
      throw new Error('AI failed to generate missions.');
    }
    
    console.log('AI Generated Output:', output);

    // Step 3: Add the new goal document to Firestore
    const newGoal = {
      title: output.goalTitle,
      status: 'in-progress',
      createdAt: serverTimestamp(),
      missions: output.missions.map(mission => ({
        ...mission,
        id: crypto.randomUUID(),
        status: 'in-progress',
      })),
    };

    await addDoc(goalsRef, newGoal);
    console.log(`New goal "${newGoal.title}" saved for user ${userId}.`);

    return {}; // Return empty object as success indicator
  }
);
