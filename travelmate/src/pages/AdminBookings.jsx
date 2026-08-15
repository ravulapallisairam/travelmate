import { useState, useEffect } from "react";
   import { Calendar, Users, Mail } from "lucide-react";
   import api from "../api/axios";
   import Loader from "../components/Loader";

   export default function AdminBookings() {
     const [bookings, setBookings] = useState([]);
     const [loading, setLoading] = useState(true);
     const [updatingId, setUpdatingId] = useState(null);
     const [error, setError] = useState("");

     const fetchAll = async () => {
       try {
         const { data } = await api.get("/bookings/admin/all");
         setBookings(data);
       } catch (err) {
         setError(err.response?.data?.message || "Failed to load bookings.");
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       fetchAll();
     }, []);

     const handleStatusChange = async (id, status) => {
       setUpdatingId(id);
       try {
         const { data } = await api.put(`/bookings/admin/${id}/status`, { status });
         setBookings((prev) => prev.map((b) => (b._id === id ? data : b)));
       } catch (err) {
         alert(err.response?.data?.message || "Failed to update status.");
       } finally {
         setUpdatingId(null);
       }
     };

     if (error) {
       return <div className="max-w-3xl mx-auto px-6 py-24 text-center text-red-500">{error}</div>;
     }

     return (
       <div className="max-w-6xl mx-auto px-6 py-12">
         <div className="text-center mb-10">
           <h1 className="text-3xl font-extrabold">Admin — All Bookings</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-2">Manage every booking across all users</p>
         </div>

         {loading ? (
           <Loader />
         ) : bookings.length === 0 ? (
           <p className="text-center text-gray-500 dark:text-gray-400 py-16">No bookings yet.</p>
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
                       <Users size={15} /> {b.travelers}
                     </span>
                     <span className="flex items-center gap-1.5">
                       <Mail size={15} /> {b.user?.email || b.email}
                     </span>
                   </div>
                   <p className="text-xs text-gray-400 mt-1">
                     Booked by {b.user?.name || "Unknown"} on {new Date(b.createdAt).toLocaleDateString()}
                   </p>
                 </div>

                 <div className="flex items-center gap-3">
                   <span className="text-lg font-bold text-sky-600 dark:text-sky-400">${b.total}</span>
                   <select
                     value={b.status}
                     disabled={updatingId === b._id}
                     onChange={(e) => handleStatusChange(b._id, e.target.value)}
                     className="text-sm rounded-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-semibold capitalize outline-none disabled:opacity-50"
                   >
                     <option value="pending">Pending</option>
                     <option value="confirmed">Confirmed</option>
                     <option value="cancelled">Cancelled</option>
                   </select>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
     );
   }