import express from "express";
import { generateAiItinerary, optimizeItinerary } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate-itinerary", protect, generateAiItinerary);
router.post("/optimize-itinerary", protect, optimizeItinerary);

export default router;