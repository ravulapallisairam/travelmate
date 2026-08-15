export default function TripCard({ trip, onDelete, onView }) {
  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-md p-5 space-y-3 hover:shadow-xl transition">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{trip.name}</h3>
        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
          {trip.travelStyle}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">📍 {trip.destination}</p>
      {trip.startDate && trip.endDate && (
        <p className="text-sm text-gray-500 dark:text-gray-400">📅 {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p>
      )}
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
        <span>🗓️ {trip.days} Days</span>
        {trip.travelers && <span>👥 {trip.travelers}</span>}
        <span>💰 ${trip.budget?.toLocaleString()}</span>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onView(trip)} className="flex-1 text-sm py-2 rounded-full bg-sky-500 text-white font-semibold hover:bg-sky-600 transition">
          View Details
        </button>
        <button onClick={onDelete} className="text-sm py-2 px-4 rounded-full bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition">
          Delete
        </button>
      </div>
    </div>
  );
}