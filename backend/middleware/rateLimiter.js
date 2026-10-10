import rateLimit from "express-rate-limit";

// These limiters run AFTER `protect`, so req.user is always set. Keying by
// user id (not IP) means one user can't burn the shared Gemini quota, and
// users behind the same network don't throttle each other.
const byUser = (req) => req.user._id.toString();

// Itinerary generation and optimization: heavy Gemini calls plus geocoding/routing.
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: byUser,
  message: { message: "Too many AI requests — please wait a moment before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Copilot chat: up to two LLM calls per message, but lighter than a full itinerary.
export const copilotRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: byUser,
  message: { message: "You're sending requests too quickly — please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});