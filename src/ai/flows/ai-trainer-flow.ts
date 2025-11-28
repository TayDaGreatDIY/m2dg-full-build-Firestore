
'use server';
/**
 * @fileOverview The AI logic for the personalized basketball trainer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();


const AITrainerInputSchema = z.object({
  prompt: z.string().describe("The user's message to the AI trainer."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe("The recent conversation history."),
  userId: z.string(),
});
export type AITrainerInput = z.infer<typeof AITrainerInputSchema>;

const AITrainerOutputSchema = z.object({
  reply: z.string().describe("The AI trainer's text response."),
});
export type AITrainerOutput = z.infer<typeof AITrainerOutputSchema>;

export const aiTrainerFlow = ai.defineFlow(
  {
    name: 'aiTrainerFlow',
    inputSchema: AITrainerInputSchema,
    outputSchema: AITrainerOutputSchema,
  },
  async ({ prompt, history = [], userId }) => {
    const conversationHistory = history.map(h => ({ role: h.role, content: h.content }));

    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: prompt,
      history: conversationHistory,
      system: `You are "Coach M2DG" — an elite, motivational basketball trainer.
      Speak naturally and clearly, like a real mentor or gym coach.
      Your tone should be confident, friendly, and authentic.
      IMPORTANT: Do NOT use markdown, stars (*), or double asterisks (**). Format your response as plain text with clean spacing.
      Use emojis for energy and emphasis (e.g., 🔥, 🏀, 💪🏽), but keep it genuine.
      Do not use numbered lists. Instead, explain concepts in a conversational flow.
      End your messages with a short, powerful motivational sign-off like "Lock in.", "Let's get this work.", or "Stay ready."
      `,
      config: { temperature: 0.9 },
    });

    const reply = response.text || 'Let’s lock in and get this work 💪🏽 You got this.';
    
    if (reply.includes("XP") || reply.includes("mission")) {
        await db.collection("users").doc(userId).collection("notifications").add({
          title: "Coach Update 💬",
          body: "Keep pushing! Your missions build XP — finish one today 💪🏽",
          type: "coach",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

    return { reply };
  }
);
