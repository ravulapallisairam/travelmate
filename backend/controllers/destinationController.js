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