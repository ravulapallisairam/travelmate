import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section
      className="relative min-h-[500px] sm:min-h-[90vh] flex items-center justify-center text-white overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.55)), url(https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1600)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute top-20 left-10 hidden lg:block animate-float">
        <div className="glass rounded-2xl p-3 w-40 shadow-xl">
          <img src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=300" className="rounded-xl h-20 w-full object-cover" />
          <p className="text-xs mt-2 font-semibold">Maldives · $2400</p>
        </div>
      </div>
      <div className="absolute bottom-24 right-10 hidden lg:block animate-float" style={{ animationDelay: "1s" }}>
        <div className="glass rounded-2xl p-3 w-40 shadow-xl">
          <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300" className="rounded-xl h-20 w-full object-cover" />
          <p className="text-xs mt-2 font-semibold">Paris · $2100</p>
        </div>
      </div>

      <div className="max-w-3xl text-center px-6 space-y-6 animate-fadeUp">
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
          Plan Your Dream Journey <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">With AI</span>
        </h1>
        <p className="text-lg text-gray-200">
          Discover destinations, create smart itineraries, and explore the world effortlessly.
        </p>
        <SearchBar variant="light" />
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/explore" className="btn-primary">Explore Destinations</Link>
          <Link to="/planner" className="btn-outline">Create My Trip</Link>
        </div>
      </div>
    </section>
  );
}