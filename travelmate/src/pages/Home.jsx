import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import DestinationCard from "../components/DestinationCard";
import api from "../api/axios";
import { Link } from "react-router-dom";

const whyUs = [
  { icon: "🤖", title: "AI Recommendations", desc: "Smart suggestions tailored to your travel taste." },
  { icon: "🗺️", title: "Smart Planning", desc: "Day-wise itineraries generated instantly." },
  { icon: "💰", title: "Budget Friendly", desc: "Plans that fit every budget, big or small." },
  { icon: "✨", title: "Personalized Trips", desc: "Every journey designed around you." },
];

const testimonials = [
  { name: "Ananya R.", text: "The AI planner built my entire Bali trip in seconds. Incredible experience!", avatar: "https://i.pravatar.cc/100?img=47" },
  { name: "Rahul K.", text: "Best travel platform I've used — clean, fast, and genuinely helpful suggestions.", avatar: "https://i.pravatar.cc/100?img=12" },
  { name: "Meera S.", text: "Saved my favorite destinations and planned my whole Europe trip effortlessly.", avatar: "https://i.pravatar.cc/100?img=32" },
];

export default function Home() {
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await api.get("/destinations");
        setPopular(data.slice(0, 8));
      } catch (err) {
        console.error(err);
      }
    };
    fetchPopular();
  }, []);

  return (
    <div>
      <Hero />

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold">Popular Destinations</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Handpicked places our travelers love the most</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popular.map((d) => (
            <DestinationCard key={d._id} destination={d} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/explore" className="btn-primary">View All Destinations</Link>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold">Why Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((w) => (
              <div key={w.title} className="glass rounded-2xl p-6 text-center shadow hover:-translate-y-2 transition-all duration-300">
                <div className="text-4xl mb-3">{w.icon}</div>
                <h3 className="font-bold mb-2">{w.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold">What Travelers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white dark:bg-gray-800 shadow p-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-300 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} className="w-10 h-10 rounded-full" />
                <span className="font-semibold">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}