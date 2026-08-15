import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String },
    image: { type: String, required: true },
    images: [{ type: String }],
    rating: { type: Number, required: true },
    reviewCount: { type: Number, default: 0 },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    bestTimeToVisit: { type: String },
    topAttractions: [{ type: String }],
    activities: [{ type: String }],
    foodRecommendations: [{ type: String }],
    travelTips: [{ type: String }],
    estimatedDailyBudget: { type: Number },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Destination", destinationSchema);