import Favorite from "../models/Favorite.js";

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate("destination");
    res.json(favorites.map((f) => f.destination));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { destinationId } = req.body;

    const exists = await Favorite.findOne({ user: req.user._id, destination: destinationId });
    if (exists) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    const favorite = await Favorite.create({ user: req.user._id, destination: destinationId });
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ user: req.user._id, destination: req.params.destinationId });
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};