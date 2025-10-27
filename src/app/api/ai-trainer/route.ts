
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];
    
    // The flow now correctly returns a stream of strings
    const flowStream = await aiTrainerFlow({ prompt: latestMessage.content });

    // Create a new readable stream to send to the client
    const readableStream = new ReadableStream({
      async start(controller) {
        // Pipe the chunks from the AI flow to our response stream
        for await (const chunk of flowStream) {
            // The chunk itself is now the text string
            if (chunk) {
               controller.enqueue(new TextEncoder().encode(chunk));
            }
        }
        controller.close();
      },
    });

    // Return a standard Response with the correct headers for streaming
    return new Response(readableStream, {
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
