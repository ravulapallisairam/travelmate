import User from "../models/User.js";
import Favorite from "../models/Favorite.js";
import Trip from "../models/Trip.js";
import { calculateTravelDNA } from "../utils/travelDNA.js";

export const updatePreferences = async (req, res) => {
  try {
    const { budgetStyle, preferredDuration, activityLevel, interests } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentInterests = user.preferences?.interests?.toObject
      ? user.preferences.interests.toObject()
      : user.preferences?.interests || {};

    user.preferences = {
      budgetStyle: budgetStyle || user.preferences?.budgetStyle || "moderate",
      preferredDuration: preferredDuration || user.preferences?.preferredDuration || 5,
      activityLevel: activityLevel || user.preferences?.activityLevel || "moderate",
      interests: { ...currentInterests, ...interests },
      onboarded: true,
    };

    await user.save();
    res.json({ preferences: user.preferences });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTravelDNA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const favoriteRecords = await Favorite.find({ user: req.user._id }).populate("destination");
    const favorites = favoriteRecords.map((f) => f.destination).filter(Boolean);
    const trips = await Trip.find({ user: req.user._id });

    const dna = calculateTravelDNA(user.preferences, favorites, trips);
    res.json(dna);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};