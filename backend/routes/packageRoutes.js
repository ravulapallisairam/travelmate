import express from "express";
import { getPackages } from "../controllers/packageController.js";

const router = express.Router();

router.get("/", getPackages);

export default router;