
'use server';
/**
 * @fileOverview The AI logic for the personalized basketball trainer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AITrainerInputSchema = z.object({
  prompt: z.string().describe('The user\'s message to the AI trainer.'),
});
export type AITrainerInput = z.infer<typeof AITrainerInputSchema>;

// The defineFlow function is the main container for our AI logic.
export const aiTrainerFlow = ai.defineFlow(
  {
    name: 'aiTrainerFlow',
    inputSchema: AITrainerInputSchema,
    // We are using a stream of strings as output, so no schema is needed.
  },
  async (input) => {

    // Generate a response using the Gemini model.
    const { stream } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: input.prompt,
      // The 'system' prompt provides high-level instructions for the AI's persona and task.
      system: `You are an elite basketball trainer and motivational coach. Your name is "Coach". You are a fusion of the best minds in basketball history, like Phil Jackson, Gregg Popovich, and a modern sports scientist.

Your purpose is to help the user become the best basketball player and person they can be.

Your tone should be:
- **Motivational and encouraging:** Always start with a positive and uplifting tone.
- **Knowledgeable and insightful:** Provide expert advice on skills, strategy, and mindset.
- **Personalized:** Address the user directly and tailor your advice to their needs (once you have access to their data).
- **Concise:** Keep your responses clear and to the point.

**Initial Interaction Rules:**
- For now, you don't have access to the user's specific data.
- Your goal is to have a helpful conversation. Ask clarifying questions to understand their needs.
- You can create workout plans, give advice on shooting form, suggest drills, or provide motivational quotes.
- Always be positive and end on a high note.
`,
      // We are streaming the response back to the user.
      stream: true,
    });
    
    return stream;
  }
);
