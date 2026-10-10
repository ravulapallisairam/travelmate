import express from "express";
import { generateAiItinerary, optimizeItinerary } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Order matters: protect first (sets req.user), then the limiter keyed on it.
router.post("/generate-itinerary", protect, aiRateLimiter, generateAiItinerary);
router.post("/optimize-itinerary", protect, aiRateLimiter, optimizeItinerary);

export default router;