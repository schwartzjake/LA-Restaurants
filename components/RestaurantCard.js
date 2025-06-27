// components/RestaurantCard.js
export default function RestaurantCard({ restaurant, secs, badge }) {
  return (
    <li
      className="border border-[#2A2A2A] p-6 bg-[#73655D] hover:bg-[#5E4F47] transition"
    >
      <h2 className="text-2xl font-bold uppercase mb-2 text-[#F2F2F2]">
        {restaurant.name}
      </h2>

      {/* cuisine tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(restaurant.cuisines || []).map(c => (
          <span
            key={c}
            className="px-2 py-0.5 text-xs bg-[#592025] text-[#F2F2F2] font-semibold uppercase"
          >
            {c}
          </span>
        ))}
      </div>

      {/* neighborhood */}
      {restaurant.neighborhood && (
        <p className="text-sm font-semibold" style={{ color: '#40211E' }}>
          {restaurant.neighborhood}
        </p>
      )}

      {/* drive-time badge */}
      {Number.isFinite(secs) && secs > 0 && (
        <p className={`text-xs mt-1 font-mono ${badge(secs)}`}>
          Drive: {Math.round(secs / 60)} min
        </p>
      )}
    </li>
  );
}
