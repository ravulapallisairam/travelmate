import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import api from "../api/axios";

const improvementOptions = [
  { key: "budget", label: "Budget" },
  { key: "activities", label: "Activities" },
  { key: "destination", label: "Destination" },
  { key: "schedule", label: "Schedule" },
  { key: "travelStyle", label: "Travel Style" },
];

export default function FeedbackWidget({ type, targetId, compact = false }) {
  const [rating, setRating] = useState(null); // "useful" | "not_useful" | null
  const [showImprove, setShowImprove] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const sendFeedback = async (value, areas = []) => {
    // Optimistic: update UI instantly, don't wait for the network
    setRating(value);
    setSubmitted(true);

    try {
      await api.post("/feedback", {
        type,
        targetId,
        rating: value,
        improvementAreas: areas,
      });
    } catch (err) {
      console.error("Feedback failed to save:", err);
      // Silent fail is fine here — feedback is non-critical, don't disrupt the user
    }
  };

  const handleClick = (value) => {
    if (rating === value) return; // already selected, no-op
    if (value === "not_useful") {
      setRating(value);
      setShowImprove(true);
      setSubmitted(false); // wait for improvement areas before finalizing
    } else {
      sendFeedback(value);
    }
  };

  const toggleArea = (key) => {
    setSelectedAreas((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  };

  const submitImprovement = () => {
    sendFeedback("not_useful", selectedAreas);
    setShowImprove(false);
  };

  if (submitted && !showImprove) {
    return (
      <div className={`flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 ${compact ? "text-xs" : "text-sm"} animate-fadeUp`}>
        <Check size={compact ? 12 : 14} />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className={`text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>Helpful?</span>
        <button
          onClick={() => handleClick("useful")}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            rating === "useful"
              ? "bg-emerald-500 text-white scale-110"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900"
          }`}
          aria-label="Useful"
        >
          <ThumbsUp size={13} />
        </button>
        <button
          onClick={() => handleClick("not_useful")}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            rating === "not_useful"
              ? "bg-red-500 text-white scale-110"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900"
          }`}
          aria-label="Not useful"
        >
          <ThumbsDown size={13} />
        </button>
      </div>

      {showImprove && (
        <div className="absolute top-full left-0 mt-2 z-20 w-64 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 p-3 animate-fadeUp">
          <p className="text-xs font-semibold mb-2">What should we improve?</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {improvementOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleArea(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-full transition ${
                  selectedAreas.includes(opt.key)
                    ? "bg-sky-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={submitImprovement}
            className="w-full text-xs font-semibold py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}