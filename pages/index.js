// pages/index.js – Adds view toggle (card/list) + responsive layout
import { useEffect, useMemo, useState } from 'react'
import MultiSelectFilter from '../components/MultiSelectFilter'
import RestaurantGrid from '../components/RestaurantGrid'
import RestaurantList from '../components/RestaurantList'

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY

export default function Home() {
  const [prevScroll, setPrevScroll] = useState(0);
  const [hideFilters, setHideFilters] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const curr = window.scrollY;
      setHideFilters(curr > prevScroll && curr > 80);
      setPrevScroll(curr);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScroll]);
  const [restaurants, setRestaurants] = useState([])
  const [selCuisines, setSelCuisines] = useState([])
  const [selHoods, setSelHoods] = useState([])
  const [address, setAddress] = useState('')
  const [driveTimes, setDriveTimes] = useState({})
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('card')

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(data => setRestaurants(
        data.map((r, idx) => ({ ...r, id: r.id ?? `r${idx}` }))
            .sort(() => Math.random() - 0.5)))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants])
  const allHoods = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants])

  const geocode = async addr => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`, {
      headers: { 'User-Agent': 'la-rest/1.0 (contact@example.com)' }
    }).then(r => r.json())
    return res[0] ? { lat: +res[0].lat, lng: +res[0].lon } : null
  }
  const badge = s => (s <= 1200 ? 'text-green-400' : s <= 2100 ? 'text-yellow-400' : 'text-red-500')

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

  const filtered = useMemo(() => {
    let list = restaurants
    if (selCuisines.length && selHoods.length) {
      list = list.filter(r =>
        (r.cuisines || []).some(c => selCuisines.includes(c)) &&
        selHoods.includes(r.neighborhood)
      )
    } else if (selCuisines.length) {
      list = list.filter(r => (r.cuisines || []).some(c => selCuisines.includes(c)))
    } else if (selHoods.length) {
      list = list.filter(r => selHoods.includes(r.neighborhood))
    }
    if (Object.keys(driveTimes).length) list = [...list].sort((a, b) => (driveTimes[a.id] ?? 1e9) - (driveTimes[b.id] ?? 1e9))
    return list
  }, [restaurants, selCuisines, selHoods, driveTimes])

  const clearFilters = () => { setSelCuisines([]); setSelHoods([]); }
  const clearAddress = () => { setAddress(''); setDriveTimes({}) }

  return (
    <main className="overscroll-contain relative min-h-screen bg-[#0D0D0D] px-4 sm:px-6 py-10 sm:py-12 text-[#F2F2F2] font-mono">
      {calculating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <svg className="h-12 w-12 animate-spin text-[#F2F2F2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight mb-8 sm:mb-10">L.A. Restaurant Recommendations</h1>

      <section className={`sticky top-0 z-40 mb-8 sm:mb-10 bg-[#0D0D0D] border-y border-[#3A3A3A] py-6 transition-transform duration-300 ${hideFilters ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:gap-8">
          {allCuisines.length > 0 && (
            <MultiSelectFilter options={allCuisines} value={selCuisines} onChange={setSelCuisines} placeholder="Select Cuisine(s)" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" closeMenuOnSelect={false} highlightSearch matchTags />
          )}
          {allHoods.length > 0 && (
            <MultiSelectFilter options={allHoods} value={selHoods} onChange={setSelHoods} placeholder="Select Neighborhood(s)" inputClassName="min-w-[220px] bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" closeMenuOnSelect={false} highlightSearch matchTags />
          )}
          {(selCuisines.length > 0 || selHoods.length > 0) && (
            <button onClick={clearFilters} className="text-sm font-bold text-red-500 underline">Clear all</button>
          )}
          <div className="sm:ml-auto flex gap-2 text-sm">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-full border transition-colors ${viewMode === 'card' ? 'bg-[#F2F2F2] text-black font-bold' : 'border-gray-500 text-gray-400 hover:bg-gray-800'}`}
            >
              Card
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full border transition-colors ${viewMode === 'list' ? 'bg-[#F2F2F2] text-black font-bold' : 'border-gray-500 text-gray-400 hover:bg-gray-800'}`}
            >
              List
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center">
          <input
            value={address}
            onFocus={() => setHideFilters(false)}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchDriveTimes()}
            placeholder="Enter address for drive times"
            className="min-w-[280px] w-full bg-transparent border border-[#3A3A3A] px-4 py-3 text-[#F2F2F2] placeholder-gray-500 placeholder:text-sm placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis placeholder:text-[13px] placeholder:text-left focus:outline-none focus:ring-2 focus:ring-white focus:scroll-mt-32"
          />
          <button onClick={fetchDriveTimes} disabled={!address.trim() || calculating} className="bg-white text-black font-bold px-6 py-3 uppercase text-sm tracking-wide hover:bg-[#3A3A3A] disabled:opacity-30 w-full sm:w-auto">{calculating ? 'Calculating…' : 'Calculate'}</button>
          {!!address.trim() && (
            <button onClick={clearAddress} className="text-red-500 hover:text-red-400" title="Clear address"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M6 6l12 12M6 18L18 6"/></svg></button>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400 text-center sm:text-left">{loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filtered.length} restaurant${filtered.length === 1 ? '' : 's'}`}</p>
      </section>

      {viewMode === 'card' ? (
        <RestaurantGrid list={filtered} driveTimes={driveTimes} badge={badge} />
      ) : (
        <RestaurantList list={filtered} driveTimes={driveTimes} badge={badge} />
      )}
    </main>
  )
}
