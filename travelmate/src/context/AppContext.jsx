import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [trips, setTrips] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchTrips();
    } else {
      setFavorites([]);
      setTrips([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get("/favorites");
      setFavorites(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrips = async () => {
    try {
      const { data } = await api.get("/trips");
      setTrips(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (destination) => {
    if (!user) {
      alert("Please log in to save favorites.");
      return;
    }
    const isFav = favorites.some((f) => f._id === destination._id);
    try {
      if (isFav) {
        await api.delete(`/favorites/${destination._id}`);
        setFavorites((prev) => prev.filter((f) => f._id !== destination._id));
      } else {
        await api.post("/favorites", { destinationId: destination._id });
        setFavorites((prev) => [...prev, destination]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isFavorite = (id) => favorites.some((f) => f._id === id);

  const addTrip = async (trip) => {
    try {
      const { data } = await api.post("/trips", trip);
      setTrips((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTrip = async (id) => {
    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const updateTrip = async (id, updated) => {
    try {
      const { data } = await api.put(`/trips/${id}`, updated);
      setTrips((prev) => prev.map((t) => (t._id === id ? data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        favorites, toggleFavorite, isFavorite,
        trips, addTrip, deleteTrip, updateTrip,
        darkMode, setDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);