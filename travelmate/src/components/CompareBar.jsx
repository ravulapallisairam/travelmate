import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold whitespace-nowrap">Compare ({compareList.length}/3)</span>

        <div className="flex gap-2 flex-1 overflow-x-auto">
          {compareList.map((d) => (
            <div key={d._id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full pl-2 pr-1 py-1 shadow shrink-0">
              <img src={d.image} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-xs font-medium whitespace-nowrap">{d.name}</span>
              <button onClick={() => removeFromCompare(d._id)} className="w-5 h-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs">✕</button>
            </div>
          ))}
        </div>

        <button onClick={clearCompare} className="text-xs text-gray-500 hover:text-red-500 whitespace-nowrap">Clear</button>
        <button
          onClick={() => navigate("/compare")}
          disabled={compareList.length < 2}
          className="btn-primary !py-2 !px-5 text-sm whitespace-nowrap disabled:opacity-40"
        >
          Compare Now
        </button>
      </div>
    </div>
  );
}