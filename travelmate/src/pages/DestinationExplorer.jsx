import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import DestinationCard from "../components/DestinationCard";
import CategoryCard from "../components/CategoryCard";
import Loader from "../components/Loader";
import api from "../api/axios";
import { categories } from "../data/categories";

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "ratingHigh", label: "Highest Rated" },
  { value: "priceLow", label: "Lowest Price" },
  { value: "priceHigh", label: "Highest Price" },
];

export default function DestinationExplorer() {
  const [params, setParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.get("q") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/destinations", {
          params: {
            category: activeCategory,
            search: query,
            maxPrice,
            minRating,
            sort,
          },
        });
        setDestinations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchDestinations, 300);
    return () => clearTimeout(debounce);
  }, [activeCategory, query, maxPrice, minRating, sort]);

  // Search suggestions (client-side, from currently loaded set + a lightweight fetch)
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get("/destinations", { params: { search: query } });
        setSuggestions(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(debounce);
  }, [query]);

  const clearFilters = () => {
    setActiveCategory("All");
    setSort("popular");
    setMaxPrice(10000);
    setMinRating(0);
    setQuery("");
    setParams({});
  };

  const hasActiveFilters = activeCategory !== "All" || maxPrice < 10000 || minRating > 0 || query;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-3xl font-extrabold">Explore Destinations</h1>

        <div className="max-w-xl mx-auto relative">
          <div className="flex items-center gap-2 rounded-full p-2 shadow-lg bg-white dark:bg-gray-800">
            <span className="pl-3 text-gray-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search destinations, states, countries..."
              className="flex-1 bg-transparent outline-none px-2 py-2 text-gray-700 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-20 text-left">
              {suggestions.map((s) => (
                <button
                  key={s._id}
                  onClick={() => { setQuery(s.name); setShowSuggestions(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  <img src={s.image} className="w-8 h-8 rounded-full object-cover" />
                  <span>{s.name}{s.state ? `, ${s.state}` : ""}, {s.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
        <CategoryCard
          category={{ name: "All", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop" }}
          active={activeCategory === "All"}
          onClick={() => setActiveCategory("All")}
        />
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} active={activeCategory === c.name} onClick={() => setActiveCategory(c.name)} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8 glass rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold whitespace-nowrap">Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border dark:border-gray-700"
          >
            {sortOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <label className="text-sm font-semibold whitespace-nowrap">Max Price: ${maxPrice}</label>
          <input
            type="range" min="200" max="10000" step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="flex-1 accent-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold whitespace-nowrap">Min Rating</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border dark:border-gray-700"
          >
            <option value={0}>Any</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
            <option value={4.8}>4.8+</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm font-semibold text-red-500 hover:text-red-600 ml-auto">
            Clear Filters ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Searching..." : `${destinations.length} destination${destinations.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {loading ? (
        <Loader />
      ) : destinations.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">🗺️</p>
          <p className="text-gray-500">No destinations match your filters.</p>
          <button onClick={clearFilters} className="btn-primary !py-2 !px-5 text-sm">Clear Filters</button>
        </div>
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
