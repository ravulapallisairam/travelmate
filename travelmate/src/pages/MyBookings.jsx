import { useState, useEffect } from "react";
import { Calendar, Users, X, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import Loader from "../components/Loader";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState("");

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings");
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCancel = async (id, packageName) => {
    if (!window.confirm("Cancel this booking? This can't be undone.")) return;
    setCancellingId(id);
    try {
      const { data } = await api.put(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b._id === id ? data : b)));
      setToast(`"${packageName}" was cancelled successfully.`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 relative">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-full shadow-lg animate-banner">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold">My Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">All your booked packages in one place</p>
      </div>

      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-16">
          No bookings yet. Head to Packages to book your first trip!
        </p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h2 className="font-bold text-lg">{b.packageName}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={15} /> {b.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={15} /> {b.travelers} traveler{b.travelers > 1 ? "s" : ""}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      b.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : b.status === "cancelled"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-bold text-sky-600 dark:text-sky-400">${b.total}</p>
                  <p className="text-xs text-gray-400 mt-1">Booked {new Date(b.createdAt).toLocaleDateString()}</p>
                </div>

                {b.status !== "cancelled" && (
                  <button
                    onClick={() => handleCancel(b._id, b.packageName)}
                    disabled={cancellingId === b._id}
                    className="flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 font-semibold hover:bg-red-100 dark:hover:bg-red-900 transition disabled:opacity-50"
                  >
                    <X size={14} />
                    {cancellingId === b._id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}