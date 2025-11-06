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
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// OpenAI SDK (for talking to your M2DG Elite Trainer assistant)
const OpenAI = require("openai");
const functions = require("firebase-functions");

// Create OpenAI client using the secret we stored with `firebase functions:config:set`
const client = new OpenAI({
apiKey: functions.config().openai.key,
});

// Your Assistant ID (M2DG Elite Trainer)
const ASSISTANT_ID = "asst_i8nl1KR1dnofb7PXanjxtkeM";

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
// M2DG Elite Trainer endpoint
// This is the function your app will call.
// Send it { "message": "your question" } in the request body.
// It will return { reply: "assistant response" }.
// ======================================================
exports.m2dgTrainer = onRequest(async (req, res) => {
// Allow only POST to control usage
if (req.method !== "POST") {
res.status(405).json({ error: "Use POST. Body must include { message }." });
return;
}

try {
// pull the user's message from the request body
const userMessage = req.body?.message;

if (!userMessage || typeof userMessage !== "string") {
res.status(400).json({
error: "Missing message. Send JSON like { \"message\": \"I need a speed workout\" }",
});
return;
}

logger.info("m2dgTrainer called with message:", userMessage);

// --- CALL OPENAI ---
// We're using chat.completions here with your assistant's tone baked in.
// (This hits the model directly. We can upgrade this later to full
// Assistants API threads/runs if you want memory and multi-turn history.)
const completion = await client.chat.completions.create({
model: "gpt-4o-mini",
messages: [
{
role: "system",
content:
[
"You are the official M2DG Elite Trainer for our basketball / performance community.",
"Your job:",
"- coach athletes and parents with energy, urgency, and respect.",
"- build personalized workouts, recovery plans, nutrition guidance, mindset resets.",
"- hold them accountable without disrespect.",
"- ask follow-ups so you learn age, position, schedule, goals, injuries, confidence level, mental state.",
"- offer motivational video links (YouTube), hype playlists (Spotify or Apple Music), and mindset resets if they want them.",
"- celebrate effort and micro-wins. We build habits daily.",
"",
"Voice:",
"- tough but caring, pro-level standard, never lazy.",
"- sounds like a real trainer in the gym, not a corporate robot.",
"- no medical diagnoses. For serious injury/mental health crisis, tell them to talk to a qualified professional/guardian.",
].join("\n"),
},
{
role: "user",
content: userMessage,
},
],
temperature: 0.7,
});

const replyText =
completion.choices?.[0]?.message?.content ||
"I'm here. Give me your position, age, schedule, and goal so I can build your plan.";

// respond back to the app
res.json({
reply: replyText,
});
} catch (err) {
logger.error("Error in m2dgTrainer:", err);
res.status(500).json({
error: "Trainer is unavailable right now. Try again in a moment.",
});
}
});