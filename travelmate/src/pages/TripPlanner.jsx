import { useState, useEffect } from "react";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import FeedbackWidget from "../components/FeedbackWidget";
import TravelIntelligence from "../components/TravelIntelligence";
import GenerationProgress from "../components/GenerationProgress";

const budgetSplits = {
  Adventure: { accommodation: 0.25, transportation: 0.15, food: 0.2, activities: 0.3, shopping: 0.05, emergency: 0.05 },
  Relaxation: { accommodation: 0.4, transportation: 0.1, food: 0.2, activities: 0.15, shopping: 0.1, emergency: 0.05 },
  Luxury: { accommodation: 0.45, transportation: 0.15, food: 0.15, activities: 0.15, shopping: 0.05, emergency: 0.05 },
  Family: { accommodation: 0.3, transportation: 0.15, food: 0.25, activities: 0.2, shopping: 0.05, emergency: 0.05 },
  Solo: { accommodation: 0.3, transportation: 0.15, food: 0.25, activities: 0.15, shopping: 0.1, emergency: 0.05 },
};

const budgetCategories = {
  accommodation: { image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400", label: "Stay" },
  transportation: { image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400", label: "Getting Around" },
  food: { image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400", label: "Food & Dining" },
  activities: { image: "https://images.unsplash.com/photo-1530866495561-507c9faab153?w=400", label: "Things to Do" },
  shopping: { image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400", label: "Shopping & Extras" },
  emergency: { image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400", label: "Emergency Buffer" },
};

const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const daysBetween = (start, end) => {
  const d1 = new Date(start), d2 = new Date(end);
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
};

export default function TripPlanner() {
  const { addTrip } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [form, setForm] = useState({
    destination: "",
    startDate: todayStr(),
    endDate: addDays(todayStr(), 4),
    travelers: 1,
    budget: 1500,
    travelStyle: "Adventure",
  });
  const [itinerary, setItinerary] = useState(null);
  const [companions, setCompanions] = useState([]);
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedChanges, setOptimizedChanges] = useState(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const { data } = await api.get("/destinations");
        setDestinations(data);
        if (data.length > 0) setForm((f) => ({ ...f, destination: data[0].name }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchDestinations();
  }, []);

  const days = daysBetween(form.startDate, form.endDate);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      if (name === "startDate" && new Date(value) >= new Date(f.endDate)) {
        updated.endDate = addDays(value, 3);
      }
      return updated;
    });
  };

  const addCompanion = () => {
    setCompanions((prev) => [
      ...prev,
      { name: "", interests: { nature: 3, food: 3, culture: 3, adventure: 3, luxury: 2, relaxation: 3 } },
    ]);
  };

  const updateCompanionName = (index, name) => {
    setCompanions((prev) => prev.map((c, i) => (i === index ? { ...c, name } : c)));
  };

  const updateCompanionInterest = (index, category, value) => {
    setCompanions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, interests: { ...c.interests, [category]: Number(value) } } : c))
    );
  };

  const removeCompanion = (index) => {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  };

  const generateBudgetBreakdown = (totalBudget, style) => {
    const split = budgetSplits[style];
    const breakdown = {};
    Object.keys(split).forEach((key) => {
      breakdown[key] = Math.round(totalBudget * split[key]);
    });
    return breakdown;
  };

  const generateTrip = async (e) => {
    e.preventDefault();
    setError("");
    setOptimizedChanges(null);
    if (!user) {
      navigate("/login");
      return;
    }

    const dest = destinations.find((d) => d.name === form.destination) || destinations[0];
    setGenerating(true);

    try {
      const validCompanions = companions.filter((c) => c.name.trim());

      const { data } = await api.post("/ai/generate-itinerary", {
        destinationId: dest._id,
        days,
        travelers: Number(form.travelers),
        budget: Number(form.budget),
        travelStyle: form.travelStyle,
        startDate: form.startDate,
        endDate: form.endDate,
        companionProfiles: validCompanions.length > 0 ? validCompanions : undefined,
      });

      setItinerary({
        destination: dest,
        days: data.days,
        estimatedBudget: Number(form.budget),
        hotels: data.hotels,
        highlights: data.highlights,
        packingTips: data.packingTips,
        validation: data.validation,
        travelFeasibility: data.travelFeasibility,
        totalCostEstimate: data.totalCostEstimate,
        budgetBreakdown: generateBudgetBreakdown(Number(form.budget), form.travelStyle),
        groupProfile: data.groupProfile,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Couldn't generate your AI itinerary right now. Please try again in a moment.");
    } finally {
      setGenerating(false);
    }
  };

  const optimizeTrip = async () => {
    if (!itinerary) return;
    setOptimizing(true);
    setOptimizedChanges(null);
    setError("");

    try {
      const feasibilityIssues = itinerary.travelFeasibility?.dayIssues?.flatMap((d) => d.issues) || [];

      const { data } = await api.post("/ai/optimize-itinerary", {
        destinationId: itinerary.destination._id,
        days,
        budget: Number(form.budget),
        travelStyle: form.travelStyle,
        currentItinerary: { days: itinerary.days },
        warnings: itinerary.validation?.warnings || [],
        feasibilityIssues,
      });

      setItinerary((prev) => ({
        ...prev,
        days: data.days,
        validation: data.validation,
        travelFeasibility: data.travelFeasibility,
      }));
      setOptimizedChanges(data.changesSummary);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Couldn't optimize the trip right now.");
    } finally {
      setOptimizing(false);
    }
  };

  const applyWeatherChanges = (newDays) => {
    setItinerary((prev) => ({ ...prev, days: newDays }));
  };

  const moveDayActivity = (dayIndex, direction) => {
    setItinerary((prev) => {
      const newDays = [...prev.days];
      const targetIndex = dayIndex + direction;
      if (targetIndex < 0 || targetIndex >= newDays.length) return prev;
      [newDays[dayIndex], newDays[targetIndex]] = [newDays[targetIndex], newDays[dayIndex]];
      newDays.forEach((d, i) => (d.day = i + 1));
      return { ...prev, days: newDays };
    });
  };

  const saveTrip = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!itinerary) {
      setError("Generate an itinerary before saving.");
      return;
    }

    const hasRealActivities =
      Array.isArray(itinerary.days) &&
      itinerary.days.length > 0 &&
      itinerary.days.some((d) => Array.isArray(d.activities) && d.activities.length > 0);

    if (!hasRealActivities) {
      setError("This itinerary doesn't have any activities yet — try generating again before saving.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await addTrip({
        name: `${form.destination} ${form.travelStyle} Trip`,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        days,
        travelers: Number(form.travelers),
        budget: Number(form.budget),
        travelStyle: form.travelStyle,
        itinerary: {
          days: itinerary.days,
          hotels: itinerary.hotels,
          places: itinerary.highlights || [],
          estimatedBudget: itinerary.estimatedBudget,
        },
        budgetBreakdown: itinerary.budgetBreakdown,
      });
      alert("Trip saved! Check My Trips page.");
    } finally {
      setSaving(false);
    }
  };

  const perPerson = itinerary ? Math.round(itinerary.estimatedBudget / Number(form.travelers)) : 0;
  const perDay = itinerary ? Math.round(itinerary.estimatedBudget / days) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">AI Trip Planner</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Powered by Google Gemini — get a genuinely personalized itinerary.</p>

      <form onSubmit={generateTrip} className="grid grid-cols-1 md:grid-cols-3 gap-4 glass rounded-2xl p-6 shadow mb-10">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Destination</label>
          <select name="destination" value={form.destination} onChange={handleChange} className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700">
            {destinations.map((d) => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Start Date</label>
          <input type="date" name="startDate" value={form.startDate} min={todayStr()} onChange={handleChange} className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">End Date</label>
          <input type="date" name="endDate" value={form.endDate} min={form.startDate} onChange={handleChange} className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Travelers</label>
          <input type="number" min="1" max="20" name="travelers" value={form.travelers} onChange={handleChange} className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Total Budget ($)</label>
          <input type="number" min="100" name="budget" value={form.budget} onChange={handleChange} className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Travel Style</label>
          <select name="travelStyle" value={form.travelStyle} onChange={handleChange} className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700">
            {Object.keys(budgetSplits).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="md:col-span-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowAddCompanion((v) => !v)}
            className="text-sm font-semibold text-sky-600 dark:text-sky-400"
          >
            {showAddCompanion ? "− Hide travelers" : "+ Add travelers (optional, for group trips)"}
          </button>

          {showAddCompanion && (
            <div className="mt-4 space-y-4">
              {companions.map((c, i) => (
                <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Traveler name"
                      value={c.name}
                      onChange={(e) => updateCompanionName(i, e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border dark:border-gray-700"
                    />
                    <button type="button" onClick={() => removeCompanion(i)} className="text-xs text-red-500 font-semibold">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(c.interests).map((cat) => (
                      <div key={cat}>
                        <label className="text-xs capitalize text-gray-500 dark:text-gray-400 flex justify-between">
                          {cat} <span>{c.interests[cat]}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={c.interests[cat]}
                          onChange={(e) => updateCompanionInterest(i, cat, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCompanion} className="text-sm font-semibold px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700">
                + Add another traveler
              </button>
            </div>
          )}
        </div>

        <p className="md:col-span-3 text-sm text-gray-500 dark:text-gray-400">
          Trip length: <span className="font-semibold text-gray-700 dark:text-gray-200">{days} day{days !== 1 ? "s" : ""}</span>
        </p>

        {error && <p className="md:col-span-3 text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={generating} className="btn-primary md:col-span-3 disabled:opacity-60">
          {generating ? "✨ Generating your itinerary with AI..." : "✨ Generate AI Itinerary"}
        </button>
      </form>

      {generating && <GenerationProgress />}

      {itinerary && !generating && (
        <div className="space-y-6 animate-fadeUp">
          <div className="rounded-2xl overflow-hidden shadow bg-white dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row">
              <img src={itinerary.destination.image} className="w-full sm:w-64 h-48 sm:h-auto object-cover" />
              <div className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{itinerary.destination.name} Itinerary</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white">✨ AI Generated</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{days} days · {form.travelers} traveler{form.travelers > 1 ? "s" : ""} · {form.travelStyle}</p>
                <button onClick={saveTrip} disabled={saving} className="btn-primary !py-2 !px-5 text-sm disabled:opacity-60">
                  {saving ? "Saving..." : "Save Trip"}
                </button>
                <div className="mt-3">
                  <FeedbackWidget type="itinerary" targetId={itinerary.destination._id} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 border-t border-gray-100 dark:border-gray-700">
              <div className="p-4 text-center">
                <p className="text-2xl">💰</p>
                <p className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">${itinerary.estimatedBudget.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Budget</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl">👤</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">${perPerson.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per Person</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl">📅</p>
                <p className="text-lg font-bold text-accent mt-1">${perDay.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per Day</p>
              </div>
            </div>
          </div>

          {itinerary.validation && (
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-bold text-lg">Trip Feasibility</h3>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-extrabold ${itinerary.validation.feasibilityScore >= 85 ? "text-emerald-500" :
                    itinerary.validation.feasibilityScore >= 65 ? "text-amber-500" : "text-red-500"
                    }`}>
                    {itinerary.validation.feasibilityScore}%
                  </span>
                  {(itinerary.validation.feasibilityScore < 90 || (itinerary.travelFeasibility && !itinerary.travelFeasibility.overallFeasible)) && (
                    <button
                      onClick={optimizeTrip}
                      disabled={optimizing}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:scale-105 transition disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {optimizing ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        "✨ Optimize My Trip"
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {Object.entries(itinerary.validation.breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-500 dark:text-gray-400">{key}</span>
                      <span className="font-semibold">{value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${value >= 85 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {itinerary.validation.warnings?.length > 0 && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 space-y-1.5">
                  {itinerary.validation.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <span>⚠️</span> {w}
                    </p>
                  ))}
                </div>
              )}

              {optimizedChanges && optimizedChanges.length > 0 && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4 space-y-1.5 mt-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">
                    Trip Optimized
                  </p>
                  {optimizedChanges.map((change, i) => (
                    <p key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                      <span>✓</span> {change}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3">
                Estimated cost from AI plan: ${itinerary.validation.totalEstimatedCost?.toLocaleString()} of ${itinerary.estimatedBudget.toLocaleString()} budget
              </p>
            </div>
          )}

          {itinerary.travelFeasibility && !itinerary.travelFeasibility.overallFeasible && (
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🗺️</span>
                <h3 className="font-bold text-lg">Travel Time Check</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Some activities may not leave enough time to travel between locations.
              </p>
              <div className="space-y-3">
                {itinerary.travelFeasibility.dayIssues.map((dayIssue) => (
                  <div key={dayIssue.day} className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2">Day {dayIssue.day}</p>
                    {dayIssue.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 mb-1.5 last:mb-0">
                        <span>⚠️</span>
                        <span>
                          {issue.reason}
                          <span className="text-xs text-amber-600 dark:text-amber-400 block mt-0.5">
                            Consider adding {issue.shortfallMinutes} more minutes between these activities, or moving one to another day.
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <TravelIntelligence
            destinationId={itinerary.destination._id}
            days={itinerary.days}
            onApplyChanges={applyWeatherChanges}
          />

          {itinerary.groupProfile?.isGroup && (
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
              <h3 className="font-bold text-lg mb-3">👥 Group Trip — {itinerary.groupProfile.travelerCount} Travelers</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Balancing preferences for: {itinerary.groupProfile.travelerNames.join(", ")}
              </p>
              {itinerary.groupProfile.conflicts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Preference tradeoffs considered</p>
                  {itinerary.groupProfile.conflicts.map((c, i) => (
                    <p key={i} className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-2">
                      <span className="capitalize font-medium">{c.category}</span>: {c.high.join("/")} want{c.high.length === 1 ? "s" : ""} more, {c.low.join("/")} prefer{c.low.length === 1 ? "s" : ""} less
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {itinerary.highlights?.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950 dark:to-emerald-950 p-5">
              <h3 className="font-bold text-sm mb-2">✨ Why This Trip Works For You</h3>
              <ul className="space-y-1">
                {itinerary.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {h}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Budget Breakdown</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300">
                Total: ${itinerary.estimatedBudget.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(itinerary.budgetBreakdown).map(([key, value]) => {
                const pct = Math.round((value / itinerary.estimatedBudget) * 100);
                const cat = budgetCategories[key];
                if (!cat) return null;
                return (
                  <div key={key} className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition group">
                    <div className="relative h-20 overflow-hidden">
                      <img src={cat.image} alt={cat.label} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30" />
                      <span className="absolute top-2 right-2 text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded-full">{pct}%</span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cat.label}</p>
                      <p className="text-lg font-bold mt-0.5">${value.toLocaleString()}</p>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {itinerary.totalCostEstimate && (
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">Real Total Trip Cost</h3>
                <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                  ${itinerary.totalCostEstimate.grandTotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-5">{itinerary.totalCostEstimate.disclaimer}</p>

              <div className="space-y-3">
                {Object.entries(itinerary.totalCostEstimate.breakdown).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.note}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {item.amount != null ? (
                        <span className="text-sm font-bold">${item.amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Check separately</span>
                      )}
                      <p
                        className={`text-[10px] uppercase font-semibold ${item.confidence === "estimated"
                          ? "text-sky-500"
                          : item.confidence === "rough"
                            ? "text-amber-500"
                            : item.confidence === "buffer"
                              ? "text-emerald-500"
                              : "text-gray-400"
                          }`}
                      >
                        {item.confidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {itinerary.days.map((d, i) => {
              const dayCost = (d.activities || []).reduce((sum, a) => sum + (Number(a.estimatedCost) || 0), 0);
              const categoryColors = {
                sightseeing: "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300",
                food: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
                adventure: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
                relaxation: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
                shopping: "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300",
                culture: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
              };
              return (
                <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sky-600 dark:text-sky-400">Day {d.day}</h3>
                      {d.date && <p className="text-xs text-gray-400">{d.date}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">${dayCost}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveDayActivity(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm">↑</button>
                        <button onClick={() => moveDayActivity(i, 1)} disabled={i === itinerary.days.length - 1} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm">↓</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(d.activities || []).length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No activities planned for this day.</p>
                    ) : (
                      d.activities.map((a, ai) => (
                        <div key={ai} className="flex gap-4 items-start border-l-2 border-sky-200 dark:border-sky-800 pl-4 py-1">
                          <div className="text-xs font-mono text-gray-400 whitespace-nowrap pt-0.5 w-24">
                            {a.startTime}–{a.endTime}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{a.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[a.category] || categoryColors.sightseeing}`}>
                                {a.category}
                              </span>
                            </div>
                            {a.location && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📍 {a.location}</p>}
                            {a.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.description}</p>}
                          </div>
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${a.estimatedCost}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
              <h3 className="font-bold mb-3">🏨 Recommended Hotels</h3>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                {itinerary.hotels.map((h) => <li key={h}>• {h}</li>)}
              </ul>
            </div>
            {itinerary.packingTips?.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
                <h3 className="font-bold mb-3">🎒 Packing Tips</h3>
                <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                  {itinerary.packingTips.map((p, i) => <li key={i}>• {p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}