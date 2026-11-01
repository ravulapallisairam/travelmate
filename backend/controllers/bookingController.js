import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Package from "../models/Package.js";
import { sendBookingConfirmationEmail } from "../utils/sendEmail.js";

const ALLOWED_STATUSES = ["pending", "confirmed", "cancelled"];

export const createBooking = async (req, res) => {
  try {
    const { packageId, travelers, date, name, email, phone, requests } = req.body;

    if (!mongoose.isValidObjectId(packageId)) {
      return res.status(400).json({ message: "Invalid package" });
    }
    const count = Number(travelers);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      return res.status(400).json({ message: "Travelers must be between 1 and 20" });
    }
    if (!name || !email || !date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: "Name, email and a valid date are required" });
    }

    // The server looks up the real price. Prices from the browser are ignored.
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      package: pkg._id,
      packageName: pkg.name,
      packagePrice: pkg.price,
      travelers: count,
      date,
      name,
      email,
      phone,
      requests,
      total: pkg.price * count,
    });

    // A failed email must not make the user retry and create a duplicate booking.
    try {
      await sendBookingConfirmationEmail(email, booking);
    } catch (emailError) {
      console.error("[Booking] Confirmation email failed:", emailError.message);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("[Booking] Create failed:", error.message);
    res.status(500).json({ message: "Could not create booking" });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("[Booking] Fetch failed:", error.message);
    res.status(500).json({ message: "Could not load bookings" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error("[Booking] Cancel failed:", error.message);
    res.status(500).json({ message: "Could not cancel booking" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("[Booking] Admin fetch failed:", error.message);
    res.status(500).json({ message: "Could not load bookings" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error("[Booking] Status update failed:", error.message);
    res.status(500).json({ message: "Could not update booking" });
  }
};