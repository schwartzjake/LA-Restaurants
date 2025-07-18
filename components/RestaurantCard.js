// components/RestaurantCard.js – Make card clickable using Google Maps URL
export default function RestaurantCard({ restaurant, secs, badge }) {
  const mapsLink = restaurant.googleMapsUrl || '#';

  return (
    <a
      href={mapsLink}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-800 p-6 bg-[#1A1A1A] hover:bg-[#222] transition"
    >
      <div>
        <h2 className="text-2xl font-bold uppercase mb-2 text-white">{restaurant.name}</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {(restaurant.cuisines || []).map(c => (
            <span key={c} className="px-2 py-0.5 text-xs bg-[#592025] text-[#F2F2F2] font-semibold uppercase">{c}</span>
          ))}
        </div>
        {restaurant.neighborhood && (
          <p className="text-xs text-[#73655D]">{restaurant.neighborhood}</p>
        )}
        {secs && (
          <p className={`text-xs font-mono mt-1 ${badge(secs)}`}>Drive: {Math.round(secs / 60)} min</p>
        )}
      </div>
    </a>
  );
}
