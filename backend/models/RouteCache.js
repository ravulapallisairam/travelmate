import mongoose from "mongoose";

const routeCacheSchema = new mongoose.Schema(
  {
    // Coordinates rounded to 5 decimal places (~1.1m precision) and joined
    // into a stable key. Rounding avoids cache misses from floating-point
    // noise while staying accurate enough for travel-time purposes.
    key: { type: String, required: true, unique: true, index: true },
    durationMinutes: { type: Number }, // null if the route genuinely wasn't found
    found: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("RouteCache", routeCacheSchema);