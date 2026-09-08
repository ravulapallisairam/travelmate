// Categories considered weather-sensitive vs weather-safe.
// Matches the "category" field already present on itinerary activities.
const OUTDOOR_CATEGORIES = ["adventure", "sightseeing"];
const INDOOR_SAFE_CATEGORIES = ["food", "shopping", "culture", "relaxation"];

const RAIN_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 55,
  HIGH: 75,
};

const assessActivityImpact = (activity, weather) => {
  const isOutdoor = OUTDOOR_CATEGORIES.includes(activity.category);

  if (!isOutdoor) {
    return { impactLevel: "none" };
  }

  if (weather.condition === "rain" || weather.condition === "snow") {
    if (weather.rainProbability >= RAIN_THRESHOLDS.HIGH) {
      return {
        impactLevel: "high",
        reason: `Heavy ${weather.condition} expected (${weather.rainProbability}% chance) during an outdoor activity`,
      };
    }
    if (weather.rainProbability >= RAIN_THRESHOLDS.MEDIUM) {
      return {
        impactLevel: "medium",
        reason: `Moderate rain likely (${weather.rainProbability}% chance) — outdoor activity may be affected`,
      };
    }
    if (weather.rainProbability >= RAIN_THRESHOLDS.LOW) {
      return {
        impactLevel: "low",
        reason: `Slight chance of rain (${weather.rainProbability}%) — worth monitoring`,
      };
    }
  }

  if (weather.temperature >= 40 || weather.temperature <= 2) {
    return {
      impactLevel: "medium",
      reason: `Extreme temperature (${weather.temperature}°C) may make this outdoor activity uncomfortable`,
    };
  }

  return { impactLevel: "none" };
};

// Compares one day's activities against that day's weather summary.
// Returns only activities with a genuine impact - never generates alerts
// for insignificant/no-impact cases (per Step 6: avoid notification spam).
export const detectDayImpact = (day, weather) => {
  if (!weather) return { hasAlert: false, affectedActivities: [] };

  const affected = (day.activities || [])
    .map((activity) => {
      const assessment = assessActivityImpact(activity, weather);
      return assessment.impactLevel === "none" ? null : { ...activity, ...assessment };
    })
    .filter(Boolean);

  return {
    hasAlert: affected.length > 0,
    affectedActivities: affected,
    weather,
  };
};