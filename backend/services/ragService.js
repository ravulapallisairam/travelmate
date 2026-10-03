// RAG Service — retrieves relevant knowledge chunks from TravelMate's own
// verified destination data (MongoDB), not a vector database. At this data
// scale, a vector DB adds infrastructure cost with no measurable retrieval
// benefit over structured field matching — this is intentionally NOT
// over-engineered (Phase 25's explicit rule).
//
// Flow: USER QUESTION → retrieve relevant fields → build grounded context →
// LLM answers ONLY from that context → response.

import Destination from "../models/Destination.js";

// Splits a destination's verified fields into discrete, labeled "chunks" —
// the retrieval unit. This is what makes it RAG rather than a raw dump:
// each chunk is independently retrievable and sourced.
const buildKnowledgeChunks = (destination) => {
  const chunks = [];

  if (destination.description) {
    chunks.push({ source: "description", content: destination.description });
  }
  if (destination.bestTimeToVisit) {
    chunks.push({ source: "bestTimeToVisit", content: `Best time to visit: ${destination.bestTimeToVisit}` });
  }
  if (destination.topAttractions?.length) {
    chunks.push({ source: "topAttractions", content: `Top attractions: ${destination.topAttractions.join(", ")}` });
  }
  if (destination.activities?.length) {
    chunks.push({ source: "activities", content: `Things to do: ${destination.activities.join(", ")}` });
  }
  if (destination.foodRecommendations?.length) {
    chunks.push({ source: "foodRecommendations", content: `Local food: ${destination.foodRecommendations.join(", ")}` });
  }
  if (destination.travelTips?.length) {
    destination.travelTips.forEach((tip, i) => chunks.push({ source: `travelTips[${i}]`, content: tip }));
  }
  if (destination.estimatedDailyBudget) {
    chunks.push({ source: "estimatedDailyBudget", content: `Estimated daily budget: $${destination.estimatedDailyBudget}` });
  }

  return chunks;
};

// Simple relevance scoring: counts keyword overlap between the question
// and each chunk. No embeddings needed — at this scale, keyword matching
// against a handful of labeled chunks per destination is equally
// effective and has zero infra cost or latency.
const scoreChunkRelevance = (question, chunk) => {
  const questionWords = question.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const chunkText = chunk.content.toLowerCase();
  let score = 0;
  questionWords.forEach((word) => {
    if (chunkText.includes(word)) score++;
  });
  return score;
};

/**
 * retrieveDestinationKnowledge
 * Input: { destinationName, question }
 * Output: { found, destination, retrievedChunks } | { found: false }
 *
 * This is the RETRIEVER step of RAG: given a question, find the destination
 * and return only the chunks relevant to it — not the entire document.
 */
export const retrieveDestinationKnowledge = async ({ destinationName, question }) => {
  const destination = await Destination.findOne({ name: { $regex: destinationName, $options: "i" } });
  if (!destination) return { found: false };

  const allChunks = buildKnowledgeChunks(destination);
  const scored = allChunks
    .map((chunk) => ({ ...chunk, relevance: scoreChunkRelevance(question, chunk) }))
    .sort((a, b) => b.relevance - a.relevance);

  // Take the top 5 most relevant chunks, but always include ones with
  // non-zero relevance — if nothing matches well, fall back to description
  // + attractions as a reasonable default rather than returning nothing.
  const topChunks = scored.filter((c) => c.relevance > 0).slice(0, 5);
  const retrievedChunks = topChunks.length > 0 ? topChunks : allChunks.slice(0, 3);

  return {
    found: true,
    destination: { name: destination.name, country: destination.country, state: destination.state },
    retrievedChunks: retrievedChunks.map((c) => ({ source: c.source, content: c.content })),
  };
};