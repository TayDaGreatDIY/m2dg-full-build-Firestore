
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage || !latestMessage.content) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }
    
    // Call the non-streaming AI flow
    const flowResult = await aiTrainerFlow({ prompt: latestMessage.content });

    // Return the complete reply as a single JSON object
    // The `ai/react` `useChat` hook can handle this format automatically.
    return NextResponse.json(flowResult.reply);

  } catch (error) {
    console.error("Error in AI Trainer API:", error);
    const err = error as Error;
    // Ensure a proper error response is sent
    return NextResponse.json({ error: err.message || "An unexpected error occurred." }, { status: 500 });
  }
}
