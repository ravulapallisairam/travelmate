import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import ImageGallery from "../components/ImageGallery";
import Rating from "../components/Rating";
import { useApp } from "../context/AppContext";

export default function DestinationDetails() {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useApp();

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const { data } = await api.get(`/destinations/${id}`);
        setDestination(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestination();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (!destination) {
    return <div className="text-center py-20">Destination not found. <Link to="/explore" className="text-sky-500">Go back</Link></div>;
  }

  const gallery = [destination.image, destination.image, destination.image, destination.image, destination.image];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <ImageGallery images={gallery} />

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{destination.name}, {destination.country}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Rating value={destination.rating} />
            <span className="text-gray-500 dark:text-gray-400">· {destination.duration}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">${destination.price}</span>
          <button onClick={() => toggleFavorite(destination)} className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
            {isFavorite(destination._id) ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">About This Destination</h2>
        <p className="text-gray-600 dark:text-gray-300">{destination.description} Known for its unique charm, {destination.name} offers travelers an unforgettable blend of culture, scenery, and adventure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-2">🗓️ Best Time to Visit</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">October to March offers the most pleasant weather for visiting {destination.name}.</p>
        </div>
        <div>
          <h3 className="font-bold mb-2">💡 Travel Tips</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Book accommodations early, carry local currency, and respect local customs and traditions.</p>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3">🏛️ Top Attractions</h3>
        <div className="flex flex-wrap gap-2">
          {["City Center", "Historic District", "Local Market", "Scenic Viewpoint"].map((a) => (
            <span key={a} className="text-sm bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full">{a}</span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3">🍽️ Food Recommendations</h3>
        <div className="flex flex-wrap gap-2">
          {["Local Street Food", "Fine Dining", "Seafood Specials", "Traditional Cuisine"].map((f) => (
            <span key={f} className="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">{f}</span>
          ))}
        </div>
      </div>

      <Link to="/planner" className="btn-primary inline-block">Plan a Trip Here</Link>
    </div>
  );
}