const CATEGORY_TO_INTEREST = {
  Beach: "nature",
  Mountain: "nature",
  Nature: "nature",
  Historical: "culture",
  Spiritual: "culture",
  Adventure: "adventure",
  Luxury: "luxury",
};

const BUDGET_RANGES = {
  budget: { min: 0, max: 800 },
  moderate: { min: 500, max: 1800 },
  luxury: { min: 1200, max: 999999 },
};

export const scoreDestinations = (destinations, preferences, favorites = [], feedbackList = []) => {
  const favoriteIds = new Set(favorites.map((f) => f._id.toString()));
  const budgetRange = BUDGET_RANGES[preferences?.budgetStyle] || BUDGET_RANGES.moderate;

  // Build a quick lookup: destinationId -> net feedback signal (-1, 0, +1)
  const feedbackMap = {};
  feedbackList.forEach((f) => {
    if (f.type !== "recommendation") return;
    const delta = f.rating === "useful" ? 1 : -1;
    feedbackMap[f.targetId] = (feedbackMap[f.targetId] || 0) + delta;
  });

  return destinations
    .filter((d) => !favoriteIds.has(d._id.toString()))
    .map((d) => {
      const reasons = [];
      let score = 0;

      const interestKey = CATEGORY_TO_INTEREST[d.category];
      if (interestKey && preferences?.interests) {
        const interestValue = preferences.interests[interestKey] ?? 3;
        score += Math.round((interestValue / 5) * 40);
        if (interestValue >= 4) reasons.push(`Matches your ${interestKey} preference`);
      }

      if (d.price >= budgetRange.min && d.price <= budgetRange.max) {
        score += 25;
        reasons.push(`Fits your ${preferences?.budgetStyle || "moderate"} budget`);
      } else {
        score += 8;
      }

      const destDuration = parseInt(d.duration) || 5;
      const preferredDuration = preferences?.preferredDuration || 5;
      const durationDiff = Math.abs(destDuration - preferredDuration);
      if (durationDiff <= 1) {
        score += 15;
        reasons.push("Suitable for your preferred trip duration");
      } else if (durationDiff <= 3) {
        score += 8;
      }

      score += Math.round((d.rating / 5) * 20);
      if (d.rating >= 4.7) reasons.push("Highly rated by other travelers");

      // Feedback adjustment: past 👍 boosts similar destinations (same category), past 👎 suppresses them
      const directFeedback = feedbackMap[d._id.toString()];
      if (directFeedback) {
        score += directFeedback * 15;
        if (directFeedback > 0) reasons.unshift("You liked similar recommendations before");
      }

      return { destination: d, matchScore: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};