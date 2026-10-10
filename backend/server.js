import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import copilotRoutes from "./routes/copilotRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Render (and most hosts) put a reverse proxy in front of the app. Trusting one
// hop makes req.ip and rate-limit headers behave correctly in production.
app.set("trust proxy", 1);

// CORS: only your frontend (and local dev) may call the API from a browser.
// Set FRONTEND_URL on Render to your Vercel URL (comma-separate for several).
// If it's unset, behavior stays open so nothing breaks.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl, Postman, server-to-server
      if (allowedOrigins.length === 0) return callback(null, true);
      if (origin === "http://localhost:5173" || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/copilot", copilotRoutes);

app.get("/", (req, res) => {
  res.send("TravelMate API is running...");
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error handler: never returns raw stack traces to clients.
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ message: "Something went wrong on our end. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));