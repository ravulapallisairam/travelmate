import { useState, useEffect } from "react";

// Timed to roughly match measured backend stage durations for AI itinerary
// generation (Gemini generation ~9-21s, feasibility/geocoding ~6-13s).
// This is a simulated progression, not a live signal from the backend —
// the backend currently returns one final response, not a stream. The
// timings below are chosen to track real elapsed stage durations we
// measured, so the messages stay honest even though they're not literally
// synced to the server.
const STAGES = [
  { label: "Creating your itinerary with AI...", atMs: 0 },
  { label: "Analyzing destination highlights...", atMs: 3000 },
  { label: "Structuring your day-by-day plan...", atMs: 8000 },
  { label: "Checking travel times between activities...", atMs: 15000 },
  { label: "Validating your schedule...", atMs: 21000 },
  { label: "Finalizing your itinerary...", atMs: 26000 },
];

export default function GenerationProgress() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setStageIndex(0);
    const timers = STAGES.map((stage, i) =>
      setTimeout(() => setStageIndex(i), stage.atMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-300">
        {STAGES[stageIndex].label}
      </p>
      <div className="flex gap-1.5">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= stageIndex ? "w-6 bg-sky-500" : "w-1.5 bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">This usually takes 15-30 seconds</p>
    </div>
  );
}