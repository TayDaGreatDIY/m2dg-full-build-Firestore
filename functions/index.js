/**
 * Firebase Functions (Node 18+ / v2 APIs)
 */
const { setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

/* ----------------------------- OpenAI client ----------------------------- */
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

let openai = null;
(() => {
  try {
    const key =
      process.env.OPENAI_API_KEY ||
      OPENAI_API_KEY.value() ||
      (functions.config && functions.config().openai?.key);

    if (key) {
      const OpenAI = require("openai");
      openai = new OpenAI({ apiKey: key });
      logger.info("✅ OpenAI client initialized successfully.");
    } else {
      logger.warn("⚠️ OpenAI API key not found in secrets or env vars.");
    }
  } catch (e) {
    logger.error("❌ Failed to initialize OpenAI client:", e);
  }
})();

/* --------------------------- Health check route -------------------------- */
exports.helloWorld = onRequest((req, res) => {
  logger.info("✅ helloWorld ping");
  res.json({ ok: true, message: "Firebase Functions are live." });
});

/* --------------------------- M2DG AI Trainer API ------------------------- */
exports.getAiTrainerReply = onRequest(
  {
    cors: ["http://localhost:3000", "https://m2dg-full-build.web.app"],
    secrets: [OPENAI_API_KEY],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST requests are accepted" });
    }

    if (!openai) {
      return res.status(503).json({
        error: "AI is not configured. Contact support.",
      });
    }

    try {
      let { message, messages } = req.body;
      if (!messages && message) {
        messages = [{ role: "user", content: message }];
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: "Request body must contain { message: 'text' } or { messages: [...] }",
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.75,
        messages: [
          {
            role: "system",
            content: `You are "Coach GPT", the official AI trainer for the Married 2 Da Game (M2DG) basketball platform.
You help players improve their game, fitness, and mindset through motivational guidance and performance coaching.
Always speak in a supportive, realistic tone, with personality — part trainer, part mentor.`,
          },
          ...messages,
        ],
      });

      const reply =
        completion.choices?.[0]?.message?.content ||
        "I'm here, ready to plan your next session. Tell me what skill or workout you want to focus on.";

      logger.info("✅ AI Trainer replied:", reply.slice(0, 80));
      res.status(200).json({ reply });
    } catch (err) {
      logger.error("❌ getAiTrainerReply error:", err);
      res.status(500).json({
        error: "Trainer is unavailable right now. Try again soon.",
      });
    }
  }
);

/* ----------------- Backfill Court Coordinates (Callable) ----------------- */
exports.backfillCourtCoordinates = onCall(async (_data, context) => {
  const db = admin.firestore();
  const courtsSnap = await db.collection("courts").get();
  if (courtsSnap.empty) return { status: "No courts found", updates: [] };

  let mapsKey = null;
  try {
    const cfg = functions.config ? functions.config() : {};
    mapsKey = cfg?.googlemaps?.key || process.env.GOOGLE_MAPS_API_KEY || null;
  } catch (_) {}

  const updates = [];
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const doc of courtsSnap.docs) {
    const court = doc.data();
    if (court?.latitude && court?.longitude) continue;

    const address = encodeURIComponent(
      court?.address || `${court?.name || "Unknown"}, ${court?.city || ""}`
    );

    try {
      let lat = null;
      let lng = null;

      if (mapsKey) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${mapsKey}`;
        const { data } = await axios.get(url, { timeout: 12000 });
        const loc = data?.results?.[0]?.geometry?.location;
        lat = loc?.lat ?? null;
        lng = loc?.lng ?? null;
      } else {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${address}`;
        const { data } = await axios.get(url, {
          timeout: 12000,
          headers: { "User-Agent": "M2DG/1.0 (contact: admin@m2dg.app)" },
        });
        if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
        await delay(350);
      }

      if (lat != null && lng != null) {
        await doc.ref.update({
          latitude: lat,
          longitude: lng,
          geoUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updates.push({ id: doc.id, name: court?.name, success: true, lat, lng });
      } else {
        updates.push({
          id: doc.id,
          name: court?.name,
          success: false,
          reason: "No coordinates returned",
        });
      }
    } catch (err) {
      logger.error(`Geocode error for court ${doc.id}:`, err?.message || err);
      updates.push({
        id: doc.id,
        name: court?.name,
        success: false,
        reason: err?.message || "request failed",
      });
    }
  }

  logger.info(`✅ Backfill complete. ${updates.length} processed.`);
  return { status: "Complete", updates };
});
