import { useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Star, Calendar, Users, MapPin, CheckCircle2 } from "lucide-react";
import api from "../api/axios";

export default function Booking() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const pkg = location.state?.pkg;

  const [form, setForm] = useState({
    travelers: 1,
    date: "",
    name: "",
    email: "",
    phone: "",
    requests: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!pkg) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">We couldn't find that package</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Try going back to Packages and clicking Book Now again.
        </p>
        <Link to="/packages" className="btn-primary inline-block !py-2.5 !px-6 text-sm">
          Back to Packages
        </Link>
      </div>
    );
  }

  const total = pkg.price * form.travelers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/bookings", {
        packageId: id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        travelers: form.travelers,
        date: form.date,
        name: form.name,
        email: form.email,
        phone: form.phone,
        requests: form.requests,
        total,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={56} />
        <h1 className="text-2xl font-bold mb-2">Booking request received!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {pkg.name} — {form.travelers} traveler{form.travelers > 1 ? "s" : ""} on{" "}
          {form.date || "a date to be confirmed"}. We'll email you at {form.email || "your inbox"} to confirm.
        </p>
        <button onClick={() => navigate("/my-trips")} className="btn-primary !py-2.5 !px-6 text-sm">
          View My Trips
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden shadow-md mb-8 h-64">
        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {pkg.duration}
        </span>
        <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white">{pkg.name}</h1>
            <div className="flex items-center gap-1 mt-1 text-white/90 text-sm">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              {pkg.rating}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: details + form */}
        <div className="lg:col-span-2 space-y-8">
          {/* What's included */}
          <div>
            <h2 className="font-bold text-lg mb-3">What's included</h2>
            <div className="flex flex-wrap gap-2">
              {pkg.includes.map((item) => (
                <span
                  key={item}
                  className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-3 py-1.5 rounded-full font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Booking form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h2 className="font-bold text-lg mb-5">Trip details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Users size={15} /> Travelers
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.travelers}
                    onChange={(e) => setForm({ ...form, travelers: Number(e.target.value) })}
                    className="w-full rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={15} /> Travel date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    Full name
                  </label>
                  <input
                    required
                    placeholder="e.g. Alex Carter"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Special requests <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Dietary needs, accessibility, room preferences..."
                  value={form.requests}
                  onChange={(e) => setForm({ ...form, requests: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3.5 disabled:opacity-60"
              >
                {loading ? "Booking..." : `Confirm Booking — $${total}`}
              </button>
            </form>
          </div>
        </div>

        {/* Right: sticky price summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
            <h2 className="font-bold text-lg">Price summary</h2>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Base price</span>
              <span>${pkg.price} × {form.travelers}</span>
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-700" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-sky-600 dark:text-sky-400">${total}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
              <MapPin size={14} /> Free cancellation up to 48 hours before travel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}