
'use server';
/**
 * @fileOverview The AI logic for the personalized basketball trainer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

const AITrainerInputSchema = z.object({
  prompt: z.string().describe("The user's message to the AI trainer."),
  userId: z.string().describe("The user's ID for session memory."),
  firestore: z.any().describe('The firestore instance'),
});
export type AITrainerInput = z.infer<typeof AITrainerInputSchema>;

const AITrainerOutputSchema = z.object({
  reply: z.string().describe("The AI trainer's response."),
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
    const { userId, prompt, firestore } = input;
    if (!userId) throw new Error('User ID is required to use the AI Trainer.');
    if (!firestore) throw new Error('Firestore instance is required.');

    const db = firestore as Firestore;

    // 1. Retrieve conversation history
    const memoryRef = query(
      collection(db, 'aiTrainerMemory', userId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const memorySnapshot = await getDocs(memoryRef);
    const memoryMessages = memorySnapshot.docs
      .reverse()
      .map((doc) => doc.data());

    const chatHistory = memoryMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2. Generate a response using the Gemini model with conversation history
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      history: chatHistory,
      system: `You are "Coach M2DG" — an elite, motivational basketball trainer for the Married 2 Da Game (M2DG) app.
      Speak naturally, like a real mentor or gym coach.
      Your tone should be confident, friendly, and authentic.
      IMPORTANT: Do NOT use markdown, stars (*), or double asterisks (**). Format your response as plain text with clean spacing.
      Use emojis for energy and emphasis (e.g., 🔥, 🏀, 💪🏽), but keep it genuine.
      Do not use numbered lists. Instead, explain concepts in a conversational flow.
      End your messages with a short, powerful motivational sign-off.
      
      Example Tone:
      - "Alright, champ — we’re about to fire up those legs 🔥 Let's get into this..."
      - "You’re not just training, you’re building habits 💪🏽 That's what separates the good from the great."

      Example Sign-offs:
      - "Lock in."
      - "Let’s get this work."
      - "Stay ready."
      `,
      config: {
        temperature: 0.9,
      },
    });

    const reply =
      response.text || 'Let’s lock in and get this work 💪🏽 You got this.';

    // 3. Store the new user message and AI reply in Firestore
    const messageColRef = collection(db, 'aiTrainerMemory', userId, 'messages');

    await addDoc(messageColRef, {
      role: 'user',
      content: prompt,
      timestamp: serverTimestamp(),
    });

    await addDoc(messageColRef, {
      role: 'assistant',
      content: reply,
      timestamp: serverTimestamp(),
    });

    return { reply };
  }
);

export const retrieveHistoryFlow = ai.defineFlow(
  {
    name: 'retrieveHistoryFlow',
    inputSchema: z.object({
      userId: z.string(),
      firestore: z.any(),
    }),
    outputSchema: z.any(),
  },
  async ({ userId, firestore }) => {
    if (!userId) {
      console.log('No user ID provided, skipping history retrieval.');
      return { history: [] };
    }
    if (!firestore) {
      console.error('Firestore instance not provided');
      return { history: [] };
    }

    const db = firestore as Firestore;
    const memoryRef = query(
      collection(db, 'aiTrainerMemory', userId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const memorySnapshot = await getDocs(memoryRef);
    const history = memorySnapshot.docs.reverse().map((doc) => doc.data());

    return { history };
  }
);
