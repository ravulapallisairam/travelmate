import mongoose from "mongoose";

const geocodeCacheSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, unique: true, index: true }, // lowercased "location, destination"
    lat: { type: Number },
    lng: { type: Number },
    found: { type: Boolean, required: true }, // false = confirmed not found, don't retry every time
  },
  { timestamps: true }
);

export default mongoose.model("GeocodeCache", geocodeCacheSchema);