// Routing Service — estimates real travel time between two coordinates
// using OSRM's public demo server (free, no API key required).
// This is a shared public instance with no SLA, so failures are expected
// occasionally and must be handled gracefully (never break the itinerary).
//
// Cached in MongoDB (RouteCache), same two-tier pattern as geocoding:
// a same-day repeat of an itinerary (or another user visiting the same
// destination) will often reuse the same coordinate pairs, so this avoids
// re-hitting OSRM for routes we've already resolved. Unlike Nominatim,
// OSRM's demo server has no documented rate limit, so there's no
// artificial throttle here — just the cache and a timeout.

import RouteCache from "../models/RouteCache.js";

const routeMemoryCache = new Map();
const ROUTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h, matches geocode cache

const roundCoord = (n) => Math.round(n * 100000) / 100000; // ~1.1m precision

const buildRouteKey = (from, to) =>
  `${roundCoord(from.lat)},${roundCoord(from.lng)}->${roundCoord(to.lat)},${roundCoord(to.lng)}`;

export const getTravelTimeMinutes = async (from, to) => {
  if (!from || !to) return null;

  const key = buildRouteKey(from, to);

  // 1. In-memory — fastest, resets on restart.
  const memHit = routeMemoryCache.get(key);
  if (memHit && Date.now() - memHit.cachedAt < ROUTE_CACHE_TTL_MS) {
    return memHit.duration;
  }

  // 2. MongoDB — persists across restarts and users.
  try {
    const dbHit = await RouteCache.findOne({ key });
    if (dbHit) {
      const duration = dbHit.found ? dbHit.durationMinutes : null;
      routeMemoryCache.set(key, { duration, cachedAt: Date.now() });
      return duration;
    }
  } catch (err) {
    console.log(`RouteCache DB lookup failed for "${key}": ${err.message}`);
    // fall through to a live network lookup
  }

  // 3. Nothing cached — real OSRM call.
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      routeMemoryCache.set(key, { duration: null, cachedAt: Date.now() });
      return null;
    }

    const data = await response.json();
    const durationSeconds = data?.routes?.[0]?.duration;

    if (durationSeconds == null) {
      routeMemoryCache.set(key, { duration: null, cachedAt: Date.now() });
      return null;
    }

    const durationMinutes = Math.round(durationSeconds / 60);
    routeMemoryCache.set(key, { duration: durationMinutes, cachedAt: Date.now() });

    try {
      await RouteCache.findOneAndUpdate(
        { key },
        { key, found: true, durationMinutes },
        { upsert: true }
      );
    } catch (err) {
      console.log(`Failed to persist route for "${key}": ${err.message}`);
    }

    return durationMinutes;
  } catch (err) {
    clearTimeout(timeout);
    console.log(`Routing failed: ${err.message}`);
    routeMemoryCache.set(key, { duration: null, cachedAt: Date.now() });
    return null;
  }
};