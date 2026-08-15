import { useNavigate } from "react-router-dom";
import Rating from "./Rating";

export default function PackageCard({ pkg }) {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate(`/booking/${pkg._id}`, { state: { pkg } });
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48">
        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {pkg.duration}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{pkg.name}</h3>
          <Rating value={pkg.rating} />
        </div>
        <div className="flex flex-wrap gap-2">
          {pkg.includes.map((item) => (
            <span key={item} className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full">
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-sky-600 dark:text-sky-400">${pkg.price}</span>
          <button onClick={handleBookNow} className="btn-primary !py-2 !px-5 text-sm">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}