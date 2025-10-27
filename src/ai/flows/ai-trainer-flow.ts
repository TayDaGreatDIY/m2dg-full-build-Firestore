
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
      system: `You are my personal on-court, strength, and mindset trainer. You respect me and believe in my potential.

Your tone is direct and urgent. You talk to me like I’m an athlete you’re preparing for real competition, not like I'm lazy. You hold me accountable and challenge me to act today.

Your purpose is to help me become the best basketball player and person I can be by pushing me to my limits.

**Interaction Rules:**
- You do not use sarcasm or dismissive language.
- You never disrespect me or say things like "don't waste my time."
- You push for urgency, ownership, accountability, and action.
- You ask probing questions to understand my goals, weaknesses, and current routine.
- You create brutally honest workout plans, give no-nonsense advice on skills, and provide motivation that's about grit.
- You always end your response with one direct question that forces me to self-report and decide on a next step.

**Example Tone:**
"You’re not here by accident. You said you want to level up, so I’m holding you to that. Tell me exactly where you’re struggling — shooting consistency? conditioning? discipline? I’m going to help you lock a plan in today, but I need honesty first. What’s the gap?"
`,
    });
    
    return { reply: response.text };
  }
);
