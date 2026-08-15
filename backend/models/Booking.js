import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    packageName: { type: String, required: true },
    packagePrice: { type: Number, required: true },
    travelers: { type: Number, required: true, default: 1 },
    date: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    requests: { type: String },
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);