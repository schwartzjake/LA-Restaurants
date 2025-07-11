// pages/index.js – Adds full‑screen spinner while drive times calculate
// Spinner appears over content when `calculating` is true.
// Card layout & logic unchanged.

import { useEffect, useMemo, useState } from 'react'
import MultiSelectFilter from '../components/MultiSelectFilter'
import RestaurantGrid from '../components/RestaurantGrid'

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [selCuisines, setSelCuisines] = useState([])
  const [selHoods, setSelHoods] = useState([])
  const [address, setAddress] = useState('')
  const [driveTimes, setDriveTimes] = useState({})
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState(null)

  /* ─── initial data fetch */
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants])
  const allHoods = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants])

  /* ─── helpers */
  const geocode = async addr => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`, {
      headers: { 'User-Agent': 'la-rest/1.0 (contact@example.com)' }
    }).then(r => r.json())
    return res[0] ? { lat: +res[0].lat, lng: +res[0].lon } : null
  }
  const badge = s => (s <= 1200 ? 'text-green-400' : s <= 2100 ? 'text-yellow-400' : 'text-red-500')

  /* ─── distance matrix */
  const fetchDriveTimes = async () => {
    if (!address.trim() || !ORS_KEY || calculating) return
    setCalculating(true)
    try {
      const origin = await geocode(address)
      if (!origin) { alert('Address not found'); return }

      const coords = restaurants.filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
      if (!coords.length) { alert('No restaurant coordinates'); return }

      const CHUNK = 40, all = {}
      for (let i = 0; i < coords.length; i += CHUNK) {
        const slice = coords.slice(i, i + CHUNK)
        const body = JSON.stringify({ locations: [[origin.lng, origin.lat], ...slice.map(r => [r.longitude, r.latitude])], metrics: ['duration'], units: 'm' })
        const res = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', { method: 'POST', headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' }, body }).then(r => r.json())
        if (res.error) { console.error(res.error); alert(res.error.message); return }
        res.durations[0].slice(1).forEach((sec, idx) => { all[slice[idx].id] = sec })
        await new Promise(r => setTimeout(r, 800))
      }
      setDriveTimes(all)
    } finally {
      setCalculating(false)
    }
  }

  /* ─── filter + sort */
  const filtered = useMemo(() => {
    let list = restaurants
    if (selCuisines.length || selHoods.length) {
      list = list.filter(r => (
        (selCuisines.length && (r.cuisines || []).some(c => selCuisines.includes(c))) ||
        (selHoods.length && selHoods.includes(r.neighborhood))
      ))
    }
    if (Object.keys(driveTimes).length) list = [...list].sort((a, b) => (driveTimes[a.id] ?? 1e9) - (driveTimes[b.id] ?? 1e9))
    return list
  }, [restaurants, selCuisines, selHoods, driveTimes])

  const clearFilters = () => { setSelCuisines([]); setSelHoods([]); setDriveTimes({}) }
  const clearAddress = () => { setAddress(''); setDriveTimes({}) }

  return (
    <main className="relative min-h-screen bg-[#0D0D0D] px-6 py-12 text-[#F2F2F2] font-mono">
      {/* full‑screen spinner overlay */}
      {calculating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <svg className="h-12 w-12 animate-spin text-[#F2F2F2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      <h1 className="text-5xl font-bold uppercase tracking-tight mb-10">L.A. Restaurant Recommendations</h1>

      {/* Filter & address bar */}
      <section className="sticky top-0 z-40 mb-10 bg-[#0D0D0D] border-y border-[#3A3A3A] py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          {allCuisines.length > 0 && (
            <MultiSelectFilter options={allCuisines} value={selCuisines} onChange={setSelCuisines} placeholder="Add cuisine…" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" />
          )}
          {allHoods.length > 0 && (
            <MultiSelectFilter options={allHoods} value={selHoods} onChange={setSelHoods} placeholder="Pick a neighbourhood" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" />
          )}
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

      {/* Results grid */}
      <RestaurantGrid list={filtered} driveTimes={driveTimes} badge={badge} />
    </main>
  )
}
