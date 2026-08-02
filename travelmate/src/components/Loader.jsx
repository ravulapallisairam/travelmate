export default function Loader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-white dark:bg-gray-800 shadow">
          <div className="h-48 bg-gray-300 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}