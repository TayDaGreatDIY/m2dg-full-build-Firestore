
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';
import { StreamingTextResponse, StreamData } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];
    
    // The flow returns a stream of objects with a 'text' property
    const flowStream = await aiTrainerFlow({ prompt: latestMessage.content });

    // We need to transform this into a stream of plain text for the UI
    const textStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of flowStream) {
          // Extract the text content from each chunk
          if (chunk.text) {
            controller.enqueue(chunk.text);
          }
        }
        controller.close();
      },
    });

    // Return a StreamingTextResponse with the transformed text stream
    return new StreamingTextResponse(textStream);

  } catch (error) {
    console.error("Error in AI Trainer API:", error);
    const err = error as Error;
    // Ensure a proper error response is sent
    return new Response(JSON.stringify({ error: err.message || "An unexpected error occurred." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
