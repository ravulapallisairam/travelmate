import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, UtensilsCrossed, Landmark, Mountain, Gem, Waves, Check } from "lucide-react";
import api from "../api/axios";

const interestLabels = {
  nature: { Icon: Leaf, label: "Nature & Outdoors", color: "#10B981", light: "#D1FAE5" },
  food: { Icon: UtensilsCrossed, label: "Food & Cuisine", color: "#F97316", light: "#FFEDD5" },
  culture: { Icon: Landmark, label: "History & Culture", color: "#8B5CF6", light: "#EDE9FE" },
  adventure: { Icon: Mountain, label: "Adventure & Thrills", color: "#EF4444", light: "#FEE2E2" },
  luxury: { Icon: Gem, label: "Luxury & Comfort", color: "#EC4899", light: "#FCE7F3" },
  relaxation: { Icon: Waves, label: "Relaxation & Wellness", color: "#0EA5E9", light: "#E0F2FE" },
};

const DURATION_COLOR = "#0EA5E9";

// Reusable premium slider — real track + animated fill + polished thumb.
// Native <input type="range"> with appearance-none only strips styling;
// without this CSS you're left with a bare floating thumb and no track.
function Slider({ value, min, max, color, onChange, ariaLabel }) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className="premium-slider"
      style={{
        "--slider-color": color,
        "--slider-percent": `${percent}%`,
      }}
    />
  );
}

export default function Preferences() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    budgetStyle: "moderate",
    preferredDuration: 5,
    activityLevel: "moderate",
    interests: { nature: 3, food: 3, culture: 3, adventure: 3, luxury: 2, relaxation: 3 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const { data } = await api.get("/preferences");
        if (data) {
          setForm({
            budgetStyle: data.budgetStyle || "moderate",
            preferredDuration: data.preferredDuration || 5,
            activityLevel: data.activityLevel || "moderate",
            interests: data.interests || form.interests,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleInterestChange = (key, value) => {
    setForm((f) => ({ ...f, interests: { ...f.interests, [key]: Number(value) } }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/preferences", form);
      setSaved(true);
      setTimeout(() => navigate("/travel-dna"), 900);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Premium slider styles — track, fill, and thumb, both browser engines */}
      <style>{`
        .premium-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            to right,
            var(--slider-color) 0%,
            var(--slider-color) var(--slider-percent),
            #e5e7eb var(--slider-percent),
            #e5e7eb 100%
          );
          transition: box-shadow 0.2s ease;
        }
        .dark .premium-slider {
          background: linear-gradient(
            to right,
            var(--slider-color) 0%,
            var(--slider-color) var(--slider-percent),
            #3f4756 var(--slider-percent),
            #3f4756 100%
          );
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid var(--slider-color);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .premium-slider:hover::-webkit-slider-thumb {
          transform: scale(1.15);
        }
        .premium-slider:active::-webkit-slider-thumb {
          transform: scale(1.3);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28), 0 0 0 6px color-mix(in srgb, var(--slider-color) 20%, transparent);
        }
        .premium-slider::-moz-range-track {
          background: transparent;
          border: none;
          height: 6px;
        }
        .premium-slider::-moz-range-progress {
          background: var(--slider-color);
          height: 6px;
          border-radius: 9999px;
        }
        .premium-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid var(--slider-color);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .premium-slider:hover::-moz-range-thumb {
          transform: scale(1.15);
        }
        .premium-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--slider-color) 30%, transparent);
        }
      `}</style>

      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
          <Leaf size={26} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold">Tell Us How You Travel</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          This helps us personalize recommendations and build your Travel DNA.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Interests */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
          <h3 className="font-bold mb-5">How much do you enjoy each of these?</h3>
          <div className="space-y-6">
            {Object.entries(interestLabels).map(([key, { Icon, label, color, light }]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: light }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: light, color }}
                  >
                    {form.interests[key]}/5
                  </span>
                </div>
                <Slider
                  value={form.interests[key]}
                  min={0}
                  max={5}
                  color={color}
                  ariaLabel={label}
                  onChange={(e) => handleInterestChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Budget style */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
          <h3 className="font-bold mb-4">What's your typical travel budget style?</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "budget", label: "Budget", desc: "Value-focused" },
              { key: "moderate", label: "Moderate", desc: "Balanced" },
              { key: "luxury", label: "Luxury", desc: "Premium" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, budgetStyle: opt.key })}
                className={`relative py-4 px-2 rounded-xl text-center transition-all ${
                  form.budgetStyle === opt.key
                    ? "bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650"
                }`}
              >
                {form.budgetStyle === opt.key && (
                  <Check size={14} className="absolute top-2 right-2" />
                )}
                <p className="text-sm font-bold">{opt.label}</p>
                <p className={`text-xs mt-0.5 ${form.budgetStyle === opt.key ? "text-white/80" : "text-gray-400"}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Activity level */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
          <h3 className="font-bold mb-4">How active do you like your trips?</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "low", label: "Low-key", desc: "Take it slow" },
              { key: "moderate", label: "Balanced", desc: "Mix of both" },
              { key: "high", label: "Packed", desc: "Go go go" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, activityLevel: opt.key })}
                className={`relative py-4 px-2 rounded-xl text-center transition-all ${
                  form.activityLevel === opt.key
                    ? "bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650"
                }`}
              >
                {form.activityLevel === opt.key && (
                  <Check size={14} className="absolute top-2 right-2" />
                )}
                <p className="text-sm font-bold">{opt.label}</p>
                <p className={`text-xs mt-0.5 ${form.activityLevel === opt.key ? "text-white/80" : "text-gray-400"}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred trip duration */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Typical trip length</h3>
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              {form.preferredDuration} {form.preferredDuration === 1 ? "day" : "days"}
            </span>
          </div>
          <Slider
            value={form.preferredDuration}
            min={1}
            max={14}
            color={DURATION_COLOR}
            ariaLabel="Typical trip length"
            onChange={(e) => setForm({ ...form, preferredDuration: Number(e.target.value) })}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>Weekend trip</span>
            <span>Two-week journey</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <>
              <Check size={18} /> Saved!
            </>
          ) : (
            "Save Preferences"
          )}
        </button>
      </form>
    </div>
  );
}