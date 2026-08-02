# TravelMate AI — Smart Trip Planner & Destination Explorer

A full-stack MERN travel platform that helps users discover destinations, explore travel packages, and generate AI-inspired personalized itineraries.

🔗 **Live Site:** https://travelmate-sandy.vercel.app
🔗 **API:** https://travelmate-api-rfph.onrender.com
🔗 **GitHub:** https://github.com/ravulapallisairam/travelmate

---

## Overview

TravelMate AI is designed to feel like a real-world AI-powered travel startup product — combining destination discovery, personalized trip planning, and account-based trip management into one seamless experience. Users can browse destinations by category, save favorites, generate a custom day-wise itinerary based on their budget and travel style, and manage all their saved trips from a personal dashboard.

---

## Features

- 🔍 **Destination Explorer** — search and filter 35+ destinations by category (Beach, Mountain, Adventure, Historical, Nature, Luxury)
- 🤖 **AI Trip Planner** — generates a day-wise itinerary (morning/afternoon/evening activities), estimated budget, and hotel recommendations based on destination, duration, budget, and travel style
- ❤️ **Favorites** — save and remove destinations, tied to the logged-in user's account and persisted in MongoDB
- 🧳 **My Trips** — view, save, and delete generated itineraries from a personal dashboard
- 🔐 **Authentication** — secure JWT-based register/login with bcrypt password hashing and protected routes
- 📦 **Travel Packages** — curated all-inclusive package listings with pricing and inclusions
- 🌙 **Dark Mode** — full light/dark theme toggle
- 🎨 **Modern UI** — glassmorphism cards, gradient backgrounds, smooth animations, fully responsive (mobile-first) design

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router DOM
- Tailwind CSS
- Axios
- Context API (Auth + App state)

**Backend**
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcrypt.js

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## Architecture

```
AI-Powered Smart Trip Planner/
├── travelmate/                 → React frontend (deployed on Vercel)
│   ├── src/
│   │   ├── api/                → Axios instance with JWT interceptor
│   │   ├── components/         → Navbar, Footer, DestinationCard, PackageCard, etc.
│   │   ├── context/             → AuthContext, AppContext (favorites/trips/dark mode)
│   │   ├── data/                 → Static category data
│   │   ├── pages/                → Home, Explore, TripPlanner, Packages, Favorites, MyTrips, Login, Register, DestinationDetails
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env                     → VITE_API_URL
│
└── backend/                     → Express REST API (deployed on Render)
    ├── config/db.js             → MongoDB connection
    ├── models/                  → User, Destination, Package, Favorite, Trip
    ├── controllers/             → Business logic per resource
    ├── routes/                  → REST endpoint definitions
    ├── middleware/authMiddleware.js → JWT route protection
    ├── seed.js                  → Database seed script
    ├── server.js
    └── .env                      → MONGO_URI, JWT_SECRET, PORT
```

---

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/api/auth/register` | No | Create a new user account |
| POST | `/api/auth/login` | No | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Yes | Get current logged-in user |
| GET | `/api/destinations` | No | Get all destinations (supports `?category=` and `?search=`) |
| GET | `/api/destinations/:id` | No | Get a single destination by ID |
| GET | `/api/packages` | No | Get all travel packages |
| GET | `/api/favorites` | Yes | Get the current user's favorite destinations |
| POST | `/api/favorites` | Yes | Add a destination to favorites |
| DELETE | `/api/favorites/:destinationId` | Yes | Remove a destination from favorites |
| GET | `/api/trips` | Yes | Get all trips saved by the current user |
| POST | `/api/trips` | Yes | Save a new generated trip |
| PUT | `/api/trips/:id` | Yes | Update an existing trip |
| DELETE | `/api/trips/:id` | Yes | Delete a trip |

---

## Data Models

**User** — name, email, hashed password
**Destination** — name, country, image, rating, price, duration, category, description
**Package** — name, destination, image, duration, price, rating, includes[]
**Favorite** — user ref, destination ref (unique per user-destination pair)
**Trip** — user ref, name, destination, days, budget, travelStyle, itinerary (day-wise plan, hotels, places, estimated budget)

---

## Run Locally

### Prerequisites
- Node.js installed
- A MongoDB Atlas account and cluster (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/ravulapallisairam/travelmate.git
cd "AI-Powered Smart Trip Planner"
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Seed the database (optional, populates sample destinations/packages):
```bash
node seed.js
```

Run the backend:
```bash
npm run dev
```

### 3. Frontend setup
Open a new terminal:
```bash
cd travelmate
npm install
```

Create a `.env` file in `travelmate/`:
```
VITE_API_URL=http://localhost:5000/api
```

Run the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment

- **Backend** is deployed on [Render](https://render.com) with Root Directory set to `backend`
- **Frontend** is deployed on [Vercel](https://vercel.com) with Root Directory set to `travelmate`
- **Database** is hosted on [MongoDB Atlas](https://www.mongodb.com/atlas)

Environment variables (`MONGO_URI`, `JWT_SECRET` on Render; `VITE_API_URL` on Vercel) are configured directly in each platform's dashboard.

---

## Author

**Ravulapalli Sai Ram**
Final-year B.Tech, Artificial Intelligence and Data Science
GitHub: [@ravulapallisairam](https://github.com/ravulapallisairam)
