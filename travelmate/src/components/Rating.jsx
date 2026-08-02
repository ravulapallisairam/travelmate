export default function Rating({ value }) {
  return (
    <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
      <span>⭐</span>
      <span>{value.toFixed(1)}</span>
    </div>
  );
}