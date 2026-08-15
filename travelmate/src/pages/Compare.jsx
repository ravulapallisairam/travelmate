import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import Rating from "../components/Rating";

const rows = [
  { key: "price", label: "Starting Price", format: (v) => `$${v}` },
  { key: "estimatedDailyBudget", label: "Daily Budget", format: (v) => v ? `₹${v.toLocaleString()}/day` : "—" },
  { key: "duration", label: "Typical Duration" },
  { key: "rating", label: "Rating", format: (v) => v.toFixed(1) },
  { key: "reviewCount", label: "Reviews", format: (v) => v ? v.toLocaleString() : "—" },
  { key: "bestTimeToVisit", label: "Best Time to Visit" },
  { key: "category", label: "Travel Style" },
];

const listRows = [
  { key: "topAttractions", label: "Top Attractions", icon: "🏛️" },
  { key: "activities", label: "Things to Do", icon: "🎯" },
  { key: "foodRecommendations", label: "Food to Try", icon: "🍽️" },
];

export default function Compare() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length < 2) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
        <p className="text-4xl">⚖️</p>
        <h1 className="text-2xl font-extrabold">Nothing to Compare Yet</h1>
        <p className="text-gray-500 dark:text-gray-400">Select at least 2 destinations from the Explore page to compare them side by side.</p>
        <button onClick={() => navigate("/explore")} className="btn-primary">Explore Destinations</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Compare Destinations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Side-by-side comparison to help you decide</p>
        </div>
        <button onClick={clearCompare} className="text-sm text-red-500 font-semibold hover:text-red-600">Clear All</button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row with images */}
          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `160px repeat(${compareList.length}, 1fr)` }}>
            <div />
            {compareList.map((d) => (
              <div key={d._id} className="relative rounded-2xl overflow-hidden shadow bg-white dark:bg-gray-800">
                <button
                  onClick={() => removeFromCompare(d._id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-sm hover:scale-110 transition"
                >
                  ✕
                </button>
                <img src={d.image} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <h3 className="font-bold text-sm">{d.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d.country}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data rows */}
          <div className="rounded-2xl overflow-hidden shadow bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid gap-4 px-4 py-3 items-center"
                style={{ gridTemplateColumns: `160px repeat(${compareList.length}, 1fr)` }}
              >
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{row.label}</span>
                {compareList.map((d) => (
                  <div key={d._id} className="text-sm font-medium">
                    {row.key === "rating" ? (
                      <Rating value={d[row.key]} />
                    ) : row.format ? (
                      row.format(d[row.key])
                    ) : (
                      d[row.key] || "—"
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* List-based rows (attractions, activities, food) */}
          <div className="space-y-4 mt-6">
            {listRows.map((row) => (
              <div key={row.key} className="rounded-2xl overflow-hidden shadow bg-white dark:bg-gray-800">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-bold">{row.icon} {row.label}</span>
                </div>
                <div
                  className="grid gap-4 px-4 py-4"
                  style={{ gridTemplateColumns: `160px repeat(${compareList.length}, 1fr)` }}
                >
                  <div />
                  {compareList.map((d) => (
                    <div key={d._id} className="flex flex-wrap gap-1.5">
                      {(d[row.key] || []).length > 0 ? (
                        d[row.key].slice(0, 4).map((item) => (
                          <span key={item} className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <button onClick={() => navigate("/planner")} className="btn-primary">Plan a Trip Now</button>
      </div>
    </div>
  );
}