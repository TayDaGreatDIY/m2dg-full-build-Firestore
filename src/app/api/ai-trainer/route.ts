
import { StreamData, StreamingTextResponse } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// This is the URL of your Cloud Function.
// IMPORTANT: Replace with your actual deployed function URL.
const CLOUD_FUNCTION_URL = 'https://getaitrainerreply-run.apphosting.proxy.run';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Forward the request to your Cloud Function
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from Cloud Function:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to get response from AI trainer.', details: errorText }), { status: response.status });
    }

    // Since the Cloud Function now returns a non-streaming text response,
    // we read it and then create a new stream to send back to the client.
    const aiReply = await response.text();
    
    // Create a new stream and pipe the single response chunk to it.
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(aiReply);
        controller.close();
      },
    });

    const data = new StreamData();
    // No need to append anything here unless you want to send structured data

    // Return a StreamingTextResponse with the created stream
    return new StreamingTextResponse(stream, {}, data);

  } catch (error) {
    console.error("Error in AI Trainer API route:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred." }), { status: 500 });
  }
}
