import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import DestinationCard from "../components/DestinationCard";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import FeedbackWidget from "../components/FeedbackWidget";

const whyUs = [
  { 
    icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80", 
    title: "AI Recommendations", 
    desc: "Smart suggestions tailored to your travel taste." 
  },
  { 
    icon: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80", 
    title: "Smart Planning", 
    desc: "Day-wise itineraries generated instantly." 
  },
  { 
    icon: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80", 
    title: "Budget Friendly", 
    desc: "Plans that fit every budget, big or small." 
  },
  { 
    icon: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80", 
    title: "Personalized Trips", 
    desc: "Every journey designed around you." 
  },
];

const testimonials = [
  { name: "Ananya R.", text: "The AI planner built my entire Bali trip in seconds. Incredible experience!", avatar: "https://i.pravatar.cc/100?img=47" },
  { name: "Rahul K.", text: "Best travel platform I've used — clean, fast, and genuinely helpful suggestions.", avatar: "https://i.pravatar.cc/100?img=12" },
  { name: "Meera S.", text: "Saved my favorite destinations and planned my whole Europe trip effortlessly.", avatar: "https://i.pravatar.cc/100?img=32" },
];

export default function Home() {
  const { user } = useAuth();
  const [popular, setPopular] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [revealed, setRevealed] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setLoadingRecs(false);
      return;
    }
    const fetchRecommended = async () => {
      try {
        const { data } = await api.get("/destinations/recommended/for-me");
        setRecommended(data);
        setTimeout(() => setRevealed(true), 100);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecommended();
  }, [user]);

  return (
    <div>
      <Hero />

      {user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sparkles size={18} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold">Recommended for You</h2>
            </div>
            <Link to="/travel-dna" className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
              View Travel DNA <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Based on your Travel DNA and preferences</p>

          {loadingRecs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950 dark:to-emerald-950 p-8 text-center">
              <Sparkles size={28} className="text-sky-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Set your travel preferences to unlock personalized recommendations.
              </p>
              <Link to="/preferences" className="btn-primary !py-2 !px-5 text-sm inline-block">
                Set Preferences
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((rec, i) => (
                <div
                  key={rec.destination._id}
                  className="relative transition-all duration-500"
                  style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "translateY(0)" : "translateY(16px)",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full pl-2 pr-3 py-1 shadow-lg">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{rec.matchScore}% Match</span>
                  </div>
                  <DestinationCard destination={rec.destination} />
                  {rec.reasons.length > 0 && (
                    <div className="mt-2 space-y-1 px-1">
                      {rec.reasons.map((reason, ri) => (
                        <p key={ri} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="text-emerald-500">✓</span> {reason}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 px-1">
                    <FeedbackWidget type="recommendation" targetId={rec.destination._id} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
              <div key={w.title} className="glass rounded-2xl p-6 text-center shadow hover:-translate-y-2 transition-all duration-300 flex flex-col items-center">
                <div className="w-16 h-16 mb-4 rounded-full overflow-hidden shadow-md">
                  <img src={w.icon} alt={w.title} className="w-full h-full object-cover" />
                </div>
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
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                <span className="font-semibold">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}