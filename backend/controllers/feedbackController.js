import Feedback from "../models/Feedback.js";

export const submitFeedback = async (req, res) => {
  try {
    const { type, targetId, rating, improvementAreas } = req.body;

    if (!type || !targetId || !rating) {
      return res.status(400).json({ message: "Missing required feedback fields." });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      type,
      targetId,
      rating,
      improvementAreas: improvementAreas || [],
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};