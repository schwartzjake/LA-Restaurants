// components/RestaurantList.js – Uses Google Maps URL from Airtable
export default function RestaurantList({ list, driveTimes, badge }) {
  if (!list.length)
    return <p className="text-gray-500">No restaurants match those filters.</p>

  return (
    <ul className="divide-y divide-[#3A3A3A]">
      {list.map(r => {
        const secs = driveTimes[r.id]
        const mapsLink = r.googleMapsUrl || '#'

        return (
          <a
            key={r.id}
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-[#1E1E1E] transition"
          >
            <li className="py-4 px-2">
              <div className="flex justify-between items-baseline">
                <div className="text-lg font-bold text-[#F2F2F2]">{r.name}</div>
                {secs && (
                  <div className={`text-sm font-mono text-right w-20 ${badge(secs)}`}>{Math.round(secs / 60)} min</div>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {(r.cuisines || []).map(c => (
                  <span key={c} className="px-2 py-0.5 text-xs bg-[#592025] text-[#F2F2F2] font-semibold uppercase">{c}</span>
                ))}
              </div>
              <div className="mt-1 text-sm text-[#73655D]">{r.neighborhood || '—'}</div>
            </li>
          </a>
        )
      })}
    </ul>
  )
}
