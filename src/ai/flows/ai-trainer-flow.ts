
'use server';
/**
 * @fileOverview The AI logic for the personalized basketball trainer with dynamic emotion and voice.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

export type Emotion = 'hype' | 'calm' | 'focused' | 'encouraging' | 'neutral';

const AITrainerInputSchema = z.object({
  prompt: z.string().describe("The user's message to the AI trainer."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe("The recent conversation history."),
  voice: z.boolean().optional().describe("Whether to generate audio for the reply."),
});
export type AITrainerInput = z.infer<typeof AITrainerInputSchema>;

const AITrainerOutputSchema = z.object({
  reply: z.string().describe("The AI trainer's text response."),
  audioUrl: z.string().nullable().describe("A data URI for the audio response, if requested."),
  emotion: z.custom<Emotion>().describe("The detected emotion of the reply."),
});
export type AITrainerOutput = z.infer<typeof AITrainerOutputSchema>;

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

const detectEmotion = (reply: string): Emotion => {
  if (/🔥|let’s get this work|lock in|grind|push|energy|game|intensity|beast/i.test(reply)) return "hype";
  if (/recover|breathe|focus|calm|relax|reflection|mindfulness/i.test(reply)) return "calm";
  if (/analyze|defense|strategy|plan|breakdown|technique|form/i.test(reply)) return "focused";
  if (/proud|progress|confidence|believe|you got this|keep going/i.test(reply)) return "encouraging";
  return "neutral";
}

const getVoiceForEmotion = (emotion: Emotion): string => {
  switch (emotion) {
    case 'hype': return 'Taurus';
    case 'calm': return 'Algenib';
    case 'focused': return 'Achernar';
    case 'encouraging': return 'Canopus';
    default: return 'Algenib';
  }
}

export const aiTrainerFlow = ai.defineFlow(
  {
    name: 'aiTrainerFlow',
    inputSchema: AITrainerInputSchema,
    outputSchema: AITrainerOutputSchema,
  },
  async (input) => {
    const { prompt, history = [], voice } = input;
    const conversationHistory = history.map(h => ({ role: h.role, content: h.content }));

    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: prompt,
      history: conversationHistory,
      system: `You are "Coach M2DG" — an elite, motivational basketball trainer.
      Speak naturally and clearly, like a real mentor or gym coach.
      Your tone should be confident, friendly, and authentic.
      IMPORTANT: Do NOT use markdown, stars (*), or double asterisks (**). Format your response as plain text with clean spacing.
      Switch your tone based on the user's needs: "Hype" for motivation, "Calm" for recovery, "Focused" for strategy, "Encouraging" for confidence boosts.
      Use emojis for energy and emphasis (e.g., 🔥, 🏀, 💪🏽), but keep it genuine.
      Do not use numbered lists. Instead, explain concepts in a conversational flow.
      End your messages with a short, powerful motivational sign-off like "Lock in.", "Let's get this work.", or "Stay ready."
      `,
      config: { temperature: 0.9 },
    });

    const reply = response.text || 'Let’s lock in and get this work 💪🏽 You got this.';
    const emotion = detectEmotion(reply);

    let audioUrl: string | null = null;
    if (voice) {
      try {
        const { media } = await ai.generate({
          model: googleAI.model('gemini-2.5-flash-preview-tts'),
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: getVoiceForEmotion(emotion) } },
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
      }
    }

    return { reply, audioUrl, emotion };
  }
);
