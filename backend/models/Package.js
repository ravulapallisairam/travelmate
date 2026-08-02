import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  destination: { type: String, required: true },
  image: { type: String, required: true },
  duration: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, required: true },
  includes: [{ type: String }],
});

export default mongoose.model("Package", packageSchema);