import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Leaf, UtensilsCrossed, Landmark, Mountain, Gem, Waves, PiggyBank, Sparkles, TrendingUp } from "lucide-react";
import api from "../api/axios";

const dnaMeta = {
  "Nature Lover": { Icon: Leaf, color: "#10B981", light: "#D1FAE5" },
  "Food Explorer": { Icon: UtensilsCrossed, color: "#F97316", light: "#FFEDD5" },
  "Culture Enthusiast": { Icon: Landmark, color: "#8B5CF6", light: "#EDE9FE" },
  "Adventure Seeker": { Icon: Mountain, color: "#EF4444", light: "#FEE2E2" },
  "Luxury Traveler": { Icon: Gem, color: "#EC4899", light: "#FCE7F3" },
  "Relaxation Focused": { Icon: Waves, color: "#0EA5E9", light: "#E0F2FE" },
  "Budget Conscious": { Icon: PiggyBank, color: "#EAB308", light: "#FEF9C3" },
};

function CircularGauge({ score, color, size = 88 }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100 dark:text-gray-700" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </svg>
  );
}

export default function TravelDNA() {
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        const { data } = await api.get("/preferences/travel-dna");
        setDna(data);
        setTimeout(() => setRevealed(true), 100);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDNA();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Analyzing your travel patterns...</p>
      </div>
    );
  }
  if (!dna) return null;

  const sorted = Object.entries(dna.scores).sort((a, b) => b[1] - a[1]);
  const [topLabel, topScore] = sorted[0];
  const topMeta = dnaMeta[topLabel];
  const TopIcon = topMeta.Icon;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Hero: dominant trait */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 mb-6 text-white"
        style={{ background: `linear-gradient(135deg, ${topMeta.color}, ${topMeta.color}99)` }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-black/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-lg">
            <TopIcon size={38} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Your dominant travel trait</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 drop-shadow-sm">{topLabel}</h1>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <TrendingUp size={16} />
              <span className="text-sm font-semibold">{topScore}% match strength</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nudge banner — only shown if user hasn't set real preferences yet */}
      {!dna.dataSource.hasExplicitData && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 p-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">This is a default profile.</span> Answer a few quick questions for your real Travel DNA.
            </p>
          </div>
          <Link to="/preferences" className="text-sm font-semibold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">
            Personalize now →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Full Profile Breakdown</h2>
        <span className="text-xs font-medium text-gray-400">
          {dna.dataSource.hasBehaviorData
            ? `${dna.dataSource.behaviorSignalCount} trips/favorites analyzed`
            : "Based on your stated preferences"}
        </span>
      </div>

      {/* Ranked score cards with circular gauges */}
      <div className="grid sm:grid-cols-2 gap-4">
        {sorted.map(([label, score], i) => {
          const meta = dnaMeta[label] || { Icon: Sparkles, color: "#6B7280", light: "#F3F4F6" };
          const Icon = meta.Icon;
          return (
            <div
              key={label}
              className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5 flex items-center gap-4 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(12px)",
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
                <CircularGauge score={score} color={meta.color} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5"
                    style={{ backgroundColor: meta.light }}
                  >
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      #1
                    </span>
                  )}
                  <p className="font-bold text-sm truncate">{label}</p>
                </div>
                <p className="text-2xl font-extrabold mt-0.5" style={{ color: meta.color }}>{score}%</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-5 text-sm text-gray-600 dark:text-gray-300 flex items-start gap-3">
        <Sparkles size={18} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <p>
          {dna.dataSource.hasExplicitData
            ? "These scores reflect your explicit preferences, refined by your actual travel activity as you save more trips and favorites."
            : "You haven't set your preferences yet — the profile above uses default estimates. Set your preferences for an accurate Travel DNA."}
        </p>
      </div>

      <div className="text-center mt-8">
        <Link to="/preferences" className="btn-primary inline-block">
          {dna.dataSource.hasExplicitData ? "Update Preferences" : "Set Your Preferences"}
        </Link>
      </div>
    </div>
  );
}