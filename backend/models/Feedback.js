import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["recommendation", "itinerary"], required: true },
    targetId: { type: String, required: true }, // destination._id for recommendations, or a trip-session identifier for itineraries
    rating: { type: String, enum: ["useful", "not_useful"], required: true },
    improvementAreas: [{ type: String, enum: ["budget", "activities", "destination", "schedule", "travelStyle"] }],
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);