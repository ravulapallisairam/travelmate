import express from "express";
   import {
     createBooking,
     getMyBookings,
     cancelBooking,
     getAllBookings,
     updateBookingStatus,
   } from "../controllers/bookingController.js";
   import { protect } from "../middleware/authMiddleware.js";
   import { isAdmin } from "../middleware/adminMiddleware.js";

   const router = express.Router();

   router.get("/", protect, getMyBookings);
   router.post("/", protect, createBooking);
   router.put("/:id/cancel", protect, cancelBooking);

   router.get("/admin/all", protect, isAdmin, getAllBookings);
   router.put("/admin/:id/status", protect, isAdmin, updateBookingStatus);

   export default router;