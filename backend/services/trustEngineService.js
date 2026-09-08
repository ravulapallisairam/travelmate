// Travel Information Trust & Verification Engine
// Scoped to ONLY answer time-sensitive/factual travel questions (hours,
// closures, current prices, entry rules) — not a general chatbot RAG
// system. Retrieval uses Wikipedia's free public API (no key, no signup,
// no billing risk). Every answer carries source + freshness + confidence
// so uncertainty is never hidden — retrieval is never presented as
// automatically verified.
//
// Tradeoff, stated honestly: Wikipedia covers historical/factual/general
// info well (what a place is, when it was built, general visiting info)
// but does NOT reliably have live hours, current prices, or day-to-day
// closures — those change too often for an encyclopedia. This engine is
// upfront about that gap rather than pretending Wikipedia can answer
// everything a live search API could.

const WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php";

const searchWikipedia = async (query) => {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    format: "json",
    srlimit: "3",
    origin: "*",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${WIKI_SEARCH_URL}?${params}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Wikipedia search failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.query?.search || [];
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
};

// Fetches a plain-text extract (intro summary) for a given page title —
// this is the actual "trusted source content" we'll ground the answer in.
const fetchWikipediaExtract = async (pageTitle) => {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "true",
    explaintext: "true",
    titles: pageTitle,
    format: "json",
    origin: "*",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${WIKI_SEARCH_URL}?${params}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) return null;

    return {
      title: page.title,
      extract: page.extract || "",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    };
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
};

// Retrieves the top matching Wikipedia article(s) for a query, scoped to
// a destination. Deterministic filtering — no LLM decides what's trustworthy.
export const retrieveTrustedSources = async (query, destinationName) => {
  // Wikipedia's full-text search treats the whole message as a bag of
  // words, so conversational filler ("tell me about", "what time does")
  // dilutes the actual subject and can pull in loosely-related articles.
  // Stripping common question/filler phrases gets a cleaner subject query
  // (e.g. "Tell me about the history of the Colosseum" -> "Colosseum").
  const stripFillerPhrases = (text) =>
    text
      .replace(/\b(tell me about|what is|what are|what's|explain|describe|give me|can you tell me)\b/gi, "")
      .replace(/\b(the history of|history of|the current|current)\b/gi, "")
      .replace(/\b(opening hours of|hours of|closing time of|what time does|does it close|open|close)\b/gi, "")
      .replace(/[?.!]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const cleanedQuery = stripFillerPhrases(query) || query; // fall back to raw if stripping empties it
  const scopedQuery = cleanedQuery;

  let searchResults;
  try {
    searchResults = await searchWikipedia(scopedQuery);
    if (searchResults.length === 0) {
      // Fallback 1: cleaned query found nothing, try the raw original.
      searchResults = await searchWikipedia(query);
    }
    if (searchResults.length === 0 && destinationName) {
      // Fallback 2: still nothing, try cleaned query + destination for
      // genuinely ambiguous short queries (e.g. "the fort").
      searchResults = await searchWikipedia(`${cleanedQuery} ${destinationName}`);
    }
  } catch (err) {
    console.error("[TrustEngine] Wikipedia search failed:", err.message);
    return { available: false, reason: "search_failed" };
  }

  if (searchResults.length === 0) {
    return { available: false, reason: "no_matching_article_found" };
  }

  // Sequential with a small gap, not concurrent — Wikipedia's rate limiter
  // reacts to request bursts, and 2 near-simultaneous requests right after
  // the search call above was enough to trigger a 429 in testing.
  const extracts = [];
  for (const r of searchResults.slice(0, 2)) {
    const extract = await fetchWikipediaExtract(r.title);
    extracts.push(extract);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  const sources = extracts.filter(Boolean).map((s) => ({
    title: s.title,
    url: s.url,
    snippet: s.extract.slice(0, 600),
  }));

  if (sources.length === 0) {
    return { available: false, reason: "no_matching_article_found" };
  }

  return {
    available: true,
    sources,
    fetchedAt: new Date().toISOString(),
    coverageNote: "Wikipedia provides general/historical information — it may not reflect live hours, current prices, or recent closures.",
  };
};