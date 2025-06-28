// components/RestaurantGrid.js
import RestaurantCard from './RestaurantCard';

export default function RestaurantGrid({
  list,
  driveTimes,
  badge,
  calculating = false,   // new prop
  emptyMessage = 'No restaurants match those filters.',
}) {
  /* Loading overlay when drive-time calculation is running */
  if (calculating)
    return (
      <div className="flex justify-center py-10">
        <svg
          className="animate-spin h-8 w-8 text-[#F2F2F2]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );

  if (!list.length)
    return <p className="text-gray-500">{emptyMessage}</p>;

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
      {list.map(r => (
        <li
          key={r.id}
          /* Card hover / filter-change transition */
          className="border border-[#2A2A2A] p-6 bg-[#73655D]
                     transition transform duration-300
                     hover:-translate-y-1 hover:shadow-xl"
        >
          <RestaurantCard
            restaurant={r}
            secs={driveTimes[r.id]}
            badge={badge}
          />
        </li>
      ))}
    </ul>
  );
}
