import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, destination: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);