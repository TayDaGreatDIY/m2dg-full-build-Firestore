
'use server';
/**
 * @fileOverview A content moderation flow.
 *
 * - moderateContent - A function that checks if the content passes moderation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the moderation flow
const ContentModerationInputSchema = z.string();
export type ContentModerationInput = z.infer<typeof ContentModerationInputSchema>;

// Output schema for the moderation flow
const ContentModerationOutputSchema = z.object({
  passed: z.boolean().describe('Whether the content passed the moderation checks.'),
});
export type ContentModerationOutput = z.infer<typeof ContentModerationOutputSchema>;

/**
 * Checks the provided content against safety policies.
 * @param input The text content to moderate.
 * @returns A promise that resolves to an object indicating if the content passed.
 */
export async function moderateContent(input: ContentModerationInput): Promise<ContentModerationOutput> {
  return moderateContentFlow(input);
}

// Define the content moderation flow
const moderateContentFlow = ai.defineFlow(
  {
    name: 'moderateContentFlow',
    inputSchema: ContentModerationInputSchema,
    outputSchema: ContentModerationOutputSchema,
  },
  async (prompt) => {
    try {
      // Use generate for content moderation by checking for a blocked response
      await ai.generate({
        prompt: `Is the following text appropriate for a community sports app? The text must be respectful and free of harassment, bullying, and profanity. Text: "${prompt}"`,
        config: {
          // Strictest setting for safety categories
          safetySettings: [
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_LOW_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            }
          ],
        },
      });
      // If generate() does not throw, content is considered safe
      return { passed: true };
    } catch (e: any) {
        // If the error is due to a safety reason, the content has failed moderation
        if (e.toString().includes('SAFETY')) {
            console.warn('Content moderation failed:', e);
            return { passed: false };
        }
        // For other errors, we can assume it passed or handle differently
        console.error('An unexpected error occurred during content moderation:', e);
        // Fail open or closed? Let's fail closed for safety.
        return { passed: false };
    }
  }
);
