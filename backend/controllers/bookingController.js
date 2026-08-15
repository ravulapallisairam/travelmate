import Booking from "../models/Booking.js";
import { sendBookingConfirmationEmail } from "../utils/sendEmail.js";

export const createBooking = async (req, res) => {
  try {
    const { packageId, packageName, packagePrice, travelers, date, name, email, phone, requests, total } = req.body;

    const booking = await Booking.create({
      user: req.user._id,
      package: packageId,
      packageName,
      packagePrice,
      travelers,
      date,
      name,
      email,
      phone,
      requests,
      total,
    });

    await sendBookingConfirmationEmail(email, booking);

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
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
    res.status(500).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};