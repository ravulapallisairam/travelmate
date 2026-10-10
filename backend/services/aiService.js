// AI Service Abstraction
// Business logic calls generate()/structuredGenerate()/classifyIntent() and never
// talks to Gemini directly. Swapping providers later means changing only this file.

const MODELS = ["gemini-flash-latest", "gemini-3.5-flash-lite"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractJson = (text) => {
  const withoutFences = text.replace(/```json|```/g, "").trim();
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) return withoutFences;
  return withoutFences.slice(firstBrace, lastBrace + 1);
};

const callGeminiWithModel = async (model, prompt, maxRetries = 2) => {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiKey) throw new Error("GEMINI_API_KEY is missing or empty at request time.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192, temperature: 0.5 },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini response did not contain text");
      return text;
    }

    const status = data?.error?.status;
    const isOverloaded = status === "UNAVAILABLE" || response.status === 503;
    const isQuotaExceeded = status === "RESOURCE_EXHAUSTED" || response.status === 429;

    lastError = new Error(data?.error?.message || `Gemini request failed with status ${response.status}`);
    lastError.isOverload = isOverloaded || isQuotaExceeded;
    lastError.isQuotaExceeded = isQuotaExceeded;

    if (isQuotaExceeded) throw lastError;
    if (!isOverloaded || i === maxRetries) throw lastError;

    await sleep(Math.min(1500 * (i + 1), 6000));
  }
  throw lastError;
};

const callGemini = async (prompt) => {
  let lastError;
  for (const model of MODELS) {
    try {
      const text = await callGeminiWithModel(model, prompt);
      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (!err.isOverload) throw err;
    }
  }
  throw lastError;
};

export const generate = async (prompt) => {
  const { text } = await callGemini(prompt);
  return text;
};

export const structuredGenerate = async (prompt, { maxRetries = 2 } = {}) => {
  let lastRawText;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { text } = await callGemini(prompt);
      lastRawText = text;
      return JSON.parse(extractJson(text));
    } catch (err) {
      if (attempt === maxRetries) {
        console.error("structuredGenerate failed, last raw text:", lastRawText);
        throw err;
      }
    }
  }
};

// history: [{ role: "user" | "assistant", text }] — already sanitized by the caller.
// It is used only to resolve references such as "it", "that", or "the second one".
export const classifyIntent = async (userMessage, availableIntents, history = []) => {
  const historyBlock = history.length
    ? `Recent conversation (use only to resolve references like "it" or "that"):\n${history
        .map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.text}`)
        .join("\n")}\n\n`
    : "";

  const prompt = `Classify the user's latest travel-related request into exactly one intent.

${historyBlock}Latest user message: "${userMessage}"

Available intents:
${availableIntents.map((i) => `- ${i.name}: ${i.description}`).join("\n")}

Respond ONLY with JSON, no markdown:
{ "intent": "INTENT_NAME", "confidence": 0.0 }

If nothing matches well, use "UNKNOWN" with low confidence.`;

  return structuredGenerate(prompt);
};