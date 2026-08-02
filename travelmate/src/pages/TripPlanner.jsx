import { useState, useEffect } from "react";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const activityPool = {
  Adventure: ["Zipline Adventure", "Jungle Trekking", "Water Sports", "Cliff Jumping"],
  Relaxation: ["Spa & Massage", "Beach Lounging", "Yoga Session", "Sunset Cruise"],
  Luxury: ["Private Yacht Tour", "Fine Dining Experience", "VIP City Tour", "Rooftop Lounge"],
  Family: ["Theme Park Visit", "Wildlife Safari", "Cultural Museum", "Local Market Walk"],
  Solo: ["City Exploration Walk", "Photography Tour", "Cafe Hopping", "Local Cooking Class"],
};

export default function TripPlanner() {
  const { addTrip } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [form, setForm] = useState({ destination: "", days: 5, budget: 1500, travelStyle: "Adventure" });
  const [itinerary, setItinerary] = useState(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const { data } = await api.get("/destinations");
        setDestinations(data);
        if (data.length > 0) setForm((f) => ({ ...f, destination: data[0].name }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchDestinations();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const generateTrip = (e) => {
    e.preventDefault();
    const dest = destinations.find((d) => d.name === form.destination) || destinations[0];
    const pool = activityPool[form.travelStyle];
    const days = Array.from({ length: Number(form.days) }, (_, i) => ({
      day: i + 1,
      morning: pool[i % pool.length],
      afternoon: "Local Food Experience",
      evening: i % 2 === 0 ? "Sunset Point Visit" : "Night Market Stroll",
    }));

    setItinerary({
      destination: dest,
      days,
      estimatedBudget: Number(form.budget),
      hotels: [`${dest.name} Grand Resort`, `${dest.name} Boutique Stay`],
      places: [dest.description, `Top attractions around ${dest.name}`],
    });
  };

  const saveTrip = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    await addTrip({
      name: `${form.destination} ${form.travelStyle} Trip`,
      destination: form.destination,
      days: Number(form.days),
      budget: Number(form.budget),
      travelStyle: form.travelStyle,
      itinerary: {
        days: itinerary.days,
        hotels: itinerary.hotels,
        places: itinerary.places,
        estimatedBudget: itinerary.estimatedBudget,
      },
    });
    alert("Trip saved! Check My Trips page.");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">AI Trip Planner</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Tell us your preferences, get an instant itinerary.</p>

      <form onSubmit={generateTrip} className="grid grid-cols-1 md:grid-cols-4 gap-4 glass rounded-2xl p-6 shadow mb-10">
        <select name="destination" value={form.destination} onChange={handleChange} className="rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700">
          {destinations.map((d) => (
            <option key={d._id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <input type="number" min="1" max="30" name="days" value={form.days} onChange={handleChange} placeholder="Days" className="rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700" />
        <input type="number" min="100" name="budget" value={form.budget} onChange={handleChange} placeholder="Budget ($)" className="rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700" />
        <select name="travelStyle" value={form.travelStyle} onChange={handleChange} className="rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700">
          {Object.keys(activityPool).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="btn-primary md:col-span-4">Generate Trip</button>
      </form>

      {itinerary && (
        <div className="space-y-6 animate-fadeUp">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-2xl overflow-hidden shadow bg-white dark:bg-gray-800">
            <img src={itinerary.destination.image} className="w-full sm:w-64 h-40 object-cover" />
            <div className="p-4 flex-1">
              <h2 className="text-xl font-bold">{itinerary.destination.name} Itinerary</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Budget: ${itinerary.estimatedBudget}</p>
              <button onClick={saveTrip} className="btn-primary !py-2 !px-5 text-sm mt-3">Save Trip</button>
            </div>
          </div>

          <div className="grid gap-4">
            {itinerary.days.map((d) => (
              <div key={d.day} className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
                <h3 className="font-bold text-sky-600 dark:text-sky-400 mb-3">Day {d.day}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <p><b>🌅 Morning:</b> {d.morning}</p>
                  <p><b>☀️ Afternoon:</b> {d.afternoon}</p>
                  <p><b>🌆 Evening:</b> {d.evening}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
              <h3 className="font-bold mb-3">🏨 Recommended Hotels</h3>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                {itinerary.hotels.map((h) => <li key={h}>• {h}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-5">
              <h3 className="font-bold mb-3">📍 Places to Visit</h3>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                {itinerary.places.map((p, i) => <li key={i}>• {p}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}