// Group Preference Engine — deterministic aggregation of the trip owner's
// real Travel DNA (User.preferences) plus any lightweight companion
// profiles into a single group profile, with explicit conflict detection.
// No LLM involved here — this is plain math, so it's fully testable and
// predictable before anything ever reaches Gemini.

const INTEREST_CATEGORIES = ["nature", "food", "culture", "adventure", "luxury", "relaxation"];

// A spread of 3+ points on a 0-5 scale between the highest and lowest
// traveler's score in a category is considered a real, worth-mentioning
// conflict — not just normal variation.
const CONFLICT_THRESHOLD = 3;

// Normalizes the owner's real preferences and any companion profiles into
// one flat list of { name, interests } so they can be aggregated the same
// way regardless of source.
const collectTravelerInterests = (ownerPreferences, companionProfiles) => {
  const travelers = [];

  if (ownerPreferences?.interests) {
    travelers.push({ name: "You", interests: ownerPreferences.interests });
  }

  for (const companion of companionProfiles || []) {
    if (!companion?.name || !companion?.interests) continue;
    travelers.push({ name: companion.name, interests: companion.interests });
  }

  return travelers;
};

// Aggregates interest scores across all travelers into a combined group
// score per category (simple average), and flags categories where
// travelers genuinely disagree rather than silently averaging conflicts
// away.
export const aggregateGroupPreferences = (ownerPreferences, companionProfiles) => {
  const travelers = collectTravelerInterests(ownerPreferences, companionProfiles);

  // Solo trip (no companions) — nothing to aggregate, caller should treat
  // this as "no group profile" and fall back to existing single-traveler
  // behavior exactly as before.
  if (travelers.length <= 1) {
    return { isGroup: false, combinedInterests: null, conflicts: [], travelerCount: travelers.length };
  }

  const combinedInterests = {};
  const conflicts = [];

  for (const category of INTEREST_CATEGORIES) {
    const scores = travelers
      .map((t) => t.interests[category])
      .filter((v) => typeof v === "number");

    if (scores.length === 0) continue;

    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
    combinedInterests[category] = Math.round(avg * 10) / 10; // one decimal

    const max = Math.max(...scores);
    const min = Math.min(...scores);

    if (max - min >= CONFLICT_THRESHOLD) {
      const highTravelers = travelers.filter((t) => t.interests[category] === max).map((t) => t.name);
      const lowTravelers = travelers.filter((t) => t.interests[category] === min).map((t) => t.name);

      conflicts.push({
        category,
        high: highTravelers,
        low: lowTravelers,
        spread: max - min,
      });
    }
  }

  return {
    isGroup: true,
    combinedInterests,
    conflicts,
    travelerCount: travelers.length,
    travelerNames: travelers.map((t) => t.name),
  };
};