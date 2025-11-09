
'use server';
/**
 * @fileOverview The AI logic for the personalized basketball trainer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const AITrainerInputSchema = z.object({
  prompt: z.string().describe('The user\'s message to the AI trainer.'),
  userId: z.string().optional().describe('The user\'s ID for logging purposes.'),
});
export type AITrainerInput = z.infer<typeof AITrainerInputSchema>;

const AITrainerOutputSchema = z.object({
  reply: z.string().describe('The AI trainer\'s response.'),
});
export type AITrainerOutput = z.infer<typeof AITrainerOutputSchema>;

// The defineFlow function is the main container for our AI logic.
export const aiTrainerFlow = ai.defineFlow(
  {
    name: 'aiTrainerFlow',
    inputSchema: AITrainerInputSchema,
    outputSchema: AITrainerOutputSchema,
  },
  async (input) => {

    // Generate a response using the Gemini model.
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: input.prompt,
      // The 'system' prompt provides high-level instructions for the AI's persona and task.
      system: `You are "Coach GPT", the official AI trainer for the Married 2 Da Game (M2DG) basketball platform.
You help players improve their game, fitness, and mindset through motivational guidance and performance coaching.
Always speak in a supportive, realistic tone, with personality — part trainer, part mentor.`,
    });

    const reply = response.text;
    
    // Optional: log conversation in Firestore
    if (input.userId) {
      try {
        const db = getFirestore();
        await db.collection("aiTrainerLogs").add({
            userId: input.userId,
            prompt: input.prompt,
            reply: reply,
            createdAt: new Date(),
        });
      } catch (e) {
          console.error("Error logging to Firestore:", e);
          // Don't block the reply if logging fails
      }
    }
    
    return { reply };
  }
);
