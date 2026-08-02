import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const links = [
  { name: "Home", path: "/" },
  { name: "Explore", path: "/explore" },
  { name: "Trip Planner", path: "/planner" },
  { name: "Packages", path: "/packages" },
  { name: "Favorites", path: "/favorites" },
  { name: "My Trips", path: "/my-trips" },
];

export default function Navbar() {
  const { darkMode, setDarkMode, favorites } = useApp();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-extrabold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
          TravelMate AI
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.path}
              to={l.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors relative ${
                  isActive ? "text-sky-500" : "text-gray-600 dark:text-gray-300 hover:text-sky-500"
                }`
              }
            >
              {l.name}
              {l.name === "Favorites" && favorites.length > 0 && (
                <span className="ml-1 text-xs bg-accent text-white rounded-full px-1.5">{favorites.length}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-semibold">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleLogout} className="text-sm px-4 py-2 rounded-full bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block btn-primary !py-2 !px-5 text-sm">
              Login
            </Link>
          )}

          <button className="md:hidden w-9 h-9 flex items-center justify-center" onClick={() => setOpen(!open)}>
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden flex flex-col gap-3 px-4 pb-4">
          {links.map((l) => (
            <NavLink key={l.path} to={l.path} onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {l.name}
            </NavLink>
          ))}
          {user ? (
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 text-left">Logout</button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-sky-500">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}