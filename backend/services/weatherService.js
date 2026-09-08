// Simple in-memory cache: key = "lat,lng,date" -> { data, cachedAt }
// Weather for the same location/date won't be re-fetched more than once
// every 30 minutes, per Step 13's caching requirement.
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();

const buildCacheKey = (lat, lng, date) => `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;

const classifyCondition = (weatherMain, description) => {
  const main = (weatherMain || "").toLowerCase();
  if (main.includes("rain") || main.includes("drizzle") || main.includes("thunderstorm")) return "rain";
  if (main.includes("snow")) return "snow";
  if (main.includes("clear")) return "clear";
  if (main.includes("cloud")) return "cloudy";
  if (main.includes("fog") || main.includes("mist") || main.includes("haze")) return "fog";
  return "other";
};

const normalizeForecastEntry = (entry) => ({
  dateTime: entry.dt_txt,
  temperature: Math.round(entry.main?.temp ?? 0),
  condition: classifyCondition(entry.weather?.[0]?.main, entry.weather?.[0]?.description),
  description: entry.weather?.[0]?.description || "unknown",
  rainProbability: Math.round((entry.pop || 0) * 100), // OpenWeather gives 0-1, convert to %
  rainAmount: entry.rain?.["3h"] || 0,
  windSpeed: Math.round(entry.wind?.speed ?? 0),
});

// Returns a normalized daily summary for a given lat/lng/date.
// Throws on failure - caller is responsible for catching and falling back gracefully.
export const getWeatherForDate = async (lat, lng, dateStr) => {
  if (!lat || !lng) {
    throw new Error("Missing coordinates for weather lookup");
  }

  const cacheKey = buildCacheKey(lat, lng, dateStr);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { ...cached.data, cached: true, updatedMinutesAgo: Math.round((Date.now() - cached.cachedAt) / 60000) };
  }

  const apiKey = (process.env.OPENWEATHER_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Weather provider timed out");
    throw new Error("Weather provider request failed");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Weather provider returned ${response.status}`);
  }

  const data = await response.json();

  // OpenWeather's free "forecast" endpoint only covers 5 days in 3-hour steps.
  // Filter entries that match the requested date.
  const dayEntries = (data.list || []).filter((e) => e.dt_txt?.startsWith(dateStr));

  if (dayEntries.length === 0) {
    throw new Error("No forecast available for this date (may be beyond 5-day range)");
  }

  // Summarize: worst-case rain probability, average temp, most common condition
  const normalized = dayEntries.map(normalizeForecastEntry);
  const maxRainProbability = Math.max(...normalized.map((e) => e.rainProbability));
  const avgTemp = Math.round(normalized.reduce((sum, e) => sum + e.temperature, 0) / normalized.length);
  const dominantCondition = normalized.sort((a, b) => b.rainProbability - a.rainProbability)[0].condition;

  const summary = {
    date: dateStr,
    temperature: avgTemp,
    condition: dominantCondition,
    rainProbability: maxRainProbability,
    windSpeed: Math.max(...normalized.map((e) => e.windSpeed)),
    hourly: normalized,
  };

  cache.set(cacheKey, { data: summary, cachedAt: Date.now() });

  return { ...summary, cached: false, updatedMinutesAgo: 0 };
};