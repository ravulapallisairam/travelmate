import { useState, useEffect } from "react";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

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
    if (!user) {
      navigate("/login");
      return;
    }

    const dest = destinations.find((d) => d.name === form.destination) || destinations[0];
    setGenerating(true);

    try {
      const { data } = await api.post("/ai/generate-itinerary", {
        destinationId: dest._id,
        days,
        travelers: Number(form.travelers),
        budget: Number(form.budget),
        travelStyle: form.travelStyle,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      setItinerary({
        destination: dest,
        days: data.days,
        estimatedBudget: Number(form.budget),
        hotels: data.hotels,
        highlights: data.highlights,
        packingTips: data.packingTips,
        budgetBreakdown: generateBudgetBreakdown(Number(form.budget), form.travelStyle),
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't generate your AI itinerary right now. Please try again in a moment.");
    } finally {
      setGenerating(false);
    }
  };

  const updateActivity = (dayIndex, slot, value) => {
    setItinerary((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex] = { ...newDays[dayIndex], [slot]: value };
      return { ...prev, days: newDays };
    });
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

        <p className="md:col-span-3 text-sm text-gray-500 dark:text-gray-400">
          Trip length: <span className="font-semibold text-gray-700 dark:text-gray-200">{days} day{days !== 1 ? "s" : ""}</span>
        </p>

        {error && <p className="md:col-span-3 text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={generating} className="btn-primary md:col-span-3 disabled:opacity-60">
          {generating ? "✨ Generating your itinerary with AI..." : "✨ Generate AI Itinerary"}
        </button>
      </form>

      {generating && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Our AI is crafting your personalized itinerary...</p>
        </div>
      )}

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

          <div className="grid gap-4">
            {itinerary.days.map((d, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sky-600 dark:text-sky-400">Day {d.day}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => moveDayActivity(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm">↑</button>
                    <button onClick={() => moveDayActivity(i, 1)} disabled={i === itinerary.days.length - 1} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm">↓</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {["morning", "afternoon", "evening"].map((slot) => (
                    <div key={slot}>
                      <label className="text-xs text-gray-400 capitalize block mb-1">
                        {slot === "morning" ? "🌅" : slot === "afternoon" ? "☀️" : "🌆"} {slot}
                      </label>
                      <input
                        value={d[slot]}
                        onChange={(e) => updateActivity(i, slot, e.target.value)}
                        className="w-full rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
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