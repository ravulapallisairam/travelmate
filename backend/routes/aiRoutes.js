import express from "express";
import { generateAiItinerary } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate-itinerary", protect, generateAiItinerary);

export default router;