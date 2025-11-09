'use server';

import { moderateContent } from '@/ai/flows/moderate-content-flow';

/**
 * Calls the deployed Firebase AI Trainer Function to get a response.
 * This securely routes messages through your getAITrainerReply endpoint.
 * 
 * @param userMessage The message from the user.
 * @returns A promise that resolves to the AI's reply string.
 */
export async function getTrainerReply(userMessage: string): Promise<string> {
  // Step 1: Content moderation first
  const moderationResult = await moderateContent(userMessage);
  if (!moderationResult.passed) {
    return "I can't respond to that. Let's keep the conversation respectful and focused on basketball.";
  }

  try {
    // Step 2: Call your live Firebase AI Trainer Function
    // Replace this URL with your actual function URL after deployment
    const response = await fetch(
      "https://getaitrainerreply-qhmdrry7ca-uc.a.run.app",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      }
    );

    if (!response.ok) {
      console.error("Trainer API Error:", response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return `Hmm, I couldn’t reach the trainer right now. (Error: ${errorData.error || response.statusText})`;
    }

    const data = await response.json();

    // Step 3: Extract reply
    return data.reply || "The trainer didn’t respond. Let’s try again!";
  } catch (error) {
    console.error("Error calling getAITrainerReply:", error);
    return "I'm having a bit of trouble connecting right now. Please try again in a moment.";
  }
}
