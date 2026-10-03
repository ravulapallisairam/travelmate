import { classifyIntent, structuredGenerate } from "../services/aiService.js";
import { INTENTS } from "../services/copilotIntents.js";
import * as tools from "../services/copilotTools.js";
import { retrieveDestinationKnowledge } from "../services/ragService.js";

const buildResponsePrompt = (userMessage, intent, toolResults) => {
  const trustData = toolResults.verifyCurrentInfo;
  const trustInstructions = trustData
    ? trustData.available
      ? `\n\nIMPORTANT — this question needed current/verifiable information. You have retrieved sources below (see "verifyCurrentInfo" in the data). You MUST:\n- Cite which source(s) you used by name in your reply\n- Mention this information was retrieved just now (as of ${trustData.fetchedAt})\n- These sources are Wikipedia articles — good for general/historical facts, but NOT reliable for live opening hours, current prices, or recent closures. If the user asked specifically about hours/prices/closures, say plainly that this can't be verified from Wikipedia and recommend checking the official site.\n- If the sources disagree with each other or seem unclear, say so plainly instead of picking one silently\n- Do NOT add facts beyond what the sources say`
      : `\n\nIMPORTANT — this question needed current/verifiable information, but no trustworthy source could be found (reason: ${trustData.reason}). You MUST say plainly that you couldn't verify this and recommend the user check an official source directly. Do NOT guess or answer from general knowledge for this question.`
    : "";

  return `You are the TravelMate AI Copilot — a helpful, concise travel assistant embedded in a trip planning app.

User's message: "${userMessage}"
Detected intent: ${intent}

Data retrieved from TravelMate's systems (this is REAL, VERIFIED data — do not contradict it or invent additional details):
${JSON.stringify(toolResults, null, 2)}

Rules:
- Only use the data above. Never invent attractions, prices, weather, or bookings.
- If the data shows no trip/weather/etc. is available, say so plainly — don't make something up.
- Be conversational but concise (2-4 sentences max unless listing items).${trustInstructions}

Respond ONLY with JSON, no markdown:
{ "reply": "your natural language response" }`;
};

// RAG-grounded prompt — the LLM answers ONLY from retrieved chunks, and
// must explicitly say when something isn't covered (Phase 11's hallucination
// control: "I don't have verified information for that").
const buildRagPrompt = (userMessage, retrieval) => {
  if (!retrieval.found) {
    return null; // no destination matched, handled separately
  }

  const chunksText = retrieval.retrievedChunks.map((c) => `[${c.source}] ${c.content}`).join("\n");

  return `You are the TravelMate AI Copilot answering a question about ${retrieval.destination.name}, ${retrieval.destination.country}.

User's question: "${userMessage}"

RETRIEVED KNOWLEDGE (this is the ONLY information you may use — do not add facts not present here):
${chunksText}

Rules:
- Answer using ONLY the retrieved knowledge above.
- If the retrieved knowledge doesn't fully answer the question, say so plainly: "I don't have verified information on [the missing part]."
- Never invent attractions, prices, opening hours, or facts not in the retrieved knowledge.
- Be conversational, 2-4 sentences.

Respond ONLY with JSON, no markdown:
{ "reply": "your answer" }`;
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
  const startTime = Date.now();
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

    // READ-ONLY PATH
    const context = {
      userId,
      tripId: resolvedTripId,
      message,
      destinationName: currentTripResult.trip.destination,
    };

    // DESTINATION_INFO uses RAG — retrieve relevant knowledge chunks instead
    // of just dumping the raw destination document into the prompt.
    if (intentDef.name === "DESTINATION_INFO") {
      // Uses the current trip's destination as a sensible default.
      const destinationName = currentTripResult.trip.destination;
      const retrieval = await retrieveDestinationKnowledge({ destinationName, question: message });

      if (!retrieval.found) {
        return res.json({ reply: `I don't have verified information about that destination yet.`, suggestsAction: false, intent: intentDef.name });
      }

      const ragPrompt = buildRagPrompt(message, retrieval);
      let ragResponse;
      try {
        ragResponse = await structuredGenerate(ragPrompt);
      } catch (err) {
        console.error("[Copilot-RAG] Response generation failed:", err.message);
        return res.json({ reply: "I'm having trouble retrieving that information right now.", suggestsAction: false, intent: intentDef.name });
      }

      console.log(`[Copilot-RAG] DESTINATION_INFO answered (${retrieval.retrievedChunks.length} chunks) in ${Date.now() - startTime}ms`);
      return res.json({
        reply: ragResponse.reply,
        suggestsAction: false,
        intent: intentDef.name,
        sources: retrieval.retrievedChunks.map((c) => c.source),
      });
    }

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