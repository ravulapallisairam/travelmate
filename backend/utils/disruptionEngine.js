// Disruption Engine — shared shape + merge/rank logic for any disruption
// source (weather today, trust-engine-based closure signals next).
// Deterministic only — no LLM involved in detecting or ranking risk.
//
// Shared shape:
// {
//   source: "weather" | "availability",
//   day: <day number>,
//   date: <string>,
//   activity: <original activity object>,
//   severity: "low" | "medium" | "high",
//   reason: <human-readable string>,
// }

const SEVERITY_RANK = { high: 3, medium: 2, low: 1 };

// Converts the existing weatherImpact.js output (from detectDayImpact) into
// the shared disruption shape. Wraps existing logic — does not change it.
export const weatherToDisruptions = (day, dayImpactResult) => {
  if (!dayImpactResult?.hasAlert) return [];

  return dayImpactResult.affectedActivities.map((activity) => ({
    source: "weather",
    day: day.day,
    date: day.date,
    activity,
    severity: activity.impactLevel, // already "low" | "medium" | "high"
    reason: activity.reason,
  }));
};

// Converts a closure-signal check (Phase 2's new trust-engine-based
// detector) into the shared shape.
export const closureToDisruptions = (day, activity, closureResult) => {
  if (!closureResult?.hasSignal) return [];

  return [{
    source: "availability",
    day: day.day,
    date: day.date,
    activity,
    severity: closureResult.severity,
    reason: closureResult.reason,
  }];
};

// Merges disruptions from any number of sources for a set of days,
// deduplicating by day+activity title so the same activity isn't flagged
// twice if two sources both raise a concern about it - the higher-severity
// one wins.
export const mergeDisruptions = (disruptionLists) => {
  const all = disruptionLists.flat();
  const byKey = new Map();

  for (const d of all) {
    const key = `${d.day}::${d.activity.title}`;
    const existing = byKey.get(key);
    if (!existing || SEVERITY_RANK[d.severity] > SEVERITY_RANK[existing.severity]) {
      byKey.set(key, d);
    }
  }

  return [...byKey.values()].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
};