import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ variant = "light" }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`flex items-center gap-2 rounded-full p-2 shadow-lg ${
        variant === "light" ? "bg-white/90" : "glass"
      }`}
    >
      <span className="pl-3 text-gray-400">🔍</span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search destinations, countries..."
        className="flex-1 bg-transparent outline-none px-2 py-2 text-gray-700 dark:text-gray-100 placeholder:text-gray-400"
      />
      <button type="submit" className="btn-primary !px-5 !py-2 text-sm">Search</button>
    </form>
  );
}