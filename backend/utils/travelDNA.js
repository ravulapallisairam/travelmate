const CATEGORY_TO_INTEREST = {
  Nature: "nature",
  Beach: "nature",
  Mountain: "nature",
  Historical: "culture",
  Spiritual: "culture",
  Adventure: "adventure",
  Luxury: "luxury",
};

export const calculateTravelDNA = (preferences, favorites = [], trips = []) => {
  const interests = preferences?.interests || {
    nature: 3, food: 3, culture: 3, adventure: 3, luxury: 2, relaxation: 3,
  };

  const explicitScores = {};
  Object.entries(interests).forEach(([key, val]) => {
    explicitScores[key] = Math.round((val / 5) * 100);
  });

  const inferredCounts = { nature: 0, food: 0, culture: 0, adventure: 0, luxury: 0, relaxation: 0 };
  let totalSignals = 0;

  favorites.forEach((dest) => {
    const interestKey = CATEGORY_TO_INTEREST[dest.category];
    if (interestKey) {
      inferredCounts[interestKey]++;
      totalSignals++;
    }
  });

  trips.forEach((trip) => {
    const styleMap = {
      Adventure: "adventure",
      Relaxation: "relaxation",
      Luxury: "luxury",
      Family: "culture",
      Solo: "culture",
    };
    const key = styleMap[trip.travelStyle];
    if (key) {
      inferredCounts[key]++;
      totalSignals++;
    }
  });

  const inferredScores = {};
  Object.keys(explicitScores).forEach((key) => {
    inferredScores[key] = totalSignals > 0
      ? Math.round((inferredCounts[key] / totalSignals) * 100)
      : null;
  });

  const finalScores = {};
  Object.keys(explicitScores).forEach((key) => {
    if (inferredScores[key] !== null && totalSignals >= 3) {
      finalScores[key] = Math.round(explicitScores[key] * 0.7 + inferredScores[key] * 0.3);
    } else {
      finalScores[key] = explicitScores[key];
    }
  });

  const budgetConsciousScore = { budget: 90, moderate: 55, luxury: 20 }[preferences?.budgetStyle] || 55;

  return {
    scores: {
      "Nature Lover": finalScores.nature,
      "Food Explorer": finalScores.food,
      "Culture Enthusiast": finalScores.culture,
      "Adventure Seeker": finalScores.adventure,
      "Luxury Traveler": finalScores.luxury,
      "Relaxation Focused": finalScores.relaxation,
      "Budget Conscious": budgetConsciousScore,
    },
    dataSource: {
      hasExplicitData: preferences?.onboarded || false,
      hasBehaviorData: totalSignals >= 3,
      behaviorSignalCount: totalSignals,
    },
  };
};