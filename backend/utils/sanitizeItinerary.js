// Server-side shape check for itineraries sent back by the browser (Copilot "Apply").
// Never trust the client's copy: rebuild it from whitelisted, length-limited fields.
// Pure function: no database, no network.

const CATEGORIES = ["sightseeing", "food", "adventure", "relaxation", "shopping", "culture"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 30;
const MAX_ACTIVITIES_PER_DAY = 8;

const clip = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const cost = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 100000) : 0;
};

export const sanitizeProposedDays = (proposedDays, { expectedDays } = {}) => {
  if (!Array.isArray(proposedDays) || proposedDays.length === 0 || proposedDays.length > MAX_DAYS) {
    return { error: "Invalid itinerary." };
  }
  if (expectedDays && proposedDays.length !== expectedDays) {
    return { error: "The proposed plan doesn't match your trip length." };
  }

  const days = [];

  for (let i = 0; i < proposedDays.length; i++) {
    const day = proposedDays[i];
    if (!day || typeof day !== "object" || !Array.isArray(day.activities)) {
      return { error: "Invalid itinerary." };
    }
    if (day.activities.length > MAX_ACTIVITIES_PER_DAY) {
      return { error: `Day ${i + 1} has too many activities.` };
    }

    const activities = [];
    for (const a of day.activities) {
      // Entries with no usable title are dropped.
      if (!a || typeof a !== "object" || typeof a.title !== "string" || !a.title.trim()) continue;

      // A bad time means the plan itself is bad, so reject the whole proposal.
      if (!TIME.test(a.startTime) || !TIME.test(a.endTime)) {
        return { error: `Invalid activity time on day ${i + 1}.` };
      }

      activities.push({
        title: clip(a.title, 120),
        category: CATEGORIES.includes(a.category) ? a.category : "sightseeing",
        startTime: a.startTime,
        endTime: a.endTime,
        estimatedCost: cost(a.estimatedCost),
        location: clip(a.location, 120),
        description: clip(a.description, 300),
      });
    }

    days.push({
      day: i + 1,
      ...(DATE.test(day.date) ? { date: day.date } : {}),
      activities,
    });
  }

  return { days };
};