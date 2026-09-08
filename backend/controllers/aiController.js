import Destination from "../models/Destination.js";
import { validateItinerary } from "../utils/itineraryValidator.js";

// Try the primary model first; if it's overloaded (503) or its quota is
// exhausted (429), fall back to a second model before giving up. Different
// models have separate quota pools, so hitting the cap on one doesn't mean
// the other is out too. Both models here are confirmed available to new
// free-tier accounts as of testing.
const MODELS = ["gemini-flash-latest", "gemini-3.5-flash-lite"];

const buildGroupSection = (groupProfile) => {
  if (!groupProfile?.isGroup) return "";

  const interestLines = Object.entries(groupProfile.combinedInterests)
    .map(([cat, score]) => `${cat}: ${score}/5`)
    .join(", ");

  const conflictLines = groupProfile.conflicts.length
    ? groupProfile.conflicts
        .map((c) => `- ${c.category}: ${c.high.join("/")} want${c.high.length === 1 ? "s" : ""} this a lot, ${c.low.join("/")} do${c.low.length === 1 ? "es" : ""}n't — try to include SOME of this without making it the whole trip`)
        .join("\n")
    : "";

  return `

GROUP TRIP CONTEXT — this trip is for ${groupProfile.travelerCount} people (${groupProfile.travelerNames.join(", ")}), not one person. Balance the plan across everyone's preferences:
Combined group interest levels (0-5 scale): ${interestLines}
${conflictLines ? `\nKnown preference conflicts to balance carefully:\n${conflictLines}` : ""}

In the "highlights" field, briefly mention how the plan balances different travelers' interests where relevant.`;
};

const buildPrompt = (destination, days, travelers, budget, travelStyle, startDate, endDate, groupProfile) => `You are an expert travel planner. Create a detailed ${days}-day travel itinerary for ${destination.name}, ${destination.country}.

Context about this destination:
- Description: ${destination.description}
- Top attractions: ${(destination.topAttractions || []).join(", ") || "N/A"}
- Available activities: ${(destination.activities || []).join(", ") || "N/A"}
- Local food: ${(destination.foodRecommendations || []).join(", ") || "N/A"}
- Best time to visit: ${destination.bestTimeToVisit || "N/A"}

Trip details:
- Number of travelers: ${travelers}
- Total budget: $${budget} (for the ENTIRE trip, all travelers combined)
- Travel style: ${travelStyle}
- Trip dates: ${startDate} to ${endDate}${buildGroupSection(groupProfile)}

RULES:
1. Generate exactly ${days} days, numbered 1 to ${days}.
2. Each day must have 2-4 activities with realistic non-overlapping time slots between 07:00 and 22:00 (24-hour format, "HH:MM").
3. Each activity needs a realistic estimatedCost in USD for the WHOLE group (not per person).
4. The SUM of all estimatedCost values across all days must not exceed $${budget}.
5. Do not repeat the same attraction/activity twice across the trip.
6. Use the real attractions/activities/food listed above where possible. Vary activity types across days.

Respond ONLY with valid JSON, no markdown, no code fences, no explanation. Use exactly this structure:
{
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "activities": [
        { "title": "specific activity name", "category": "sightseeing|food|adventure|relaxation|shopping|culture", "startTime": "09:00", "endTime": "11:00", "estimatedCost": 25, "location": "specific place name", "description": "one short sentence" }
      ]
    }
  ],
  "hotels": ["hotel suggestion 1", "hotel suggestion 2"],
  "highlights": ["a short reason why this trip will be great", "another highlight"],
  "packingTips": ["tip 1", "tip 2", "tip 3"]
}`;

const extractJson = (text) => {
  const withoutFences = text.replace(/```json|```/g, "").trim();
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return withoutFences;
  }
  return withoutFences.slice(firstBrace, lastBrace + 1);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Calls Gemini directly via REST/fetch. The URL (including the API key) is
// built fresh inside this function every time it's called - never at the
// top of the file - so it always sees the key AFTER dotenv has loaded it.
//
// IMPORTANT distinction between error types:
// - 503 UNAVAILABLE (server overloaded): worth a short retry, since
//   capacity can free up within seconds.
// - 429 RESOURCE_EXHAUSTED (quota exceeded): Google tells us to wait ~30-45s
//   for the quota to reset. A short retry can NEVER succeed here, so
//   we don't waste time retrying the same model - we fail fast and let the
//   caller move on to the fallback model immediately.
const callGeminiWithModel = async (model, prompt, maxRetries = 1) => {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY is missing or empty in process.env at request time.");
  }
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s cap per attempt

    let response;
    try {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error(`[${model}] Gemini call timed out after 20s`);
        lastError = new Error(`${model} timed out`);
        lastError.isOverload = true;
        if (i === maxRetries) throw lastError;
        const delayMs = Math.min(1000 * (i + 1), 3000);
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
    clearTimeout(timeoutId);

    const data = await response.json();

    if (response.ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error(`Unexpected Gemini response shape (${model}):`, JSON.stringify(data, null, 2));
        throw new Error("Gemini response did not contain text");
      }
      return text;
    }

    const status = data?.error?.status;
    const isOverloaded = status === "UNAVAILABLE" || response.status === 503;
    const isQuotaExceeded = status === "RESOURCE_EXHAUSTED" || response.status === 429;

    console.error(`[${model}] Gemini call failed (status ${response.status}, ${status}):`, data?.error?.message);
    lastError = new Error(data?.error?.message || `Gemini request failed with status ${response.status}`);
    lastError.isOverload = isOverloaded || isQuotaExceeded;
    lastError.isQuotaExceeded = isQuotaExceeded;

    if (isQuotaExceeded) {
      throw lastError;
    }

    if (!isOverloaded || i === maxRetries) {
      throw lastError;
    }

    const delayMs = Math.min(1000 * (i + 1), 3000);
    console.log(`[${model}] Gemini busy (overloaded), retrying in ${delayMs / 1000}s... (attempt ${i + 1}/${maxRetries})`);
    await sleep(delayMs);
  }

  throw lastError;
};

// Tries each model in MODELS in order. Moves to the next model if the
// previous one was overloaded OR out of quota. A non-overload, non-quota
// error (e.g. bad key, malformed request, model doesn't exist) fails
// immediately without wasting time trying other models.
const callGemini = async (prompt) => {
  let lastError;

  for (const model of MODELS) {
    try {
      const text = await callGeminiWithModel(model, prompt);
      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (!err.isOverload) {
        throw err;
      }
      const reason = err.isQuotaExceeded ? "quota exceeded" : "overloaded";
      console.log(`${model} unavailable (${reason}), trying next model if available...`);
    }
  }

  throw lastError;
};

export const generateAiItinerary = async (req, res) => {
  const timings = {};
  const mark = (label, start) => { timings[label] = Date.now() - start; };
  const requestStart = Date.now();

  try {
    const { destinationId, days, travelers, budget, travelStyle, startDate, endDate, companionProfiles } = req.body;

    if (!destinationId || !days || !budget || !travelStyle || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required trip details." });
    }

    let t = Date.now();
    const destination = await Destination.findById(destinationId);
    mark("dbFindDestination", t);
    if (!destination) return res.status(404).json({ message: "Destination not found" });

    t = Date.now();
    const { aggregateGroupPreferences } = await import("../utils/groupPreferenceEngine.js");
    const User = (await import("../models/User.js")).default;
    const owner = await User.findById(req.user._id);
    const groupProfile = aggregateGroupPreferences(owner?.preferences, companionProfiles);
    mark("groupPreferenceAggregation", t);

    const prompt = buildPrompt(destination, days, travelers, budget, travelStyle, startDate, endDate, groupProfile);

    let aiData;
    let lastRawText;

    t = Date.now();
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { text, modelUsed } = await callGemini(prompt);
        lastRawText = text;

        try {
          console.log(`--- Gemini response (attempt ${attempt}, model: ${modelUsed}) ---`);
          console.log(JSON.stringify(JSON.parse(text), null, 2));
          console.log("--- end response ---");
        } catch {
          console.log(`--- Gemini raw response (attempt ${attempt}, model: ${modelUsed}, not valid JSON) ---`);
          console.log(text);
          console.log("--- end response ---");
        }

        const cleaned = extractJson(text);
        aiData = JSON.parse(cleaned);

        if (!aiData || !Array.isArray(aiData.days) || aiData.days.length === 0) {
          throw new Error("Parsed JSON is missing a valid 'days' array");
        }
        break;
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err.message);
        if (attempt === 2) {
          console.error("Final raw text that failed to parse:", lastRawText);
          throw err;
        }
      }
    }
    mark("geminiGenerateTotal", t);

    t = Date.now();
    const validation = validateItinerary(aiData, { days, budget, startDate });
    mark("validateItinerary", t);

    t = Date.now();
    const { checkItineraryFeasibility } = await import("../utils/feasibilityChecker.js");
    const feasibilityCheck = await checkItineraryFeasibility(validation.repairedDays, destination.name);
    mark("feasibilityCheck_geocodeAndRoute", t);

    t = Date.now();
    const { estimateTotalTripCost } = await import("../utils/tripCostEstimator.js");
    const totalCostEstimate = estimateTotalTripCost(
      validation.totalEstimatedCost,
      destination,
      days,
      travelers
    );
    mark("costEstimate", t);

    timings.total = Date.now() - requestStart;
    console.log(`[TIMING] generateAiItinerary:`, JSON.stringify(timings));

    res.json({
      destination,
      days: validation.repairedDays,
      hotels: aiData.hotels || [],
      highlights: aiData.highlights || [],
      packingTips: aiData.packingTips || [],
      validation: {
        feasibilityScore: validation.feasibilityScore,
        breakdown: validation.breakdown,
        warnings: validation.warnings,
        totalEstimatedCost: validation.totalEstimatedCost,
      },
      travelFeasibility: feasibilityCheck,
      totalCostEstimate,
      groupProfile: groupProfile.isGroup ? groupProfile : undefined,
      ...(process.env.NODE_ENV !== "production" && { _timings: timings }),
    });
  } catch (error) {
    timings.total = Date.now() - requestStart;
    console.log(`[TIMING] generateAiItinerary (failed):`, JSON.stringify(timings));
    console.error("AI generation error (full):", error);
    const isOverload = !!error.isOverload;
    const isQuotaExceeded = !!error.isQuotaExceeded;
    res.status(503).json({
      message: isQuotaExceeded
        ? "We've hit today's free AI usage limit across our models. Please try again in a minute, or come back a bit later."
        : isOverload
        ? "Google's AI is a bit busy right now across our models. Please try generating again in a minute."
        : "Our AI planner is having trouble right now. Please try again in a moment.",
      overloaded: isOverload,
      quotaExceeded: isQuotaExceeded,
      debug: error.message,
    });
  }
};

const buildOptimizePrompt = (destination, days, budget, travelStyle, currentDays, warnings, feasibilityIssues) => {
  const feasibilitySection = feasibilityIssues?.length
    ? `\n\nTRAVEL-TIME PROBLEMS DETECTED (these MUST be fixed):
${feasibilityIssues.map((issue) => `- Day ${issue.day}: "${issue.from}" ends too close to "${issue.to}" starting — only ${issue.gapMinutes} min gap, but travel takes ~${issue.estimatedTravelMinutes} min. Fix by adjusting start/end times to add at least ${issue.shortfallMinutes + 10} minutes of buffer, or by reordering/replacing one of the two activities.`).join("\n")}`
    : "";

  return `You are optimizing an existing travel itinerary for ${destination.name}, ${destination.country}.

Current itinerary (JSON):
${JSON.stringify(currentDays, null, 2)}

Total budget: $${budget}
Travel style: ${travelStyle}

Problems detected that need fixing:
${(warnings || []).map((w) => `- ${w}`).join("\n") || "- General optimization requested, tighten up scheduling and cost efficiency"}${feasibilitySection}

Your task:
1. Fix any time conflicts by adjusting start/end times so activities don't overlap.
2. Fix any travel-time problems listed above — this is critical, these are real-world impossible transitions.
3. If total cost exceeds budget, reduce costs by removing or swapping expensive activities for cheaper real alternatives, without dropping below 2 activities per day.
4. Remove duplicate activities, replacing them with a different real attraction/activity for this destination.
5. If any day has more than 4 activities, remove the least essential one.
6. Keep exactly ${days} days.
7. Preserve activities that are NOT causing problems — only change what's necessary.

Respond ONLY with valid JSON, no markdown, no explanation. Use exactly this structure:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        { "title": "specific activity name", "category": "sightseeing|food|adventure|relaxation|shopping|culture", "startTime": "09:00", "endTime": "11:00", "estimatedCost": 25, "location": "specific place name", "description": "one short sentence" }
      ]
    }
  ],
  "changesSummary": ["short description of change 1", "short description of change 2"]
}`;
};

export const optimizeItinerary = async (req, res) => {
  const timings = {};
  const mark = (label, start) => { timings[label] = Date.now() - start; };
  const requestStart = Date.now();

  try {
    const { destinationId, days, budget, travelStyle, currentItinerary, warnings, feasibilityIssues } = req.body;

    if (!currentItinerary || !Array.isArray(currentItinerary.days)) {
      return res.status(400).json({ message: "Missing itinerary to optimize." });
    }

    let t = Date.now();
    const destination = await Destination.findById(destinationId);
    mark("dbFindDestination", t);
    if (!destination) return res.status(404).json({ message: "Destination not found" });

    const prompt = buildOptimizePrompt(destination, days, budget, travelStyle, currentItinerary.days, warnings, feasibilityIssues);

    let aiData;
    let lastRawText;

    t = Date.now();
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { text, modelUsed } = await callGemini(prompt);
        lastRawText = text;
        console.log(`--- Optimizer response (attempt ${attempt}, model: ${modelUsed}) ---`);

        const cleaned = extractJson(text);
        aiData = JSON.parse(cleaned);

        if (!aiData || !Array.isArray(aiData.days) || aiData.days.length === 0) {
          throw new Error("Parsed JSON is missing a valid 'days' array");
        }
        break;
      } catch (err) {
        console.error(`Optimizer attempt ${attempt} failed:`, err.message);
        if (attempt === 2) {
          console.error("Final raw text that failed to parse:", lastRawText);
          throw err;
        }
      }
    }
    mark("geminiGenerateTotal", t);

    t = Date.now();
    const validation = validateItinerary(aiData, {
      days,
      budget,
      startDate: currentItinerary.days[0]?.date,
    });
    mark("validateItinerary", t);

    t = Date.now();
    const { checkItineraryFeasibility } = await import("../utils/feasibilityChecker.js");
    const newFeasibilityCheck = await checkItineraryFeasibility(validation.repairedDays, destination.name);
    mark("feasibilityCheck_geocodeAndRoute", t);

    timings.total = Date.now() - requestStart;
    console.log(`[TIMING] optimizeItinerary:`, JSON.stringify(timings));

    res.json({
      days: validation.repairedDays,
      changesSummary: aiData.changesSummary || [],
      validation: {
        feasibilityScore: validation.feasibilityScore,
        breakdown: validation.breakdown,
        warnings: validation.warnings,
        totalEstimatedCost: validation.totalEstimatedCost,
      },
      travelFeasibility: newFeasibilityCheck,
      ...(process.env.NODE_ENV !== "production" && { _timings: timings }),
    });
  } catch (error) {
    timings.total = Date.now() - requestStart;
    console.log(`[TIMING] optimizeItinerary (failed):`, JSON.stringify(timings));
    console.error("Optimization error (full):", error);
    const isOverload = !!error.isOverload;
    const isQuotaExceeded = !!error.isQuotaExceeded;
    res.status(503).json({
      message: isQuotaExceeded
        ? "We've hit today's free AI usage limit. Please try again in a minute."
        : isOverload
        ? "Google's AI is a bit busy right now. Please try optimizing again shortly."
        : "Couldn't optimize the trip right now. Please try again.",
      overloaded: isOverload,
      quotaExceeded: isQuotaExceeded,
    });
  }
};