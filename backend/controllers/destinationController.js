import Destination from "../models/Destination.js";

export const getDestinations = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, minRating, sort } = req.query;
    let query = {};

    if (category && category !== "All") query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    let sortOption = {};
    switch (sort) {
      case "priceLow": sortOption = { price: 1 }; break;
      case "priceHigh": sortOption = { price: -1 }; break;
      case "ratingHigh": sortOption = { rating: -1 }; break;
      case "durationShort": sortOption = { duration: 1 }; break;
      case "popular":
      default: sortOption = { reviewCount: -1 }; break;
    }

    const destinations = await Destination.find(query).sort(sortOption);
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) return res.status(404).json({ message: "Destination not found" });
    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecommendedDestinations = async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const Favorite = (await import("../models/Favorite.js")).default;
    const Feedback = (await import("../models/Feedback.js")).default;
    const { scoreDestinations } = await import("../utils/recommendationEngine.js");

    const user = await User.findById(req.user._id);
    const favoriteRecords = await Favorite.find({ user: req.user._id }).populate("destination");
    const favorites = favoriteRecords.map((f) => f.destination).filter(Boolean);
    const feedbackList = await Feedback.find({ user: req.user._id, type: "recommendation" });

    const allDestinations = await Destination.find();
    const scored = scoreDestinations(allDestinations, user.preferences, favorites, feedbackList);

    res.json(scored.slice(0, 6));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};