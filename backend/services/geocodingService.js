// Geocoding Service — converts a location name into coordinates using
// OpenStreetMap's Nominatim (free, no API key required).
//
// Two-tier cache:
// 1. In-memory Map — fastest, but wiped on every server restart (dev
//    reloads via nodemon, or any redeploy).
// 2. MongoDB (GeocodeCache) — persists across restarts, shared by every
//    request and every user. This is what actually saves real users time,
//    since dev restarts happen constantly and would otherwise throw away
//    all cached geocoding work every time.
//
// Nominatim's usage policy caps clients at 1 request/second. The limiter
// below only throttles actual network calls — cache hits (memory OR DB)
// skip it entirely and resolve without waiting.

import GeocodeCache from "../models/GeocodeCache.js";

const memoryCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — location coordinates don't change

const MIN_REQUEST_INTERVAL_MS = 1100; // 1/sec + a small buffer, per Nominatim's usage policy
let lastRequestAt = 0;
let requestChain = Promise.resolve();

// Chains real network calls so they never fire less than
// MIN_REQUEST_INTERVAL_MS apart, no matter how many callers ask for
// geocoding "at once". One caller's failure never blocks the queue for
// everyone else behind it.
const throttledFetch = (fn) => {
  const result = requestChain.then(async () => {
    const wait = Math.max(0, lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  requestChain = result.catch(() => {});
  return result;
};

export const geocodeLocation = async (locationText, destinationName) => {
  // Bias the search toward the destination's city/region for better accuracy
  // (e.g. "Hawa Mahal" alone is ambiguous, "Hawa Mahal, Jaipur" is not).
  const query = `${locationText}, ${destinationName}`;
  const cacheKey = query.toLowerCase();

  // 1. In-memory cache — fastest path, survives only within this process's uptime.
  const memHit = memoryCache.get(cacheKey);
  if (memHit && Date.now() - memHit.cachedAt < CACHE_TTL_MS) {
    return memHit.coords;
  }

  // 2. MongoDB cache — survives restarts/redeploys, shared across all requests.
  try {
    const dbHit = await GeocodeCache.findOne({ query: cacheKey });
    if (dbHit) {
      const coords = dbHit.found ? { lat: dbHit.lat, lng: dbHit.lng } : null;
      memoryCache.set(cacheKey, { coords, cachedAt: Date.now() }); // warm memory too
      return coords;
    }
  } catch (err) {
    console.log(`GeocodeCache DB lookup failed for "${query}": ${err.message}`);
    // fall through to a live network lookup — DB being briefly unavailable
    // should never block geocoding entirely
  }

  // 3. Nothing cached anywhere — do the real, throttled network call.
  return throttledFetch(async () => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "TravelMateAI/1.0 (educational project)" }, // Nominatim requires a User-Agent
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`);

      const results = await response.json();

      if (!results.length) {
        memoryCache.set(cacheKey, { coords: null, cachedAt: Date.now() });
        try {
          await GeocodeCache.findOneAndUpdate(
            { query: cacheKey },
            { query: cacheKey, found: false },
            { upsert: true }
          );
        } catch (err) {
          console.log(`Failed to persist geocode miss for "${query}": ${err.message}`);
        }
        return null;
      }

      const coords = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      memoryCache.set(cacheKey, { coords, cachedAt: Date.now() });
      try {
        await GeocodeCache.findOneAndUpdate(
          { query: cacheKey },
          { query: cacheKey, found: true, lat: coords.lat, lng: coords.lng },
          { upsert: true }
        );
      } catch (err) {
        console.log(`Failed to persist geocode hit for "${query}": ${err.message}`);
      }
      return coords;
    } catch (err) {
      clearTimeout(timeout);
      console.log(`Geocoding failed for "${query}": ${err.message}`);
      return null;
    }
  });
};