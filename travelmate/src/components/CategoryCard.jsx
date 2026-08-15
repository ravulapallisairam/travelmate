export default function CategoryCard({ category, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-36 h-24 rounded-2xl overflow-hidden shadow transition-all duration-300 group ${
        active ? "ring-4 ring-sky-500 scale-105" : "hover:scale-105 hover:shadow-lg"
      }`}
    >
      <img
        src={category.image}
        alt={category.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div
        className={`absolute inset-0 transition-colors duration-300 ${
          active
            ? "bg-gradient-to-t from-sky-600/80 via-sky-600/10 to-transparent"
            : "bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        }`}
      />
      <span className="absolute bottom-2 left-0 right-0 text-center text-white text-sm font-bold drop-shadow-md">
        {category.name}
      </span>
      {active && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-sky-600 text-xs font-bold flex items-center justify-center">
          ✓
        </span>
      )}
    </button>
  );
}