import { classifyIntent, structuredGenerate } from "../services/aiService.js";
import { INTENTS } from "../services/copilotIntents.js";
import * as tools from "../services/copilotTools.js";
import { resolveDestination, retrieveKnowledgeForDestination } from "../services/ragService.js";
import { logger } from "../utils/logger.js";

const MAX_HISTORY_MESSAGES = 6;
const MAX_MESSAGE_CHARS = 500;

// Conversation memory comes from the client, so it is treated as untrusted text.
// It only gives the model conversational context. It is never used for
// authorization: ownership checks and approval gates do not depend on it.
const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_CHARS) }));
};

const formatHistory = (history) =>
  history.length
    ? history.map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.text}`).join("\n")
    : "(no earlier messages)";

const buildResponsePrompt = (userMessage, intent, toolResults, history) => `You are the TravelMate AI Copilot — a helpful, concise travel assistant embedded in a trip planning app.

Recent conversation:
${formatHistory(history)}

User's latest message: "${userMessage}"
Detected intent: ${intent}

Data retrieved from TravelMate's systems (REAL, VERIFIED data — do not contradict it or invent additional details):
${JSON.stringify(toolResults, null, 2)}

Rules:
- Only use the data above. Never invent attractions, prices, weather, or bookings.
- Any trip data is the user's most recently SAVED trip. When discussing it, name that trip (for example "your Rome Adventure Trip"). If the user is looking at an unsaved plan on screen, you cannot see it.
- If the data shows nothing is available, say so plainly.
- Use the recent conversation only to understand what the user is referring to.
- Be conversational but concise (2-4 sentences unless listing items).

Respond ONLY with JSON, no markdown:
{ "reply": "your natural language response" }`;

const buildRagPrompt = (userMessage, retrieval, history) => {
  const chunksText = retrieval.retrievedChunks.map((c) => `[${c.source}] ${c.content}`).join("\n");

  return `You are the TravelMate AI Copilot answering a question about ${retrieval.destination.name}, ${retrieval.destination.country}.

Recent conversation:
${formatHistory(history)}

User's latest question: "${userMessage}"

RETRIEVED KNOWLEDGE (the ONLY information you may use — do not add facts not present here):
${chunksText}

Rules:
- Answer using ONLY the retrieved knowledge above.
- If it doesn't fully answer the question, say plainly: "I don't have verified information on [the missing part]."
- Never invent attractions, prices, opening hours, or facts not in the retrieved knowledge.
- Be conversational, 2-4 sentences.

Respond ONLY with JSON, no markdown:
{ "reply": "your answer" }`;
};

const buildProposalPrompt = (userMessage, actionType, proposalResult, history) => `You are the TravelMate AI Copilot.

Recent conversation:
${formatHistory(history)}

The user asked: "${userMessage}"

You've already prepared a proposed change (${actionType}). Here is the result:
${JSON.stringify(proposalResult, null, 2)}

Write a short, friendly 1-2 sentence message introducing this proposal. Do NOT list the details (the user will see a card with them). Do NOT claim anything has been changed yet — this is only a proposal awaiting approval.

Respond ONLY with JSON, no markdown:
{ "reply": "your intro message" }`;

const runToolsForIntent = async (intentDef, context) => {
  const results = {};
  for (const toolName of intentDef.tools) {
    const tool = tools.READ_TOOLS[toolName];
    if (!tool) continue;
    try {
      results[toolName] = await tool(context);
    } catch (err) {
      logger.error("Copilot", `Tool ${toolName} failed`, err);
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
    const history = sanitizeHistory(req.body.history);

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    let intentResult;
    try {
      intentResult = await classifyIntent(message, INTENTS, history);
    } catch (err) {
      logger.warn("Copilot", `Intent classification failed: ${err.message}`);
      return res.json({
        reply: "I'm having trouble understanding right now — Google's AI service seems to be busy. Please try again in a moment.",
        suggestsAction: false,
      });
    }

    const intentDef = INTENTS.find((i) => i.name === intentResult.intent) || INTENTS.find((i) => i.name === "UNKNOWN");
    logger.info("Copilot", `Intent classified: ${intentDef.name}`, {
      confidence: intentResult.confidence,
      userId: userId.toString(),
      historyMessages: history.length,
    });

    if (intentDef.name === "UNKNOWN") {
      return res.json({
        reply: "I can help with things like checking your trip, budget, weather impact, optimizing your trip, destination info, or recommending destinations. Could you rephrase that?",
        suggestsAction: false,
      });
    }

    // ---------- Intents that do NOT require a saved trip ----------

    // DESTINATION_INFO (RAG): the destination named in the message wins; the saved
    // trip's destination is only a fallback for questions like "what food should I try?"
    if (intentDef.name === "DESTINATION_INFO") {
      const tripResult = await tools.READ_TOOLS.getCurrentTrip({ userId });
      const destination = await resolveDestination({
        message,
        history,
        fallbackName: tripResult?.trip?.destination,
      });

      if (!destination) {
        return res.json({
          reply: "Which destination would you like to know about? For example, try \"Tell me about Munnar\".",
          suggestsAction: false,
          intent: intentDef.name,
        });
      }

      const retrieval = retrieveKnowledgeForDestination(destination, message);

      let ragResponse;
      try {
        ragResponse = await structuredGenerate(buildRagPrompt(message, retrieval, history));
      } catch (err) {
        logger.error("Copilot-RAG", "Response generation failed", err);
        return res.json({
          reply: "I'm having trouble retrieving that information right now.",
          suggestsAction: false,
          intent: intentDef.name,
        });
      }

      logger.metric("Copilot-RAG", `DESTINATION_INFO answered for ${destination.name} (${retrieval.retrievedChunks.length} chunks)`, Date.now() - startTime);
      return res.json({
        reply: ragResponse.reply,
        suggestsAction: false,
        intent: intentDef.name,
        destination: destination.name,
        sources: retrieval.retrievedChunks.map((c) => c.source),
      });
    }

    // GET_RECOMMENDATIONS works for any logged-in user, with or without a saved trip.
    if (intentDef.name === "GET_RECOMMENDATIONS") {
      const toolResults = await runToolsForIntent(intentDef, { userId });

      let aiResponse;
      try {
        aiResponse = await structuredGenerate(buildResponsePrompt(message, intentDef.name, toolResults, history));
      } catch (err) {
        logger.error("Copilot", "Response generation failed", err);
        return res.json({
          reply: "I found some recommendations but I'm having trouble phrasing a response right now. Please try again.",
          suggestsAction: false,
        });
      }

      logger.metric("Copilot", `${intentDef.name} completed`, Date.now() - startTime);
      return res.json({ reply: aiResponse.reply, suggestsAction: false, intent: intentDef.name });
    }

    // ---------- Intents that require a saved trip ----------

    const currentTripResult = await tools.READ_TOOLS.getCurrentTrip({ userId });
    if (!currentTripResult?.trip) {
      return res.json({
        reply: "You don't have any saved trips yet. Head to the Trip Planner to generate and save one, and I can help you manage it from there.",
        suggestsAction: false,
      });
    }
    const resolvedTripId = tripId || currentTripResult.trip._id;

    // WRITE-ACTION PATH: prepare a proposal; nothing is saved until the user approves.
    if (intentDef.requiresApproval) {
      let proposalResult;
      if (intentDef.actionType === "OPTIMIZE") {
        proposalResult = await tools.WRITE_TOOLS.prepareOptimization({ userId, tripId: resolvedTripId });
      } else if (intentDef.actionType === "WEATHER_REPLAN") {
        proposalResult = await tools.WRITE_TOOLS.prepareWeatherReplan({ userId, tripId: resolvedTripId });
        if (proposalResult.noChangesNeeded) {
          return res.json({
            reply: "Good news — I checked the forecast and your current plan looks fine, no weather conflicts detected.",
            suggestsAction: false,
          });
        }
      } else {
        return res.json({ reply: "That type of change isn't supported through chat yet.", suggestsAction: false });
      }

      if (proposalResult.error) {
        return res.json({ reply: `I couldn't prepare that change: ${proposalResult.error}`, suggestsAction: false });
      }

      let introMessage;
      try {
        introMessage = await structuredGenerate(buildProposalPrompt(message, intentDef.actionType, proposalResult, history));
      } catch {
        introMessage = { reply: "I've prepared some changes for you to review." };
      }

      logger.metric("Copilot", `${intentDef.name} proposal generated`, Date.now() - startTime);
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
    const context = { userId, tripId: resolvedTripId };
    const toolResults = await runToolsForIntent(intentDef, context);
    toolResults.getCurrentTrip = currentTripResult;

    let aiResponse;
    try {
      aiResponse = await structuredGenerate(buildResponsePrompt(message, intentDef.name, toolResults, history));
    } catch (err) {
      logger.error("Copilot", "Response generation failed", err);
      return res.json({
        reply: "I found the information but I'm having trouble phrasing a response right now. Please try again.",
        suggestsAction: false,
      });
    }

    logger.metric("Copilot", `${intentDef.name} completed`, Date.now() - startTime);
    res.json({ reply: aiResponse.reply, suggestsAction: false, intent: intentDef.name });
  } catch (error) {
    logger.error("Copilot", "Fatal error", error);
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

    // Ownership is re-checked inside applyProposedChanges; the LLM never decides it.
    const result = await tools.WRITE_TOOLS.applyProposedChanges({ userId, tripId, proposedDays });

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    logger.info("Copilot", "Proposal applied", { userId: userId.toString(), tripId });
    res.json({ success: true, trip: result.trip });
  } catch (error) {
    logger.error("Copilot", "Apply proposal error", error);
    res.status(500).json({ message: "Couldn't apply the changes right now." });
  }
};