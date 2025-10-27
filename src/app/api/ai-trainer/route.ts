
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';
import { StreamData } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];
    
    // The flow returns a stream of objects with a 'text' property
    const flowStream = await aiTrainerFlow({ prompt: latestMessage.content });

    const data = new StreamData();

    const stream = new ReadableStream({
      async start(controller) {
        // Pipe the chunks from the AI flow to our response stream
        for await (const chunk of flowStream) {
          if (chunk.text) {
             controller.enqueue(chunk.text);
          }
        }
        controller.close();
        data.close();
      },
    });

    // Return a standard Response with the correct headers for streaming
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
        }
    });

  } catch (error) {
    console.error("Error in AI Trainer API:", error);
    const err = error as Error;
    // Ensure a proper error response is sent
    return new Response(JSON.stringify({ error: err.message || "An unexpected error occurred." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
