
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';
import { StreamingTextResponse } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];

    const stream = await aiTrainerFlow({ prompt: latestMessage.content });

    const textStream = new ReadableStream({
      async pull(controller) {
        for await (const chunk of stream) {
          controller.enqueue(chunk.text);
        }
        controller.close();
      },
    });
    
    return new StreamingTextResponse(textStream);
  } catch (error) {
    console.error("Error in AI Trainer API:", error);
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
