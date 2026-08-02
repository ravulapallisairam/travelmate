export default function CategoryCard({ category, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 px-5 py-4 rounded-2xl min-w-[110px] transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-lg scale-105"
          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:scale-105 shadow"
      }`}
    >
      <span className="text-2xl">{category.icon}</span>
      <span className="text-sm font-semibold">{category.name}</span>
    </button>
  );
}