import express from "express";
import { checkItineraryWeather, suggestItineraryChanges } from "../controllers/weatherController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/check-itinerary", protect, checkItineraryWeather);
router.post("/suggest-changes", protect, suggestItineraryChanges);

export default router;