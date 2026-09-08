// TravelMate Copilot — Tool Layer (READ-ONLY tools)
// Each tool has a clear contract (documented inline) so it can later be
// exposed via MCP without changes to its internal logic (Phase 18).
// CRITICAL: every tool takes userId explicitly and enforces ownership —
// the LLM never decides whose data it's allowed to see (Phase 20).

import Trip from "../models/Trip.js";
import Destination from "../models/Destination.js";
import User from "../models/User.js";
import Favorite from "../models/Favorite.js";
import Feedback from "../models/Feedback.js";
import { scoreDestinations } from "../utils/recommendationEngine.js";
import { getWeatherForDate } from "./weatherService.js";
import { detectDayImpact } from "../utils/weatherImpact.js";

/**
 * getCurrentTrip
 * Input: { userId }
 * Output: { trip } | { trip: null }
 * Returns the user's most recently created trip.
 */
export const getCurrentTrip = async ({ userId }) => {
  const trip = await Trip.findOne({ user: userId }).sort({ createdAt: -1 });
  return { trip };
};

/**
 * getTripById
 * Input: { userId, tripId }
 * Output: { trip } | { trip: null, error: "not_found_or_unauthorized" }
 * Ownership enforced: only returns the trip if it belongs to userId.
 */
export const getTripById = async ({ userId, tripId }) => {
  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { trip: null, error: "not_found_or_unauthorized" };
  return { trip };
};

/**
 * getDestinationInfo
 * Input: { destinationName } or { destinationId }
 * Output: { destination } | { destination: null }
 */
export const getDestinationInfo = async ({ destinationName, destinationId }) => {
  const destination = destinationId
    ? await Destination.findById(destinationId)
    : await Destination.findOne({ name: { $regex: destinationName, $options: "i" } });
  return { destination };
};

/**
 * verifyCurrentInfo
 * Input: { message, destinationName }
 * Output: { available, sources, fetchedAt, reason }
 * Retrieves current/verifiable info from trusted sources only — never
 * fabricates. If retrieval fails or nothing trustworthy is found, says
 * so explicitly rather than falling back to an unlabeled AI guess.
 */
export const verifyCurrentInfo = async ({ message, destinationName }) => {
  const { retrieveTrustedSources } = await import("./trustEngineService.js");
  if (!destinationName) {
    return { available: false, reason: "no_destination_context" };
  }
  return retrieveTrustedSources(message, destinationName);
};

/**
 * getTravelDNA
 * Input: { userId }
 * Output: { preferences }
 */
export const getUserPreferences = async ({ userId }) => {
  const user = await User.findById(userId);
  return { preferences: user?.preferences || null };
};

/**
 * getRecommendations
 * Input: { userId, limit }
 * Output: { recommendations: [{ destination, matchScore, reasons }] }
 */
export const getRecommendations = async ({ userId, limit = 3 }) => {
  const user = await User.findById(userId);
  const favoriteRecords = await Favorite.find({ user: userId }).populate("destination");
  const favorites = favoriteRecords.map((f) => f.destination).filter(Boolean);
  const feedbackList = await Feedback.find({ user: userId, type: "recommendation" });
  const allDestinations = await Destination.find();
  const scored = scoreDestinations(allDestinations, user?.preferences, favorites, feedbackList);
  return { recommendations: scored.slice(0, limit) };
};

/**
 * checkWeather
 * Input: { destinationId, date }
 * Output: { available, weather } | { available: false, message }
 * Never fabricates weather — returns unavailable if provider fails.
 */
export const checkWeather = async ({ destinationId, date }) => {
  const destination = await Destination.findById(destinationId);
  if (!destination?.coordinates?.lat || !destination?.coordinates?.lng) {
    return { available: false, message: "No coordinates on file for this destination." };
  }
  try {
    const weather = await getWeatherForDate(destination.coordinates.lat, destination.coordinates.lng, date);
    return { available: true, weather };
  } catch (err) {
    return { available: false, message: "Live weather information is temporarily unavailable." };
  }
};

/**
 * checkItineraryWeatherImpact
 * Input: { userId, tripId }
 * Output: { available, dayAlerts } | { available: false, message }
 * Reuses the existing weather impact detection — no duplicated logic.
 */
export const checkItineraryWeatherImpact = async ({ userId, tripId }) => {
  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { available: false, message: "Trip not found." };

  const destination = await Destination.findOne({ name: trip.destination });
  if (!destination?.coordinates?.lat) {
    return { available: false, message: "Weather unavailable for this destination." };
  }

  const dayAlerts = [];
  for (const day of trip.itinerary?.days || []) {
    if (!day.date) continue;
    try {
      const weather = await getWeatherForDate(destination.coordinates.lat, destination.coordinates.lng, day.date);
      const impact = detectDayImpact(day, weather);
      if (impact.hasAlert) dayAlerts.push({ day: day.day, date: day.date, ...impact });
    } catch {
      // skip day silently, matches existing weather controller behavior
    }
  }

  return { available: true, dayAlerts };
};

/**
 * checkItineraryDisruptions
 * Input: { userId, tripId }
 * Output: { available, disruptions } | { available: false, message }
 * Generalizes weather-only disruption checking (Phase 2). Merges weather
 * disruptions with trust-engine-based closure signals into one shared,
 * ranked list. Weather check is unchanged from before; closure checking
 * is scoped to only the first activity per day to control cost (each
 * check is a real Wikipedia lookup).
 */
export const checkItineraryDisruptions = async ({ userId, tripId }) => {
  const { weatherToDisruptions, closureToDisruptions, mergeDisruptions } = await import("../utils/disruptionEngine.js");
  const { detectClosureSignal } = await import("../utils/closureSignalDetector.js");
  const { retrieveTrustedSources } = await import("./trustEngineService.js");

  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { available: false, message: "Trip not found." };

  const destination = await Destination.findOne({ name: trip.destination });
  const days = trip.itinerary?.days || [];

  const weatherDisruptionLists = [];
  const closureDisruptionLists = [];

  for (const day of days) {
    if (!day.date) continue;

    // Weather path — reuses existing detectDayImpact exactly as before.
    if (destination?.coordinates?.lat) {
      try {
        const weather = await getWeatherForDate(destination.coordinates.lat, destination.coordinates.lng, day.date);
        const impact = detectDayImpact(day, weather);
        weatherDisruptionLists.push(weatherToDisruptions(day, impact));
      } catch {
        // skip silently, matches existing weather controller behavior
      }
    }

    // Closure-signal path — only check the first activity per day to
    // control cost (each check is a real external lookup). A small delay
    // between calls avoids tripping Wikipedia's rate limit when a trip
    // has several days checked in quick succession.
    const firstActivity = (day.activities || [])[0];
    if (firstActivity?.title && destination?.name) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const trustResult = await retrieveTrustedSources(firstActivity.title, destination.name);
        const closureResult = detectClosureSignal({ activityTitle: firstActivity.title, trustResult });
        closureDisruptionLists.push(closureToDisruptions(day, firstActivity, closureResult));
      } catch {
        // skip silently — never block the rest of the check
      }
    }
  }

  const merged = mergeDisruptions([...weatherDisruptionLists, ...closureDisruptionLists]);

  return { available: true, disruptions: merged };
};

/**
 * checkBudget
 * Input: { userId, tripId }
 * Output: { totalBudget, estimatedSpend, remaining } | { error }
 */
export const checkBudget = async ({ userId, tripId }) => {
  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { error: "Trip not found." };

  const estimatedSpend = (trip.itinerary?.days || []).reduce(
    (sum, day) => sum + (day.activities || []).reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0),
    0
  );

  return {
    totalBudget: trip.budget,
    estimatedSpend,
    remaining: trip.budget - estimatedSpend,
  };
};

/**
 * prepareOptimization
 * Input: { userId, tripId }
 * Output: { success, changesSummary, proposedDays, newFeasibilityScore } | { error }
 * READ-ONLY despite the name — it calls the existing optimizer logic and
 * returns a PROPOSAL. It does NOT save anything. Saving only happens via
 * applyProposedChanges, after explicit user approval (Phase 6/17).
 */
export const prepareOptimization = async ({ userId, tripId }) => {
  const Trip = (await import("../models/Trip.js")).default;
  const Destination = (await import("../models/Destination.js")).default;
  const { structuredGenerate } = await import("./aiService.js");
  const { validateItinerary } = await import("../utils/itineraryValidator.js");

  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { error: "Trip not found." };

  const destination = await Destination.findOne({ name: trip.destination });
  if (!destination) return { error: "Destination data not found." };

  const warnings = [`User requested budget optimization via Copilot. Current budget: $${trip.budget}.`];

  const prompt = `You are optimizing an existing travel itinerary for ${destination.name}, ${destination.country} to reduce costs.

Current itinerary (JSON):
${JSON.stringify(trip.itinerary?.days || [], null, 2)}

Total budget: $${trip.budget}

Reduce total estimated cost by removing or swapping expensive activities for cheaper real alternatives (use ${destination.name}'s actual attractions/food where possible), without dropping below 2 activities per day. Keep the same number of days. Preserve activities that are already low-cost.

Respond ONLY with valid JSON:
{ "days": [ { "day": 1, "date": "YYYY-MM-DD", "activities": [ { "title": "", "category": "sightseeing|food|adventure|relaxation|shopping|culture", "startTime": "", "endTime": "", "estimatedCost": 0, "location": "", "description": "" } ] } ], "changesSummary": ["..."] }`;

  let aiData;
  try {
    aiData = await structuredGenerate(prompt);
  } catch (err) {
    return { error: "Couldn't generate optimization suggestions right now." };
  }

  const validation = validateItinerary(aiData, {
    days: trip.itinerary.days.length,
    budget: trip.budget,
    startDate: trip.itinerary.days[0]?.date,
  });

  return {
    success: true,
    proposedDays: validation.repairedDays,
    changesSummary: aiData.changesSummary || [],
    newFeasibilityScore: validation.feasibilityScore,
    originalCost: (trip.itinerary?.days || []).reduce((s, d) => s + (d.activities || []).reduce((s2, a) => s2 + (Number(a.estimatedCost) || 0), 0), 0),
    newCost: validation.totalEstimatedCost,
  };
};

/**
 * prepareWeatherReplan
 * Input: { userId, tripId }
 * Output: { success, proposedDays, changesSummary } | { error }
 * Reuses the existing weather impact detection + alternative suggestion
 * logic (built for the Travel Intelligence feature) — no duplicated logic,
 * just called from a different entry point (Phase 5's explicit rule).
 * READ-ONLY despite living in WRITE_TOOLS — it returns a PROPOSAL only.
 * Saving only happens via applyProposedChanges, after explicit user
 * approval, matching the prepareOptimization pattern above.
 */
export const prepareWeatherReplan = async ({ userId, tripId }) => {
  const Trip = (await import("../models/Trip.js")).default;
  const Destination = (await import("../models/Destination.js")).default;
  const User = (await import("../models/User.js")).default;
  const { detectDayImpact } = await import("../utils/weatherImpact.js");
  const { suggestReplacement } = await import("../utils/alternativeSuggestions.js");

  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { error: "Trip not found." };

  const destination = await Destination.findOne({ name: trip.destination });
  if (!destination?.coordinates?.lat) {
    return { error: "Weather information is unavailable for this destination." };
  }

  const user = await User.findById(userId);
  const days = trip.itinerary?.days || [];
  const dayAlerts = [];

  for (const day of days) {
    if (!day.date) continue;
    try {
      const weather = await getWeatherForDate(destination.coordinates.lat, destination.coordinates.lng, day.date);
      const impact = detectDayImpact(day, weather);
      if (impact.hasAlert) dayAlerts.push({ day: day.day, ...impact });
    } catch {
      // skip day silently — matches existing weather controller behavior
    }
  }

  if (dayAlerts.length === 0) {
    return { success: true, noChangesNeeded: true, changesSummary: [] };
  }

  const alertedDayNumbers = new Set(dayAlerts.map((a) => a.day));
  const usedTitles = days.flatMap((d) => (d.activities || []).map((a) => a.title.toLowerCase()));
  const changesSummary = [];

  const proposedDays = days.map((day) => {
    if (!alertedDayNumbers.has(day.day)) return day;

    const alert = dayAlerts.find((a) => a.day === day.day);
    const affectedTitles = new Set(alert.affectedActivities.map((a) => a.title));

    const newActivities = day.activities.map((activity) => {
      if (!affectedTitles.has(activity.title)) return activity;

      const replacement = suggestReplacement(activity, destination, user.preferences, usedTitles);
      if (replacement) {
        usedTitles.push(replacement.title.toLowerCase());
        changesSummary.push(`Day ${day.day}: "${activity.title}" → "${replacement.title}" (weather risk)`);
        return replacement;
      }
      return activity;
    });

    return { ...day, activities: newActivities };
  });

  return { success: true, proposedDays, changesSummary, affectedDayCount: dayAlerts.length };
};

/**
 * applyProposedChanges
 * Input: { userId, tripId, proposedDays }
 * Output: { success, trip } | { error }
 * The ONLY function in the tool layer that writes to the database.
 * Ownership is enforced (only updates a trip belonging to userId).
 * This must only ever be called after the frontend shows the user the
 * proposal and they explicitly click "Apply" (Phase 17).
 */
export const applyProposedChanges = async ({ userId, tripId, proposedDays }) => {
  const Trip = (await import("../models/Trip.js")).default;

  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) return { error: "Trip not found or not owned by this user." };

  trip.itinerary.days = proposedDays;
  await trip.save();

  return { success: true, trip };
};

// Tool registry — used by the agent to know what's available (Phase 5/18)
export const READ_TOOLS = {
  getCurrentTrip,
  getTripById,
  getDestinationInfo,
  getUserPreferences,
  getRecommendations,
  checkWeather,
  checkItineraryWeatherImpact,
  checkBudget,
  verifyCurrentInfo,
  checkItineraryDisruptions,
};

export const WRITE_TOOLS = {
  prepareOptimization,
  prepareWeatherReplan,
  applyProposedChanges,
};