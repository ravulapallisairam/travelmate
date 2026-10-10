import express from "express";
import { sendCopilotMessage, applyCopilotProposal } from "../controllers/copilotController.js";
import { protect } from "../middleware/authMiddleware.js";
import { copilotRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/message", protect, copilotRateLimiter, sendCopilotMessage);
router.post("/apply-proposal", protect, applyCopilotProposal);

export default router;