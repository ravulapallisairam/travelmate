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

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/bookings", bookingRoutes);



app.get("/", (req, res) => {
  res.send("TravelMate API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));