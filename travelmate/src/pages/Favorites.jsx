import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import DestinationCard from "../components/DestinationCard";

export default function Favorites() {
  const { favorites } = useApp();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">Your Favorites</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Destinations you've saved for later</p>

      {favorites.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-gray-500">You haven't saved any destinations yet.</p>
          <button onClick={() => navigate("/explore")} className="btn-primary">Explore Destinations</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((d) => (
            <div key={d._id} className="space-y-2">
              <DestinationCard destination={d} />
              <button
                onClick={() => navigate("/planner")}
                className="w-full text-sm py-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-200 transition"
              >
                Move to Trip Planner
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}