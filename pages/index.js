// pages/index.js – Complete
// Brutalist “glass” UI with cuisine & hood filters + distance sort
// • Green (0-20 min), Yellow (21-35 min), Red (36 min+) badges
// • Separate Reset-Address icon (inline SVG)
// • Calculate button guarded by `calculating` flag so no double-click
// • ORS matrix calls chunked (40 dests) + polite throttle

import { useEffect, useMemo, useState } from 'react'
import MultiSelectFilter from '../components/MultiSelectFilter'

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY

export default function Home() {
  // ───── state
  const [restaurants, setRestaurants] = useState([])
  const [selCuisines, setSelCuisines] = useState([])
  const [selHoods, setSelHoods] = useState([])
  const [address, setAddress] = useState('')
  const [driveTimes, setDriveTimes] = useState({}) // id → seconds
  const [loading, setLoading] = useState(true)      // initial fetch
  const [calculating, setCalculating] = useState(false) // distance calc
  const [error, setError] = useState(null)

  // ───── fetch Airtable rows once
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // ───── derived options
  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants])
  const allHoods    = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants])

  // ───── helpers
  const geocode = async addr => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'la-rest/1.0 (contact@example.com)' } }).then(r => r.json())
    return res[0] ? { lat: +res[0].lat, lng: +res[0].lon } : null
  }
  const badgeColor = s => (s <= 1200 ? 'text-green-400' : s <= 2100 ? 'text-yellow-400' : 'text-red-500')

  // ───── ORS matrix
  const fetchDriveTimes = async () => {
    if (!address.trim() || !ORS_KEY || calculating) return
    setCalculating(true)
    try {
      const origin = await geocode(address)
      if (!origin) { alert('Address not found'); return }

      const coords = restaurants.filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
      if (!coords.length) { alert('No restaurant coordinates'); return }

      const CHUNK = 40
      const all = {}
      for (let i = 0; i < coords.length; i += CHUNK) {
        const slice = coords.slice(i, i + CHUNK)
        const body  = JSON.stringify({
          locations: [[origin.lng, origin.lat], ...slice.map(r => [r.longitude, r.latitude])],
          metrics: ['duration'], units: 'm'
        })
        const res = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
          method: 'POST', headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' }, body
        }).then(r => r.json())
        if (res.error) { console.error(res.error); alert(res.error.message); return }
        res.durations[0].slice(1).forEach((sec, idx) => { all[slice[idx].id] = sec })
        await new Promise(r => setTimeout(r, 800)) // throttle
      }
      setDriveTimes(all)
    } finally {
      setCalculating(false)
    }
  }

  // ───── filter + sort
  const filtered = useMemo(() => {
    let list = restaurants
    if (selCuisines.length || selHoods.length) {
      list = list.filter(r => {
        const c = selCuisines.length && (r.cuisines || []).some(cu => selCuisines.includes(cu))
        const h = selHoods.length && selHoods.includes(r.neighborhood)
        return c || h
      })
    }
    if (Object.keys(driveTimes).length) {
      list = [...list].sort((a, b) => (driveTimes[a.id] ?? 9e9) - (driveTimes[b.id] ?? 9e9))
    }
    return list
  }, [restaurants, selCuisines, selHoods, driveTimes])

  // ───── UI handlers
  const clearFilters = () => { setSelCuisines([]); setSelHoods([]); setDriveTimes({}) }
  const clearAddress = () => { setAddress(''); setDriveTimes({}) }

  // ───── render
  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-12 text-[#F2F2F2] font-mono">
      <h1 className="text-5xl font-bold uppercase tracking-tight mb-10">L.A. Restaurant Recommendations</h1>

      {/* Filter bar */}
      <section className="sticky top-0 z-40 mb-10 bg-[#0D0D0D] border-y border-[#3A3A3A] py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          <MultiSelectFilter options={allCuisines} value={selCuisines} onChange={setSelCuisines} placeholder="Add cuisine…" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" />
          <MultiSelectFilter options={allHoods} value={selHoods} onChange={setSelHoods} placeholder="Pick a neighbourhood" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" />
          {(selCuisines.length || selHoods.length) && (
            <button onClick={clearFilters} className="text-sm font-bold text-red-500 underline">Clear all</button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6 items-center">
          <input value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchDriveTimes()} placeholder="Enter your address to sort by drive time" className="w-full bg-transparent border border-[#3A3A3A] px-4 py-3 text-[#F2F2F2] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white" />
          <button onClick={fetchDriveTimes} disabled={!address.trim() || calculating} className="bg-white text-black font-bold px-6 py-3 uppercase text-sm tracking-wide hover:bg-[#3A3A3A] disabled:opacity-30">{calculating ? 'Calculating…' : 'Calculate'}</button>
          {!!address.trim() && (
            <button onClick={clearAddress} className="text-red-500 hover:text-red-400" title="Clear address"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M6 6l12 12M6 18L18 6"/></svg></button>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400">{loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filtered.length} restaurant${filtered.length === 1 ? '' : 's'}`}</p>
      </section>

      {/* Results */}
      {filtered.length === 0 && !loading ? (
        <p className="text-gray-500">No restaurants match those filters.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filtered.map(r => {
            const secs = driveTimes[r.id]
            return (
              <li key={r.id} className="border border-[#2A2A2A] p-6 bg-[#73655D] hover:bg-[#5E4F47] transition">
                <h2 className="text-2xl font-bold uppercase mb-2 text-[#F2F2F2]">{r.name}</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(r.cuisines || []).map(c => <span key={c} className="px-2 py-0.5 text-xs bg-[#592025] text-[#F2F2F2] font-semibold uppercase">{c}</span>)}
                </div>
                {r.neighborhood && <p className="text-sm font-semibold" style={{ color: '#40211E' }}>{r.neighborhood}</p>}
                {Number.isFinite(secs) && secs > 0 && (
                  <p className={`text-xs mt-1 font-mono ${badgeColor(secs)}`}>Drive: {Math.round(secs / 60)} min</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
