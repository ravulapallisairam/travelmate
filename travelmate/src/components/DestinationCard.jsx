import { Link } from "react-router-dom";
import Rating from "./Rating";
import { useApp } from "../context/AppContext";
import { useCompare } from "../context/CompareContext";

export default function DestinationCard({ destination }) {
  const { toggleFavorite, isFavorite } = useApp();
  const { toggleCompare, isComparing } = useCompare();
  const fav = isFavorite(destination._id);
  const comparing = isComparing(destination._id);

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fadeUp">
      <div className="relative h-52 overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button
          onClick={() => toggleFavorite(destination)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-lg hover:scale-110 transition"
        >
          {fav ? "❤️" : "🤍"}
        </button>
        <span className="absolute bottom-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-accent text-white">
          {destination.category}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{destination.name}</h3>
          <Rating value={destination.rating} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{destination.country} · {destination.duration}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{destination.description}</p>

        <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={comparing}
            onChange={() => toggleCompare(destination)}
            className="w-4 h-4 accent-sky-500 rounded"
          />
          <span className="text-gray-500 dark:text-gray-400">Compare</span>
        </label>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sky-600 dark:text-sky-400 font-bold">${destination.price}</span>
          <Link
            to={`/destination/${destination._id}`}
            className="text-sm font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:scale-105 transition"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}