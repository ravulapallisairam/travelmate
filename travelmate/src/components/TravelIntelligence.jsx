import { useState, useEffect } from "react";
import { CloudRain, AlertTriangle, Sparkles, ArrowRight, X, Check } from "lucide-react";
import api from "../api/axios";

const impactColors = {
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function TravelIntelligence({ destinationId, days, onApplyChanges }) {
  const [checking, setChecking] = useState(true);
  const [weatherResult, setWeatherResult] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    const checkWeather = async () => {
      setChecking(true);
      try {
        const { data } = await api.post("/weather/check-itinerary", { destinationId, days });
        setWeatherResult(data);
      } catch (err) {
        console.error(err);
        setWeatherResult({ available: false, message: "Live weather information is temporarily unavailable.", dayAlerts: [] });
      } finally {
        setChecking(false);
      }
    };
    if (destinationId && days?.length) checkWeather();
  }, [destinationId, days]);

  const fetchSuggestions = async () => {
    setLoadingSuggestion(true);
    try {
      const { data } = await api.post("/weather/suggest-changes", {
        destinationId,
        days,
        dayAlerts: weatherResult.dayAlerts,
      });
      setSuggestion(data);
      setReviewOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleApply = () => {
    onApplyChanges(suggestion.suggestedDays);
    setReviewOpen(false);
    setSuggestion(null);
    setWeatherResult((prev) => ({ ...prev, dayAlerts: [] })); // clear alerts, new plan is presumed safe
  };

  const handleKeep = () => {
    setReviewOpen(false);
    setSuggestion(null);
  };

  if (checking) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Checking live weather conditions...</p>
      </div>
    );
  }

  if (!weatherResult?.available) {
    return (
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-3">
        <CloudRain size={20} className="text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {weatherResult?.message || "Live weather information is temporarily unavailable."}
        </p>
      </div>
    );
  }

  if (weatherResult.dayAlerts.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-5 flex items-center gap-3">
        <CloudRain size={20} className="text-emerald-500 flex-shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Weather looks good — no disruptions expected for your outdoor activities.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <div className="flex items-center gap-2 mb-4">
          <CloudRain size={20} className="text-amber-600 dark:text-amber-400" />
          <h3 className="font-bold text-lg">Travel Intelligence</h3>
        </div>

        <div className="space-y-3">
          {weatherResult.dayAlerts.map((alert) => (
            <div key={alert.day} className="rounded-xl bg-white/70 dark:bg-gray-900/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Day {alert.day} · {alert.date}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  🌡️ {alert.weather.temperature}°C · 🌧️ {alert.weather.rainProbability}% rain
                </span>
              </div>
              {alert.affectedActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-2 mt-2">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{act.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{act.reason}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto whitespace-nowrap ${impactColors[act.impactLevel]}`}>
                    {act.impactLevel.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          onClick={fetchSuggestions}
          disabled={loadingSuggestion}
          className="mt-4 w-full btn-primary !py-2.5 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loadingSuggestion ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Finding alternatives...
            </>
          ) : (
            <>
              <Sparkles size={16} /> View Suggested Changes
            </>
          )}
        </button>
      </div>

      {/* Review modal */}
      {reviewOpen && suggestion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleKeep}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Suggested Changes</h3>
                <button onClick={handleKeep} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {suggestion.changesCount} activit{suggestion.changesCount === 1 ? "y" : "ies"} affected by weather — here's what we'd swap in, matched to your Travel DNA:
              </p>

              {suggestion.suggestedDays.map((day, di) => {
                const originalDay = suggestion.originalDays[di];
                const hasChanges = JSON.stringify(day.activities) !== JSON.stringify(originalDay.activities);
                if (!hasChanges) return null;

                return (
                  <div key={di} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <p className="font-bold text-sm mb-3">Day {day.day}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Current</p>
                        <div className="space-y-1.5">
                          {originalDay.activities.map((a, i) => (
                            <p key={i} className={`text-sm ${a.title !== day.activities[i]?.title ? "line-through text-gray-400" : ""}`}>
                              {a.startTime} — {a.title}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-500 uppercase mb-2 flex items-center gap-1">
                          <ArrowRight size={12} /> Suggested
                        </p>
                        <div className="space-y-1.5">
                          {day.activities.map((a, i) => (
                            <p key={i} className={`text-sm ${a.isReplacement ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                              {a.startTime} — {a.title}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-3 pt-2">
                <button onClick={handleKeep} className="flex-1 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 font-semibold text-sm">
                  Keep Current Plan
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}