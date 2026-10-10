import Trip from "../models/Trip.js";
import { pickTripFields } from "../utils/tripFields.js";

const REQUIRED_ON_CREATE = ["name", "destination", "days", "budget", "travelStyle"];

// Malformed ids or values are the client's mistake (400), not a server fault (500).
const isClientError = (error) => error.name === "ValidationError" || error.name === "CastError";

export const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: "Couldn't load your trips." });
  }
};

export const createTrip = async (req, res) => {
  try {
    const fields = pickTripFields(req.body);

    const missing = REQUIRED_ON_CREATE.filter((key) => fields[key] === undefined || fields[key] === "");
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required trip fields: ${missing.join(", ")}` });
    }

    // The owner always comes from the verified JWT, never from the request body.
    const trip = await Trip.create({ ...fields, user: req.user._id });
    res.status(201).json(trip);
  } catch (error) {
    if (isClientError(error)) return res.status(400).json({ message: "Invalid trip data." });
    console.error("createTrip failed:", error.message);
    res.status(500).json({ message: "Couldn't save the trip." });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const updates = pickTripFields(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    // Ownership is enforced in the query itself.
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    Object.assign(trip, updates);
    await trip.save();
    res.json(trip);
  } catch (error) {
    if (isClientError(error)) return res.status(400).json({ message: "Invalid trip data." });
    console.error("updateTrip failed:", error.message);
    res.status(500).json({ message: "Couldn't update the trip." });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json({ message: "Trip deleted" });
  } catch (error) {
    if (isClientError(error)) return res.status(400).json({ message: "Invalid trip id." });
    console.error("deleteTrip failed:", error.message);
    res.status(500).json({ message: "Couldn't delete the trip." });
  }
};