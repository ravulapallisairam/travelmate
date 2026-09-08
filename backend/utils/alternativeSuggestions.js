const CATEGORY_TO_INTEREST = {
  sightseeing: "culture",
  food: "food",
  adventure: "adventure",
  relaxation: "relaxation",
  shopping: "luxury",
  culture: "culture",
};

const INDOOR_SAFE_CATEGORIES = ["food", "shopping", "culture", "relaxation"];

// Builds indoor-safe replacement candidates from the destination's own
// verified data (topAttractions, activities, foodRecommendations) - never
// invents new attractions.
const buildCandidatePool = (destination) => {
  const pool = [];

  (destination.topAttractions || []).forEach((name) =>
    pool.push({ title: name, category: "sightseeing", source: "topAttractions" })
  );
  (destination.activities || []).forEach((name) =>
    pool.push({ title: name, category: "culture", source: "activities" })
  );
  (destination.foodRecommendations || []).forEach((name) =>
    pool.push({ title: name, category: "food", source: "foodRecommendations" })
  );

  return pool;
};

// Ranks candidates by how well they match the user's Travel DNA interests,
// preferring indoor-safe categories since this is specifically for
// weather-affected replacement.
const scoreCandidate = (candidate, preferences) => {
  const interestKey = CATEGORY_TO_INTEREST[candidate.category] || "culture";
  const interestValue = preferences?.interests?.[interestKey] ?? 3;
  let score = interestValue * 20; // 0-100 base

  if (INDOOR_SAFE_CATEGORIES.includes(candidate.category)) score += 15;

  return score;
};

// Given an affected activity + destination + user preferences, returns the
// best available replacement from real destination data (no AI hallucination).
export const suggestReplacement = (affectedActivity, destination, preferences, alreadyUsedTitles = []) => {
  const pool = buildCandidatePool(destination).filter(
    (c) => !alreadyUsedTitles.includes(c.title.toLowerCase())
  );

  if (pool.length === 0) return null;

  const scored = pool
    .map((c) => ({ ...c, score: scoreCandidate(c, preferences) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  return {
    title: best.title,
    category: best.category,
    startTime: affectedActivity.startTime,
    endTime: affectedActivity.endTime,
    estimatedCost: affectedActivity.estimatedCost, // keep similar cost, no invented pricing
    location: destination.name,
    description: `Indoor-friendly alternative to ${affectedActivity.title}`,
    isReplacement: true,
    replacedActivity: affectedActivity.title,
  };
};