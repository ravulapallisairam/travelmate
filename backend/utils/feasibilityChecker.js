// Itinerary Feasibility Checker — deterministic logic (no LLM) that
// checks whether consecutive activities in a day are actually reachable
// in the time available between them.
//
// Every unique location in the itinerary is geocoded up front (the
// geocoding service internally rate-limits real network calls to respect
// Nominatim's usage policy — cache hits resolve immediately, so this is
// safe to fire concurrently). Routing checks then run across all days
// at once, with limited concurrency, instead of one day — and one
// activity pair — at a time.

import { geocodeLocation } from "../services/geocodingService.js";
import { getTravelTimeMinutes } from "../services/routingService.js";

const timeToMinutes = (t) => {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Runs `fn` over `items` with at most `limit` in flight at once.
const mapWithConcurrency = async (items, limit, fn) => {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
};

// Geocodes every unique location across the WHOLE itinerary (not per day),
// so a hotel or spot reused on multiple days only costs one lookup, and
// geocoding doesn't restart from scratch for each day.
const geocodeAllLocations = async (days, destinationName) => {
  const uniqueLocations = [...new Set(
    days.flatMap((d) => (d.activities || []).map((a) => a.location).filter(Boolean))
  )];

  const coordsList = await mapWithConcurrency(uniqueLocations, 5, (location) =>
    geocodeLocation(location, destinationName)
  );

  const coordsMap = new Map();
  uniqueLocations.forEach((location, i) => coordsMap.set(location, coordsList[i]));
  return coordsMap;
};

export const checkDayFeasibility = async (day, coordsMap) => {
  const activities = day.activities || [];
  if (activities.length < 2) return { feasible: true, issues: [] };

  const sorted = [...activities]
    .map((a) => ({ ...a, _start: timeToMinutes(a.startTime), _end: timeToMinutes(a.endTime) }))
    .filter((a) => a._start !== null && a._end !== null)
    .sort((a, b) => a._start - b._start);

  const pairs = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }

  const results = await mapWithConcurrency(pairs, 4, async ([current, next]) => {
    const gapMinutes = next._start - current._end;
    if (gapMinutes < 0) return null; // already caught by the time-conflict validator

    const fromCoords = coordsMap.get(current.location);
    const toCoords = coordsMap.get(next.location);
    if (!fromCoords || !toCoords) return null; // can't verify — don't fabricate an issue

    const travelMinutes = await getTravelTimeMinutes(fromCoords, toCoords);
    if (travelMinutes === null || travelMinutes <= gapMinutes) return null; // routing unavailable or feasible

    return {
      from: current.title,
      to: next.title,
      gapMinutes,
      estimatedTravelMinutes: travelMinutes,
      shortfallMinutes: travelMinutes - gapMinutes,
      reason: `Only ${gapMinutes} min between "${current.title}" and "${next.title}", but travel takes ~${travelMinutes} min.`,
    };
  });

  const issues = results.filter(Boolean);
  return { feasible: issues.length === 0, issues };
};

export const checkItineraryFeasibility = async (days, destinationName) => {
  const coordsMap = await geocodeAllLocations(days, destinationName);

  const dayResults = await mapWithConcurrency(days, 4, (day) => checkDayFeasibility(day, coordsMap));

  const issueDays = days
    .map((day, i) => ({ day: day.day, ...dayResults[i] }))
    .filter((r) => !r.feasible);

  return { overallFeasible: issueDays.length === 0, dayIssues: issueDays };
};