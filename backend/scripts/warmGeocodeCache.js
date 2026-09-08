// One-time script: geocodes every destination's topAttractions ahead of
// time so real users never pay the full geocoding cost on a fresh trip.
// Run manually (NOT on every server start) — the MongoDB cache persists,
// so this only needs to run once, and again later if you add destinations.
//
// Usage: node scripts/warmGeocodeCache.js

import "dotenv/config";
import mongoose from "mongoose";
import Destination from "../models/Destination.js";
import { geocodeLocation } from "../services/geocodingService.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB. Starting geocode warm-up...");

  const destinations = await Destination.find();
  let total = 0;
  let warmed = 0;
  let failed = 0;

  for (const dest of destinations) {
    const locations = dest.topAttractions || [];
    for (const location of locations) {
      total++;
      const coords = await geocodeLocation(location, dest.name);
      if (coords) {
        warmed++;
        console.log(`✓ ${location}, ${dest.name} -> ${coords.lat}, ${coords.lng}`);
      } else {
        failed++;
        console.log(`✗ ${location}, ${dest.name} -> not found`);
      }
    }
  }

  console.log(`\nDone. ${warmed}/${total} geocoded successfully, ${failed} not found.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Warm-up script failed:", err);
  process.exit(1);
});