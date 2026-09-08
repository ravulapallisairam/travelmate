import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["sightseeing", "food", "adventure", "relaxation", "shopping", "culture"],
      default: "sightseeing",
    },
    startTime: { type: String },
    endTime: { type: String },
    estimatedCost: { type: Number, default: 0 },
    location: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: { type: String },
    activities: { type: [activitySchema], default: [] },
    // Legacy fields kept so old trips saved before this schema change still load correctly
    morning: { type: String },
    afternoon: { type: String },
    evening: { type: String },
  },
  { _id: false }
);

const budgetBreakdownSchema = new mongoose.Schema(
  {
    accommodation: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    emergency: { type: Number, default: 0 },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    days: { type: Number, required: true },
    travelers: { type: Number, default: 1 },
    budget: { type: Number, required: true },
    travelStyle: { type: String, required: true },
    itinerary: {
      days: [daySchema],
      hotels: [{ type: String }],
      places: [{ type: String }],
      estimatedBudget: { type: Number },
    },
    budgetBreakdown: budgetBreakdownSchema,
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);