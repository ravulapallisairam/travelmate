import mongoose from "mongoose";
import Favorite from "../models/Favorite.js";
import Destination from "../models/Destination.js";

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate("destination");
    res.json(favorites.map((f) => f.destination));
  } catch (error) {
    console.error("[Favorites] Fetch failed:", error.message);
    res.status(500).json({ message: "Could not load favorites" });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { destinationId } = req.body;

    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({ message: "Invalid destination" });
    }
    if (!(await Destination.exists({ _id: destinationId }))) {
      return res.status(404).json({ message: "Destination not found" });
    }

    const exists = await Favorite.findOne({ user: req.user._id, destination: destinationId });
    if (exists) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    const favorite = await Favorite.create({ user: req.user._id, destination: destinationId });
    res.status(201).json(favorite);
  } catch (error) {
    console.error("[Favorites] Add failed:", error.message);
    res.status(500).json({ message: "Could not add favorite" });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ user: req.user._id, destination: req.params.destinationId });
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("[Favorites] Remove failed:", error.message);
    res.status(500).json({ message: "Could not remove favorite" });
  }
};