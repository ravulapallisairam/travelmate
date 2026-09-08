import { classifyIntent, structuredGenerate } from "../services/aiService.js";
import { INTENTS } from "../services/copilotIntents.js";
import * as tools from "../services/copilotTools.js";

const buildResponsePrompt = (userMessage, intent, toolResults) => {
  const trustData = toolResults.verifyCurrentInfo;
  const trustInstructions = trustData
    ? trustData.available
      ? `\n\nIMPORTANT — this question needed current/verifiable information. You have retrieved sources below (see "verifyCurrentInfo" in the data). You MUST:\n- Cite which source(s) you used by name in your reply\n- Mention this information was retrieved just now (as of ${trustData.fetchedAt})\n- These sources are Wikipedia articles — good for general/historical facts, but NOT reliable for live opening hours, current prices, or recent closures. If the user asked specifically about hours/prices/closures, say plainly that this can't be verified from Wikipedia and recommend checking the official site.\n- If the sources disagree with each other or seem unclear, say so plainly instead of picking one silently\n- Do NOT add facts beyond what the sources say`
      : `\n\nIMPORTANT — this question needed current/verifiable information, but no trustworthy source could be found (reason: ${trustData.reason}). You MUST say plainly that you couldn't verify this and recommend the user check an official source directly. Do NOT guess or answer from general knowledge for this question.`
    : "";

  const disruptionData = toolResults.checkItineraryDisruptions;
  const disruptionInstructions = disruptionData
    ? disruptionData.available && disruptionData.disruptions?.length > 0
      ? `\n\nIMPORTANT — the user asked to check their trip for issues. You have a list of disruptions below (see "checkItineraryDisruptions"). Each has a "type" field ("weather" or "closure") and a "severity" ("low"/"medium"/"high"). You MUST:\n- Group and summarize by day, mentioning the type and severity of each\n- For "closure" type with "medium" severity, be clear this is UNCERTAINTY, not a confirmed closure — recommend double-checking, don't claim it's definitely closed\n- For "weather" type, use the existing message text as-is\n- Do NOT invent disruptions beyond what's listed`
      : `\n\nThe user asked to check their trip for issues. The data shows no disruptions were found — tell them their trip currently looks fine, no weather or closure concerns detected.`
    : "";

  return `You are the TravelMate AI Copilot — a helpful, concise travel assistant embedded in a trip planning app.

User's message: "${userMessage}"
Detected intent: ${intent}

Data retrieved from TravelMate's systems (this is REAL, VERIFIED data — do not contradict it or invent additional details):
${JSON.stringify(toolResults, null, 2)}

Rules:
- Only use the data above. Never invent attractions, prices, weather, or bookings.
- If the data shows no trip/weather/etc. is available, say so plainly — don't make something up.
- Be conversational but concise (2-4 sentences max unless listing items).${trustInstructions}${disruptionInstructions}

Respond ONLY with JSON, no markdown:
{ "reply": "your natural language response" }`;
};

const buildProposalPrompt = (userMessage, actionType, proposalResult) => {
  return `You are the TravelMate AI Copilot. The user asked: "${userMessage}"

You've already prepared a proposed change (${actionType}). Here is the result:
${JSON.stringify(proposalResult, null, 2)}

Write a short, friendly 1-2 sentence message introducing this proposal to the user. Do NOT list the details (they'll see a card with that). Do NOT claim anything has been changed yet — this is only a proposal awaiting their approval.

Respond ONLY with JSON, no markdown:
{ "reply": "your intro message" }`;
};

const runToolsForIntent = async (intentDef, context) => {
  const results = {};
  for (const toolName of intentDef.tools) {
    const tool = tools.READ_TOOLS[toolName];
    if (!tool) continue;
    try {
      results[toolName] = await tool(context);
    } catch (err) {
      console.error(`[Copilot] Tool ${toolName} failed:`, err.message);
      results[toolName] = { error: "Tool execution failed." };
    }
  }
  return results;
};

export const sendCopilotMessage = async (req, res) => {
  try {
    const { message, tripId } = req.body;
    const userId = req.user._id;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    let intentResult;
    try {
      intentResult = await classifyIntent(message, INTENTS);
    } catch (err) {
      console.log("[Copilot] Intent classification failed:", err.message);
      return res.json({
        reply: "I'm having trouble understanding right now — Google's AI service seems to be busy. Please try again in a moment.",
        suggestsAction: false,
      });
    }

    const intentDef = INTENTS.find((i) => i.name === intentResult.intent) || INTENTS.find((i) => i.name === "UNKNOWN");
    console.log(`[Copilot] Intent: ${intentDef.name} (confidence: ${intentResult.confidence})`);

    if (intentDef.name === "UNKNOWN") {
      return res.json({
        reply: "I can help with things like checking your trip, budget, weather impact, optimizing your trip, or recommending destinations. Could you rephrase that?",
        suggestsAction: false,
      });
    }

    // Get the trip first (almost every intent needs it as context)
    const currentTripResult = await tools.READ_TOOLS.getCurrentTrip({ userId });
    if (!currentTripResult?.trip) {
      return res.json({
        reply: "You don't have any saved trips yet. Head to the Trip Planner to generate one, and I can help you manage it from there.",
        suggestsAction: false,
      });
    }
    const resolvedTripId = tripId || currentTripResult.trip._id;

    // WRITE-ACTION PATH: prepare a proposal instead of just answering (Phase 6/17)
    if (intentDef.requiresApproval) {
      console.log(`[Copilot] Preparing proposal for action: ${intentDef.actionType}`);

      let proposalResult;
      if (intentDef.actionType === "OPTIMIZE") {
        proposalResult = await tools.WRITE_TOOLS.prepareOptimization({ userId, tripId: resolvedTripId });
      } else if (intentDef.actionType === "WEATHER_REPLAN") {
        proposalResult = await tools.WRITE_TOOLS.prepareWeatherReplan({ userId, tripId: resolvedTripId });

        if (proposalResult.noChangesNeeded) {
          return res.json({ reply: "Good news — I checked the forecast and your current plan looks fine, no weather conflicts detected.", suggestsAction: false });
        }
      } else {
        return res.json({ reply: "That type of change isn't supported through chat yet.", suggestsAction: false });
      }

      if (proposalResult.error) {
        return res.json({ reply: `I couldn't prepare that change: ${proposalResult.error}`, suggestsAction: false });
      }

      let introMessage;
      try {
        introMessage = await structuredGenerate(buildProposalPrompt(message, intentDef.actionType, proposalResult));
      } catch {
        introMessage = { reply: "I've prepared some changes for you to review." };
      }

      return res.json({
        reply: introMessage.reply,
        suggestsAction: true,
        actionType: intentDef.actionType,
        proposal: {
          tripId: resolvedTripId,
          proposedDays: proposalResult.proposedDays,
          changesSummary: proposalResult.changesSummary,
          originalCost: proposalResult.originalCost,
          newCost: proposalResult.newCost,
          newFeasibilityScore: proposalResult.newFeasibilityScore,
        },
        intent: intentDef.name,
      });
    }

    // READ-ONLY PATH: run tools, answer directly (unchanged from before)
    const context = {
      userId,
      tripId: resolvedTripId,
      message,
      destinationName: currentTripResult.trip.destination,
    };
    const toolResults = await runToolsForIntent(intentDef, context);
    toolResults.getCurrentTrip = currentTripResult; // reuse what we already fetched

    const prompt = buildResponsePrompt(message, intentDef.name, toolResults);
    let aiResponse;
    try {
      aiResponse = await structuredGenerate(prompt);
    } catch (err) {
      console.error("[Copilot] Response generation failed:", err.message);
      return res.json({ reply: "I found the information but I'm having trouble phrasing a response right now. Please try again.", suggestsAction: false });
    }

    res.json({ reply: aiResponse.reply, suggestsAction: false, intent: intentDef.name });
  } catch (error) {
    console.error("[Copilot] Fatal error:", error);
    res.status(500).json({ reply: "Something went wrong on my end. Please try again.", suggestsAction: false });
  }
};

export const applyCopilotProposal = async (req, res) => {
  try {
    const { tripId, proposedDays } = req.body;
    const userId = req.user._id;

    if (!tripId || !Array.isArray(proposedDays)) {
      return res.status(400).json({ message: "Missing tripId or proposedDays." });
    }

    const result = await tools.WRITE_TOOLS.applyProposedChanges({ userId, tripId, proposedDays });

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({ success: true, trip: result.trip });
  } catch (error) {
    console.error("[Copilot] Apply proposal error:", error);
    res.status(500).json({ message: "Couldn't apply the changes right now." });
  }
};