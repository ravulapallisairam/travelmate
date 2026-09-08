import express from "express";
import { getDestinations, getDestinationById, getRecommendedDestinations } from "../controllers/destinationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getDestinations);
router.get("/recommended/for-me", protect, getRecommendedDestinations);
router.get("/:id", getDestinationById);

export default router;