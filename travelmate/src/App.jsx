import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CompareBar from "./components/CompareBar";
import Home from "./pages/Home";
import DestinationExplorer from "./pages/DestinationExplorer";
import TripPlanner from "./pages/TripPlanner";
import Packages from "./pages/Packages";
import Favorites from "./pages/Favorites";
import MyTrips from "./pages/MyTrips";
import DestinationDetails from "./pages/DestinationDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Compare from "./pages/Compare";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import AdminBookings from "./pages/AdminBookings";
import Preferences from "./pages/Preferences";
import TravelDNA from "./pages/TravelDNA";
import CopilotPanel from "./components/CopilotPanel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/explore" element={<DestinationExplorer />} />
          <Route path="/planner" element={<ProtectedRoute><TripPlanner /></ProtectedRoute>} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/destination/:id" element={<DestinationDetails />} />
          <Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<div className="text-center py-32 text-xl">404 — Page Not Found</div>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute><AdminBookings /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
          <Route path="/travel-dna" element={<ProtectedRoute><TravelDNA /></ProtectedRoute>} />
        </Routes>
      </main>
      <CompareBar />
      <CopilotPanel />
      <Footer />
    </div>
  );
}