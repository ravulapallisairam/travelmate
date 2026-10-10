// RAG Service — retrieves relevant knowledge chunks from TravelMate's own
// verified destination data (MongoDB). Intentionally no vector DB: at this data
// scale, labeled field chunks + keyword scoring retrieve just as well with zero
// infra cost.
//
// Flow: USER QUESTION → resolve destination → retrieve relevant chunks →
// LLM answers ONLY from those chunks.

import Destination from "../models/Destination.js";

// Words too generic to identify a destination on their own.
const GENERIC_WORDS = new Set([
  "the", "new", "park", "national", "temple", "hills", "hill", "islands", "island",
  "beaches", "beach", "golden", "sun", "fort", "palace", "trekking", "city",
]);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A destination can be referred to by its full name, any comma-separated part
// ("Taj Mahal, Agra" → "Agra"), or a distinctive first word ("Goa Beaches" → "Goa").
const buildAliases = (name) => {
  const aliases = new Set();
  const lower = name.toLowerCase();
  aliases.add(lower);
  lower.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (trimmed) aliases.add(trimmed);
  });
  const firstWord = lower.split(/[\s,]+/)[0];
  if (firstWord && firstWord.length >= 3 && !GENERIC_WORDS.has(firstWord)) aliases.add(firstWord);
  return [...aliases];
};

// Destination names rarely change, so cache the list briefly to avoid a DB
// round-trip on every Copilot message.
const NAME_CACHE_TTL_MS = 10 * 60 * 1000;
let nameCache = { at: 0, list: [] };

const getDestinationIndex = async () => {
  if (Date.now() - nameCache.at < NAME_CACHE_TTL_MS && nameCache.list.length) return nameCache.list;
  const docs = await Destination.find({}, { name: 1 }).lean();
  nameCache = {
    at: Date.now(),
    list: docs.map((d) => ({ _id: d._id, name: d.name, aliases: buildAliases(d.name) })),
  };
  return nameCache.list;
};

// Returns the _id of the destination mentioned in `text`, preferring the
// longest (most specific) matching alias. Returns null if none is mentioned.
const findMentionedDestinationId = (text, index) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  let best = null;
  for (const dest of index) {
    for (const alias of dest.aliases) {
      const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      if (pattern.test(lower) && (!best || alias.length > best.length)) {
        best = { id: dest._id, length: alias.length };
      }
    }
  }
  return best ? best.id : null;
};

/**
 * resolveDestination
 * Priority: destination named in the message → named in recent conversation →
 * the user's saved-trip destination (fallbackName) → null.
 * Pure lookup logic; the LLM is never asked to pick a destination.
 */
export const resolveDestination = async ({ message, history = [], fallbackName }) => {
  const index = await getDestinationIndex();

  let id = findMentionedDestinationId(message, index);

  if (!id) {
    for (let i = history.length - 1; i >= 0 && !id; i--) {
      id = findMentionedDestinationId(history[i].text, index);
    }
  }

  if (id) return Destination.findById(id);

  if (fallbackName) {
    return Destination.findOne({ name: new RegExp(`^${escapeRegex(fallbackName)}$`, "i") });
  }

  return null;
};

// Splits a destination's verified fields into discrete, labeled chunks —
// the retrieval unit that makes this RAG rather than a raw document dump.
const buildKnowledgeChunks = (destination) => {
  const chunks = [];

  if (destination.description) chunks.push({ source: "description", content: destination.description });
  if (destination.bestTimeToVisit) chunks.push({ source: "bestTimeToVisit", content: `Best time to visit: ${destination.bestTimeToVisit}` });
  if (destination.topAttractions?.length) chunks.push({ source: "topAttractions", content: `Top attractions: ${destination.topAttractions.join(", ")}` });
  if (destination.activities?.length) chunks.push({ source: "activities", content: `Things to do: ${destination.activities.join(", ")}` });
  if (destination.foodRecommendations?.length) chunks.push({ source: "foodRecommendations", content: `Local food: ${destination.foodRecommendations.join(", ")}` });
  if (destination.travelTips?.length) {
    destination.travelTips.forEach((tip, i) => chunks.push({ source: `travelTips[${i}]`, content: tip }));
  }
  if (destination.estimatedDailyBudget) chunks.push({ source: "estimatedDailyBudget", content: `Estimated daily budget: $${destination.estimatedDailyBudget}` });

  return chunks;
};

// Keyword-overlap relevance between the question and a chunk.
const scoreChunkRelevance = (question, chunk) => {
  const words = question.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const text = chunk.content.toLowerCase();
  return words.reduce((score, w) => (text.includes(w) ? score + 1 : score), 0);
};

/**
 * retrieveKnowledgeForDestination — the RETRIEVER step.
 * Returns only the chunks relevant to the question, not the whole document.
 */
export const retrieveKnowledgeForDestination = (destination, question) => {
  const allChunks = buildKnowledgeChunks(destination);
  const scored = allChunks
    .map((chunk) => ({ ...chunk, relevance: scoreChunkRelevance(question, chunk) }))
    .sort((a, b) => b.relevance - a.relevance);

  const relevant = scored.filter((c) => c.relevance > 0).slice(0, 5);
  const retrievedChunks = relevant.length > 0 ? relevant : allChunks.slice(0, 3);

  return {
    found: true,
    destination: { name: destination.name, country: destination.country, state: destination.state },
    retrievedChunks: retrievedChunks.map((c) => ({ source: c.source, content: c.content })),
  };
};

// Kept for backward compatibility with earlier code.
export const retrieveDestinationKnowledge = async ({ destinationName, question }) => {
  const destination = await resolveDestination({ message: destinationName });
  if (!destination) return { found: false };
  return retrieveKnowledgeForDestination(destination, question);
};