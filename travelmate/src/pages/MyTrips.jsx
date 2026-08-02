import { useState } from "react";
import { useApp } from "../context/AppContext";
import TripCard from "../components/TripCard";

export default function MyTrips() {
  const { trips, deleteTrip, updateTrip } = useApp();
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">My Trips</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-10">All your planned journeys in one place</p>

      {trips.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No trips planned yet. Head to the Trip Planner to create one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((t) => (
            <TripCard key={t._id} trip={t} onDelete={deleteTrip} onView={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-3">{selected.name}</h2>
            <p className="text-sm text-gray-500 mb-4">📍 {selected.destination} · 📅 {selected.days} Days · 💰 ${selected.budget}</p>
            {selected.itinerary?.days?.map((d) => (
              <div key={d.day} className="mb-3 text-sm">
                <b>Day {d.day}:</b> {d.morning} → {d.afternoon} → {d.evening}
              </div>
            ))}
            <button onClick={() => setSelected(null)} className="btn-primary !py-2 !px-5 text-sm mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}