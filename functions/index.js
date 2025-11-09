/**
* Import function triggers from their respective submodules:
*
* const {onCall} = require("firebase-functions/v2/https");
* const {onDocumentWritten} = require("firebase-functions/v2/firestore");
*
* See a full list of supported triggers at https://firebase.google.com/docs/functions
*/

// Firebase Functions + logger
const { setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin SDK
admin.initializeApp();

// OpenAI SDK
const OpenAI = require("openai");

// Create OpenAI client using the secret we stored with `firebase functions:config:set`
const openai = new OpenAI({
    apiKey: functions.config().openai.key,
});

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// ======================================================
// Health check / test endpoint (optional)
// You can hit this to confirm Functions are alive.
// ======================================================
exports.helloWorld = onRequest((req, res) => {
    logger.info("Hello from Firebase Functions helloWorld()", {
        structuredData: true,
    });
    res.json({ ok: true, message: "Firebase Functions are live." });
});


// ======================================================
// M2DG AI Trainer API Route
// This is the function your Next.js app will call from `/api/ai-trainer`.
// ======================================================
exports.getAiTrainerReply = onRequest(
    { cors: true }, // Enable CORS for client-side requests
    async (req, res) => {
        // Allow only POST to control usage
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Only POST requests are accepted' });
        }

        try {
            const { messages } = req.body;

            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ error: 'Request body must be { messages: [...] }' });
            }

            logger.info("getAiTrainerReply called with messages:", messages);

            // Call OpenAI using the official Node.js library
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are my personal on-court, strength, and mindset trainer. You respect me and believe in my potential.

Your tone is direct and urgent. You talk to me like I’m an athlete you’re preparing for real competition, not like I'm lazy. You hold me accountable and challenge me to act today.

Your purpose is to help me become the best basketball player and person I can be by pushing me to my limits.

**Interaction Rules:**
- You do not use sarcasm or dismissive language.
- You never disrespect me or say things like "don't waste my time."
- You push for urgency, ownership, accountability, and action.
- You ask probing questions to understand my goals, weaknesses, and current routine.
- You create brutally honest workout plans, give no-nonsense advice on skills, and provide motivation that's about grit.
- You always end your response with one direct question that forces me to self-report and decide on a next step.

**Example Tone:**
"You’re not here by accident. You said you want to level up, so I’m holding you to that. Tell me exactly where you’re struggling — shooting consistency? conditioning? discipline? I’m going to help you lock a plan in today, but I need honesty first. What’s the gap?"
`
                    },
                    ...messages, // Spread the incoming messages from the client
                ],
                temperature: 0.7,
            });

            const replyText = completion.choices?.[0]?.message?.content || "I'm here. Give me your position, age, schedule, and goal so I can build your plan.";
            
            // Respond directly with the AI's reply text
            res.status(200).send(replyText);

        } catch (err) {
            logger.error("Error in getAiTrainerReply:", err);
            res.status(500).json({ error: "Trainer is unavailable right now. Try again in a moment." });
        }
    }
);

// ======================================================
// Backfill Court Coordinates Cloud Function
// This callable function iterates through courts and updates their GPS coordinates.
// ======================================================
exports.backfillCourtCoordinates = onCall(async (data, context) => {
  // Optional: Check if the user is an admin
  // if (!context.auth || context.auth.token.role !== 'admin') {
  //   throw new functions.https.HttpsError('permission-denied', 'Must be an admin to run this operation.');
  // }
  
  const db = admin.firestore();
  const courtsRef = db.collection("courts");
  const snapshot = await courtsRef.get();

  const updates = [];
  const promises = [];

  for (const doc of snapshot.docs) {
    const court = doc.data();
    // Check if latitude or longitude is missing
    if (!court.latitude || !court.longitude) {
      const address = encodeURIComponent(court.address || `${court.name}, ${court.city}`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${address}`;

      logger.info(`Geocoding court: ${court.name} with address: ${address}`);

      const promise = axios.get(url, { headers: { 'User-Agent': 'M2DG-App-Firebase-Function/1.0' } })
        .then(response => {
          const location = response.data?.[0];
          if (location && location.lat && location.lon) {
            logger.info(`Found coordinates for ${court.name}: ${location.lat}, ${location.lon}`);
            updates.push({ name: court.name, success: true, lat: location.lat, lon: location.lon });
            return doc.ref.update({
              latitude: parseFloat(location.lat),
              longitude: parseFloat(location.lon),
            });
          } else {
            logger.warn(`No location found for ${court.name}`);
            updates.push({ name: court.name, success: false, reason: "No location found" });
            return Promise.resolve();
          }
        })
        .catch(error => {
          logger.error(`Error geocoding ${court.name}:`, error.message);
          updates.push({ name: court.name, success: false, reason: error.message });
          return Promise.resolve();
        });
        
      promises.push(promise);
    }
  }

  await Promise.all(promises);

  logger.info("Backfill complete. Results:", updates);
  return { status: "Complete", updates };
});
