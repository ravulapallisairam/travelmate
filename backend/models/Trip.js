import mongoose from "mongoose";

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    morning: { type: String },
    afternoon: { type: String },
    evening: { type: String },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    days: { type: Number, required: true },
    budget: { type: Number, required: true },
    travelStyle: { type: String, required: true },
    itinerary: {
      days: [daySchema],
      hotels: [{ type: String }],
      places: [{ type: String }],
      estimatedBudget: { type: Number },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);