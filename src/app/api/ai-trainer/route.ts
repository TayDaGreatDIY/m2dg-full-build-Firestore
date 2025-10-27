
import { NextResponse } from 'next/server';
import { getTrainerReply } from '@/ai/trainerModel';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json({ reply: 'Invalid message provided.' }, { status: 400 });
    }

    // Await the full response from the AI model helper
    const aiReply = await getTrainerReply(userMessage);

    // Return the complete reply as a single JSON object
    return NextResponse.json({ reply: aiReply });

  } catch (error) {
    console.error("Error in AI Trainer API:", error);
    // Return a generic error message to the user
    return NextResponse.json(
        { reply: "I'm having trouble right now. Please try again in a moment." }, 
        { status: 500 }
    );
  }
}
