
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import * as admin from 'firebase-admin';

// Initialize a single instance of Firestore
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();


const Input = z.object({
  userId: z.string(),
  goal: z.object({
    title: z.string(),
    focusArea: z.enum(['handles','shooting','conditioning','iq','defense','vertical','other']),
    dueAt: z.number().optional()
  })
});

const Output = z.object({
  createdGoalId: z.string(),
  createdMissions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    xp: z.number()
  }))
});

export type MissionsFlowInput = z.infer<typeof Input>;
export type MissionsFlowOutput = z.infer<typeof Output>;

export const missionsFlow = ai.defineFlow(
  { name: 'missionsFlow', inputSchema: Input, outputSchema: Output },
  async ({ userId, goal }) => {
    // read last 10 messages to personalize
    const memSnap = await db.collection('aiTrainerMemory').doc(userId)
      .collection('messages').orderBy('timestamp','desc').limit(10).get();
    const history = memSnap.docs.reverse().map(d => d.data()).filter(m => typeof m.content === 'string');

    const system = `You are Coach M2DG, an elite basketball trainer.
Generate 5 concise daily missions aligned to the player's goal.
No markdown, no lists like 1), just bullet-like lines separated by newline.
Each mission must include: short title, type (reps/time/skill/checkin/video), target number if relevant, and difficulty 1-3.
Keep it actionable, gym-or-street friendly, 15–30 minutes each.`;

    const prompt = `Goal: ${goal.title} (${goal.focusArea})
Recent chat context:
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n').slice(0, 2000)}

Return JSON:
{ "missions": [ { "title": "", "type":"reps|time|skill|checkin|video", "target": 0, "unit": "shots|mins|reps", "difficulty": 1|2|3 } ] }`;

    const resp = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      system,
      prompt,
      config: { temperature: 0.7 }
    });

    const parsed = JSON.parse(resp.text || '{"missions":[]}');
    const now = Date.now();

    // create goal doc
    const goalRef = db.collection('users').doc(userId).collection('goals').doc();
    await goalRef.set({
      id: goalRef.id,
      title: goal.title,
      focusArea: goal.focusArea,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      dueAt: goal.dueAt ?? null
    });

    const missionsCol = goalRef.collection('missions');
    const batch = db.batch();
    const created: {id:string,title:string,xp:number}[] = [];

    for (const m of (parsed.missions ?? []).slice(0,5)) {
      const id = missionsCol.doc().id;
      const xp = m.difficulty === 3 ? 100 : m.difficulty === 2 ? 50 : 25;
      batch.set(missionsCol.doc(id), {
        id,
        goalId: goalRef.id,
        title: m.title,
        description: `${m.target ? `${m.target} ${m.unit||''}`.trim() : ''}`,
        type: m.type,
        difficulty: m.difficulty,
        xp,
        status: 'todo',
        progress: m.target ? { current: 0, target: m.target, unit: m.unit||null } : null,
        createdAt: now
      });
      created.push({ id, title: m.title, xp });
    }
    await batch.commit();

     // Initialize XP counter if missing
    const counterRef = db.collection('users').doc(userId).collection('counters').doc('main');
    await counterRef.set(
      { xp: 0, streak: 0, missionsCompleted: 0, lastCompletionDate: null },
      { merge: true }
    );

    return { createdGoalId: goalRef.id, createdMissions: created };
  }
);
