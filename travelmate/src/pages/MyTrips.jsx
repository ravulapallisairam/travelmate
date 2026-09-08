import { useState } from "react";
import { useApp } from "../context/AppContext";
import TripCard from "../components/TripCard";

const categoryLabels = {
  accommodation: { icon: "🏨", label: "Accommodation" },
  transportation: { icon: "🚗", label: "Transportation" },
  food: { icon: "🍽️", label: "Food" },
  activities: { icon: "🎯", label: "Activities" },
  shopping: { icon: "🛍️", label: "Shopping" },
  emergency: { icon: "🛟", label: "Emergency Fund" },
};

const activityCategoryColors = {
  sightseeing: "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300",
  food: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
  adventure: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
  relaxation: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  shopping: "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300",
  culture: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
};

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function MyTrips() {
  const { trips, deleteTrip } = useApp();
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (id) => {
    deleteTrip(id);
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">My Trips</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-10">All your planned journeys in one place</p>

      {trips.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No trips planned yet. Head to the Trip Planner to create one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((t) => (
            <TripCard key={t._id} trip={t} onDelete={() => setConfirmDelete(t)} onView={setSelected} />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-bold text-lg mb-2">Delete this trip?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              "{confirmDelete.name}" will be permanently removed. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-full bg-gray-100 dark:bg-gray-700 font-semibold text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete._id)} className="flex-1 py-2 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip details modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>📍 {selected.destination}</span>
                  {selected.startDate && selected.endDate && (
                    <span>📅 {formatDate(selected.startDate)} – {formatDate(selected.endDate)}</span>
                  )}
                  <span>🗓️ {selected.days} days</span>
                  {selected.travelers && <span>👥 {selected.travelers} traveler{selected.travelers > 1 ? "s" : ""}</span>}
                  <span>💰 ${selected.budget?.toLocaleString()}</span>
                </div>
              </div>

              {selected.budgetBreakdown && (
                <div>
                  <h3 className="font-bold text-sm mb-3">Budget Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(selected.budgetBreakdown).map(([key, value]) => (
                      value > 0 && categoryLabels[key] && (
                        <div key={key} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                          <span className="text-lg">{categoryLabels[key].icon}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{categoryLabels[key].label}</p>
                          <p className="font-bold text-sm">${value.toLocaleString()}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {selected.itinerary?.days?.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-3">Day-wise Itinerary</h3>
                  <div className="space-y-2">
                    {selected.itinerary.days.map((d) => {
                      const hasActivities = Array.isArray(d.activities) && d.activities.length > 0;
                      const hasLegacyFields = d.morning || d.afternoon || d.evening;

                      return (
                        <div key={d.day} className="text-sm rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                          <b>Day {d.day}</b>
                          {d.date && <span className="text-xs text-gray-400 ml-2">{formatDate(d.date)}</span>}

                          {hasActivities ? (
                            <div className="mt-2 space-y-2">
                              {d.activities.map((a, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                                    {a.startTime}–{a.endTime}
                                  </span>
                                  <span className="font-semibold">{a.title}</span>
                                  {a.category && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activityCategoryColors[a.category] || activityCategoryColors.sightseeing}`}>
                                      {a.category}
                                    </span>
                                  )}
                                  {a.location && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">📍 {a.location}</span>
                                  )}
                                  {typeof a.estimatedCost === "number" && (
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                                      ${a.estimatedCost}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : hasLegacyFields ? (
                            <span className="ml-2">
                              {d.morning} → {d.afternoon} → {d.evening}
                            </span>
                          ) : (
                            <p className="text-xs text-gray-400 italic mt-1">No activities recorded for this day.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => setSelected(null)} className="btn-primary !py-2 !px-5 text-sm w-full">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}