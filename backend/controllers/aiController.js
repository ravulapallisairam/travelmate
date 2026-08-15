import { GoogleGenAI } from "@google/genai";
import Destination from "../models/Destination.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateAiItinerary = async (req, res) => {
  try {
    const { destinationId, days, travelers, budget, travelStyle, startDate, endDate } = req.body;

    const destination = await Destination.findById(destinationId);
    if (!destination) return res.status(404).json({ message: "Destination not found" });

    // Build the client here, not at the top of the file, so it always
    // sees the GEMINI_API_KEY after dotenv has loaded it.
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are an expert travel planner. Create a detailed ${days}-day travel itinerary for ${destination.name}, ${destination.country}.

Context about this destination:
- Description: ${destination.description}
- Top attractions: ${(destination.topAttractions || []).join(", ") || "N/A"}
- Available activities: ${(destination.activities || []).join(", ") || "N/A"}
- Local food: ${(destination.foodRecommendations || []).join(", ") || "N/A"}
- Best time to visit: ${destination.bestTimeToVisit || "N/A"}

Trip details:
- Number of travelers: ${travelers}
- Total budget: $${budget}
- Travel style: ${travelStyle}
- Trip dates: ${startDate} to ${endDate}

Generate a realistic, non-generic itinerary. Use the actual attractions and food mentioned above where possible. Vary the activities across days — do not repeat the same activity type every day.

Respond ONLY with valid JSON, no markdown, no code fences, no explanation. Use exactly this structure:
{
  "days": [
    { "day": 1, "morning": "specific activity", "afternoon": "specific activity", "evening": "specific activity" }
  ],
  "hotels": ["hotel suggestion 1", "hotel suggestion 2"],
  "highlights": ["a short reason why this trip will be great", "another highlight"],
  "packingTips": ["tip 1", "tip 2", "tip 3"]
}

The "days" array must have exactly ${days} entries.`;

    // Retry a couple of times if Gemini is temporarily overloaded (503).
    const MODEL = "gemini-3.5-flash-lite";
    let result;
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
        });
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        const isOverloaded =
          err.message?.includes("UNAVAILABLE") || err.message?.includes("503");
        if (isOverloaded && attempt < 3) {
          console.log(`Gemini overloaded, retrying (attempt ${attempt})...`);
          await sleep(1500 * attempt);
          continue;
        }
        throw err;
      }
    }
    if (lastError) throw lastError;

    const text = result.text;

    // Strip potential markdown code fences if the model adds them anyway
    const cleaned = text.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleaned);

    res.json({
      destination,
      days: aiData.days,
      hotels: aiData.hotels,
      highlights: aiData.highlights,
      packingTips: aiData.packingTips,
    });
  } catch (error) {
    console.error("AI generation error:", error.message);
    res.status(500).json({ message: "Failed to generate AI itinerary. Please try again." });
  }
};
