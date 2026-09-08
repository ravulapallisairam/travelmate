import express from "express";
import { updatePreferences, getTravelDNA, getPreferences } from "../controllers/preferenceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getPreferences);
router.put("/", protect, updatePreferences);
router.get("/travel-dna", protect, getTravelDNA);

export default router;