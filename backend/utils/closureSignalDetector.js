// Closure Signal Detector — turns a Phase 1 Trust Engine lookup into a
// disruption signal. Deterministic keyword/uncertainty check ONLY — never
// an LLM judgment call about whether something is "really" closed. This
// stays conservative on purpose: it flags genuine uncertainty or explicit
// closure language, and never claims a confident closure it can't support.

const CLOSURE_KEYWORDS = [
  "permanently closed",
  "closed for renovation",
  "closed until",
  "temporarily closed",
  "under restoration",
  "no longer open",
  "ceased operations",
];

// Input: { activityTitle, trustResult } where trustResult is the output of
// retrieveTrustedSources() from trustEngineService.js
// Output: { hasSignal, severity, reason }
export const detectClosureSignal = ({ activityTitle, trustResult }) => {
  if (!trustResult) {
    return { hasSignal: false };
  }

  // No trustworthy source found at all — low-severity uncertainty signal,
  // NOT a claim that it's closed. This is intentionally conservative.
  if (!trustResult.available) {
    return {
      hasSignal: true,
      severity: "low",
      reason: `Couldn't verify current status of "${activityTitle}" from a trusted source — worth double-checking before your visit.`,
    };
  }

  // Sources were found — scan their snippets for explicit closure language.
  const combinedText = trustResult.sources.map((s) => s.snippet).join(" ").toLowerCase();
  const matchedKeyword = CLOSURE_KEYWORDS.find((kw) => combinedText.includes(kw));

  if (matchedKeyword) {
    return {
      hasSignal: true,
      severity: "high",
      reason: `A source mentions "${matchedKeyword}" in relation to "${activityTitle}" — this may not be available as planned.`,
    };
  }

  // Sources found, nothing alarming detected — no disruption signal.
  return { hasSignal: false };
};