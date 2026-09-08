import express from "express";
import { sendCopilotMessage, applyCopilotProposal } from "../controllers/copilotController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/message", protect, sendCopilotMessage);
router.post("/apply-proposal", protect, applyCopilotProposal);

export default router;