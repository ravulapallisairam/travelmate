import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Destination from "./models/Destination.js";
import Package from "./models/Package.js";

dotenv.config();
connectDB();

const destinations = [
  { name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", rating: 4.8, price: 1200, duration: "5 Days", category: "Beach", description: "Beautiful tropical paradise with lush rice terraces and pristine beaches." },
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", rating: 4.9, price: 2100, duration: "6 Days", category: "Historical", description: "The city of lights, romance, and iconic landmarks like the Eiffel Tower." },
  { name: "Switzerland", country: "Switzerland", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800", rating: 4.9, price: 2600, duration: "7 Days", category: "Mountain", description: "Snow-capped Alps, crystal lakes, and postcard-perfect villages." },
  { name: "Dubai", country: "UAE", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", rating: 4.7, price: 1800, duration: "4 Days", category: "Luxury", description: "Futuristic skyline, desert safaris, and world-class shopping." },
  { name: "Maldives", country: "Maldives", image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800", rating: 4.9, price: 2400, duration: "5 Days", category: "Beach", description: "Overwater villas and turquoise lagoons in a tropical dream." },
  { name: "Taj Mahal, Agra", country: "India", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800", rating: 5.0, price: 600, duration: "2 Days", category: "Historical", description: "The iconic marble mausoleum and UNESCO World Heritage Site, a symbol of eternal love." },
  { name: "Kerala", country: "India", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", rating: 4.6, price: 700, duration: "5 Days", category: "Nature", description: "Serene backwaters, tea gardens, and lush tropical greenery." },
  { name: "Goa Beaches", country: "India", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800", rating: 4.6, price: 800, duration: "4 Days", category: "Beach", description: "Golden beaches, vibrant nightlife, and Portuguese-era churches on India's west coast." },
  { name: "Ladakh", country: "India", image: "https://images.unsplash.com/photo-1589182337358-2cb63099350c?w=800", rating: 4.9, price: 1300, duration: "6 Days", category: "Adventure", description: "High-altitude desert landscapes, monasteries, and epic mountain passes." },
  { name: "Wonderla, Bangalore", country: "India", image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800", rating: 4.5, price: 250, duration: "1 Day", category: "Adventure", description: "One of India's top amusement parks, packed with thrilling rides, water slides, and a resort stay." },
];

const packages = [
  { name: "Bali Adventure Escape", destination: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", duration: "5 Days", price: 1400, rating: 4.8, includes: ["Hotel", "Food", "Activities", "Transport"] },
  { name: "Romantic Paris Getaway", destination: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", duration: "6 Days", price: 2300, rating: 4.9, includes: ["Hotel", "Food", "Eiffel Tour", "Transport"] },
  { name: "Kerala Backwater Bliss", destination: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", duration: "5 Days", price: 900, rating: 4.6, includes: ["Houseboat", "Food", "Ayurveda Spa", "Transport"] },
];

const importData = async () => {
  try {
    await Destination.deleteMany();
    await Package.deleteMany();
    await Destination.insertMany(destinations);
    await Package.insertMany(packages);
    console.log("Data imported successfully!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();