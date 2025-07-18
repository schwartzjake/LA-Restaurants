// components/RestaurantList.js – Compact two-line layout
export default function RestaurantList({ list, driveTimes, badge }) {
  if (!list.length)
    return <p className="text-gray-500">No restaurants match those filters.</p>

  return (
    <ul className="divide-y divide-[#3A3A3A]">
      {list.map(r => {
        const secs = driveTimes[r.id]
        return (
          <li key={r.id} className="py-3">
            <div className="flex justify-between items-baseline">
              <div className="text-lg font-bold text-[#F2F2F2]">{r.name}</div>
              <div className="text-sm text-[#73655D] ml-4">{r.neighborhood || '—'}</div>
              {secs && (
                <div className={`text-sm font-mono ml-auto ${badge(secs)}`}>{Math.round(secs / 60)} min</div>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {(r.cuisines || []).map(c => (
                <span key={c} className="px-2 py-0.5 text-xs bg-[#592025] text-[#F2F2F2] font-semibold uppercase">{c}</span>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
