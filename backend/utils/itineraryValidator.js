const VALID_CATEGORIES = ["sightseeing", "food", "adventure", "relaxation", "shopping", "culture"];

const timeToMinutes = (t) => {
  if (!t || typeof t !== "string" || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const detectTimeConflicts = (activities) => {
  const conflicts = [];
  const sorted = [...activities]
    .map((a) => ({ ...a, _start: timeToMinutes(a.startTime), _end: timeToMinutes(a.endTime) }))
    .filter((a) => a._start !== null && a._end !== null)
    .sort((a, b) => a._start - b._start);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i]._end > sorted[i + 1]._start) {
      conflicts.push(`"${sorted[i].title}" overlaps with "${sorted[i + 1].title}"`);
    }
  }
  return conflicts;
};

export const validateItinerary = (aiData, { days, budget, startDate }) => {
  const warnings = [];
  let repairedDays = Array.isArray(aiData?.days) ? [...aiData.days] : [];

  // 1. Day count check
  if (repairedDays.length !== Number(days)) {
    warnings.push(`Requested ${days} days but AI generated ${repairedDays.length}. Adjusted automatically.`);
    while (repairedDays.length < days) {
      const dayNum = repairedDays.length + 1;
      repairedDays.push({ day: dayNum, date: startDate, activities: [] });
    }
    repairedDays = repairedDays.slice(0, days);
  }

  let totalEstimatedCost = 0;
  const allTitles = [];
  let conflictCount = 0;
  let overloadedDays = 0;

  repairedDays = repairedDays.map((d, idx) => {
    const activities = Array.isArray(d.activities) ? d.activities : [];

    // Filter out malformed activities (missing required fields)
    const cleanActivities = activities.filter((a) => a && typeof a.title === "string" && a.title.trim());

    cleanActivities.forEach((a) => {
      const cost = Number(a.estimatedCost) || 0;
      totalEstimatedCost += cost;
      allTitles.push(a.title.toLowerCase().trim());
      if (!VALID_CATEGORIES.includes(a.category)) a.category = "sightseeing";
    });

    // 2. Time conflict detection
    const conflicts = detectTimeConflicts(cleanActivities);
    if (conflicts.length > 0) {
      conflictCount += conflicts.length;
      warnings.push(`Day ${idx + 1}: ${conflicts[0]}`);
    }

    // 3. Overloaded day check
    if (cleanActivities.length > 5) {
      overloadedDays++;
      warnings.push(`Day ${idx + 1} has ${cleanActivities.length} activities — this may be too busy.`);
    }

    return { ...d, day: idx + 1, activities: cleanActivities };
  });

  // 4. Duplicate detection
  const seen = new Set();
  let duplicateCount = 0;
  allTitles.forEach((t) => {
    if (seen.has(t)) duplicateCount++;
    seen.add(t);
  });
  if (duplicateCount > 0) {
    warnings.push(`Found ${duplicateCount} repeated activit${duplicateCount > 1 ? "ies" : "y"} across the trip.`);
  }

  // 5. Budget check
  const budgetOverflow = totalEstimatedCost - Number(budget);
  if (budgetOverflow > 0) {
    warnings.push(`Estimated cost exceeds your budget by $${budgetOverflow.toLocaleString()}.`);
  }

  // Feasibility scoring (0-100 each, then averaged)
  const budgetScore = budgetOverflow > 0
    ? Math.max(0, 100 - Math.round((budgetOverflow / Number(budget)) * 100))
    : 100;
  const timeScore = Math.max(0, 100 - conflictCount * 15);
  const coverageScore = repairedDays.every((d) => d.activities.length >= 2) ? 100 : 70;
  const preferenceScore = duplicateCount === 0 ? 100 : Math.max(50, 100 - duplicateCount * 10);

  const overall = Math.round((budgetScore + timeScore + coverageScore + preferenceScore) / 4);

  return {
    repairedDays,
    totalEstimatedCost,
    warnings,
    feasibilityScore: overall,
    breakdown: {
      budget: budgetScore,
      time: timeScore,
      coverage: coverageScore,
      preferences: preferenceScore,
    },
  };
};