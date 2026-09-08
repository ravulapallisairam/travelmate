import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
      budgetStyle: { type: String, enum: ["budget", "moderate", "luxury"], default: "moderate" },
      preferredDuration: { type: Number, default: 5 },
      activityLevel: { type: String, enum: ["low", "moderate", "high"], default: "moderate" },
      interests: {
        nature: { type: Number, min: 0, max: 5, default: 3 },
        food: { type: Number, min: 0, max: 5, default: 3 },
        culture: { type: Number, min: 0, max: 5, default: 3 },
        adventure: { type: Number, min: 0, max: 5, default: 3 },
        luxury: { type: Number, min: 0, max: 5, default: 2 },
        relaxation: { type: Number, min: 0, max: 5, default: 3 },
      },
      onboarded: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);