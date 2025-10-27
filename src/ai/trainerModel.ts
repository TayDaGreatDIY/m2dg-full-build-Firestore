
'use server';

import OpenAI from 'openai';
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';
import { moderateContent } from '@/ai/flows/moderate-content-flow';

/**
 * Calls the AI model to get a response based on the user's message.
 * This is a placeholder and should be replaced with a real model call.
 * 
 * @param userMessage The message from the user.
 * @returns A promise that resolves to the AI's reply string.
 */
export async function getTrainerReply(userMessage: string): Promise<string> {
  const moderationResult = await moderateContent(userMessage);
    if (!moderationResult.passed) {
      return "I can't respond to that. Let's keep the conversation respectful and focused on basketball.";
    }
  
  try {
    const { reply } = await aiTrainerFlow({ prompt: userMessage });
    return reply;
  } catch (error) {
    console.error("Error calling AI trainer flow:", error);
    return "I'm having a bit of trouble connecting right now. Please try again in a moment.";
  }
}
