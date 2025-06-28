// components/RestaurantGrid.js
import RestaurantCard from './RestaurantCard';

export default function RestaurantGrid({ list, driveTimes, badge }) {
  if (!list.length)
    return <p className="text-gray-500">No restaurants match those filters.</p>;

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
      {list.map(r => (
        <RestaurantCard
          key={r.id}
          restaurant={r}
          secs={driveTimes[r.id]}
          badge={badge}
        />
      ))}
    </ul>
  );
}
