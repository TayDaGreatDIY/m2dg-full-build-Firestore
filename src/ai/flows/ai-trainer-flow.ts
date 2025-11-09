
'use server';
/**
 * @fileOverview The AI logic for the personalized basketball trainer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const AITrainerInputSchema = z.object({
  prompt: z.string().describe("The user's message to the AI trainer."),
  voice: z.boolean().optional().describe("Whether to generate audio for the reply."),
});
export type AITrainerInput = z.infer<typeof AITrainerInputSchema>;

const AITrainerOutputSchema = z.object({
  reply: z.string().describe("The AI trainer's text response."),
  audioUrl: z.string().nullable().describe("A data URI for the audio response, if requested."),
});
export type AITrainerOutput = z.infer<typeof AITrainerOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// The defineFlow function is the main container for our AI logic.
export const aiTrainerFlow = ai.defineFlow(
  {
    name: 'aiTrainerFlow',
    inputSchema: AITrainerInputSchema,
    outputSchema: AITrainerOutputSchema,
  },
  async (input) => {
    const { prompt, voice } = input;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      system: `You are "Coach M2DG" — an elite, motivational basketball trainer for the Married 2 Da Game (M2DG) app.
      Speak naturally, like a real mentor or gym coach.
      Your tone should be confident, friendly, and authentic.
      IMPORTANT: Do NOT use markdown, stars (*), or double asterisks (**). Format your response as plain text with clean spacing.
      Use emojis for energy and emphasis (e.g., 🔥, 🏀, 💪🏽), but keep it genuine.
      Do not use numbered lists. Instead, explain concepts in a conversational flow.
      End your messages with a short, powerful motivational sign-off.
      
      Example Tone:
      - "Alright, champ — we’re about to fire up those legs 🔥 Let's get into this..."
      - "You’re not just training, you’re building habits 💪🏽 That's what separates the good from the great."

      Example Sign-offs:
      - "Lock in."
      - "Let’s get this work."
      - "Stay ready."
      `,
      config: {
        temperature: 0.9,
      },
    });

    const reply =
      response.text || 'Let’s lock in and get this work 💪🏽 You got this.';

    let audioUrl: string | null = null;
    if (voice) {
        try {
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.5-flash-preview-tts',
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Algenib' },
                        },
                    },
                },
                prompt: reply,
            });

            if (media?.url) {
                const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
                audioUrl = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
            }
        } catch (e) {
            console.error("TTS Generation Error:", e);
            // Don't block the text reply if TTS fails
        }
    }

    return { reply, audioUrl };
  }
);
