import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DestinationCard from "../components/DestinationCard";
import CategoryCard from "../components/CategoryCard";
import SearchBar from "../components/SearchBar";
import Loader from "../components/Loader";
import api from "../api/axios";
import { categories } from "../data/categories";

export default function DestinationExplorer() {
  const [params] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = params.get("q") || "";

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/destinations", {
          params: { category: activeCategory, search: query },
        });
        setDestinations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, [activeCategory, query]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-3xl font-extrabold">Explore Destinations</h1>
        <div className="max-w-xl mx-auto"><SearchBar /></div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
        <CategoryCard category={{ name: "All", icon: "🌍" }} active={activeCategory === "All"} onClick={() => setActiveCategory("All")} />
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} active={activeCategory === c.name} onClick={() => setActiveCategory(c.name)} />
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : destinations.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No destinations found. Try a different search or category.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((d) => (
            <DestinationCard key={d._id} destination={d} />
          ))}
        </div>
      )}
    </div>
  );
}