// components/RestaurantList.js – Minimal list-style layout
export default function RestaurantList({ list, driveTimes, badge }) {
  if (!list.length)
    return <p className="text-gray-500">No restaurants match those filters.</p>

  return (
    <ul className="divide-y divide-[#3A3A3A]">
      {list.map(r => {
        const secs = driveTimes[r.id]
        return (
          <li key={r.id} className="py-4">
            <h2 className="text-lg font-bold text-[#F2F2F2]">{r.name}</h2>
            <div className="text-sm text-[#73655D]">
              {r.neighborhood || 'Unknown neighborhood'}
              {secs && (
                <span className={`ml-4 ${badge(secs)}`}>{Math.round(secs / 60)} min drive</span>
              )}
            </div>
            <div className="mt-1 text-sm text-[#F2F2F2]">
              {(r.cuisines || []).join(', ')}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
