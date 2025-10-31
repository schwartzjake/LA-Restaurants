// pages/index.js – Adds view toggle (card/list) + responsive layout + reintroduce scroll-based filter bar toggle with icon buttons
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic';
import MultiSelectFilter from '../components/MultiSelectFilter'
import RestaurantGrid from '../components/RestaurantGrid'
import RestaurantList from '../components/RestaurantList'
import { LayoutGrid, List, MapPinned } from 'lucide-react'

const RestaurantMap = dynamic(() => import('../components/RestaurantMap'), {
  ssr: false,
  loading: () => <div className="h-[60vh] flex items-center justify-center">Loading map…</div>,
});

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [selCuisines, setSelCuisines] = useState([])
  const [selHoods, setSelHoods] = useState([])
  const [address, setAddress] = useState('')
  const [driveTimes, setDriveTimes] = useState({})
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('card')
  const [userLatLng, setUserLatLng] = useState(null)
  const [hideFilters, setHideFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [scrolledPastHeader, setScrolledPastHeader] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    if (mq.addEventListener) {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }
    mq.addListener(update)
    return () => mq.removeListener(update)
  }, [])

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(data => setRestaurants(
        data.map((r, idx) => ({ ...r, id: r.id ?? `r${idx}` }))
            .sort(() => Math.random() - 0.5)))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let lastY = 0;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y <= 120) {
        setHideFilters(false);
        setScrolledPastHeader(false);
      } else if (delta > 20) {
        setHideFilters(true);
        setScrolledPastHeader(true);
      }

      lastY = y;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants])
  const allHoods = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants])

  const badge = s => (s <= 1200 ? 'text-green-400' : s <= 2100 ? 'text-yellow-400' : 'text-red-500')

  const fetchDriveTimes = async () => {
    if (!address.trim() || calculating) return

    const coords = restaurants
      .map(r => {
        const lat = typeof r.latitude === 'number' ? r.latitude : Number.parseFloat(r.latitude)
        const lng = typeof r.longitude === 'number' ? r.longitude : Number.parseFloat(r.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        return { id: r.id, latitude: lat, longitude: lng }
      })
      .filter(Boolean)

    if (!coords.length) { alert('No restaurant coordinates'); return }

    setCalculating(true)
    try {
      const response = await fetch('/api/drivetimes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, restaurants: coords })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = payload.error || 'Failed to calculate drive times'
        throw new Error(message)
      }

      setDriveTimes(payload.durations || {})
      const lat = Number(payload.origin?.lat)
      const lng = Number(payload.origin?.lng)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setUserLatLng([lat, lng])
      }
    } catch (err) {
      console.error('Drive time calculation failed:', err)
      alert(err.message || 'Failed to calculate drive times')
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
  const clearAddress = () => { setAddress(''); setDriveTimes({}); setUserLatLng(null) }

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

     <h1 className="text-5xl font-bold uppercase tracking-tight mb-10 flex items-center gap-2">
  The List
  <span className="bg-[#592025] text-[#F2F2F2] px-2 py-1 text-2xl rounded">
    LA
  </span>
</h1>


      <section className={`sticky top-0 z-40 mb-8 sm:mb-10 bg-[#0D0D0D] border-y border-[#3A3A3A] py-6 transition-transform duration-300 ${hideFilters ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 flex-wrap justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4 flex-wrap">
            <MultiSelectFilter options={allCuisines} value={selCuisines} onChange={setSelCuisines} placeholder="Select Cuisine(s)" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-gray-600 focus:border-white" clampToViewport={isMobile && viewMode !== 'map'} />
            <MultiSelectFilter options={allHoods} value={selHoods} onChange={setSelHoods} placeholder="Select Neighborhood(s)" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-gray-600 focus:border-white" clampToViewport={isMobile && viewMode !== 'map'} />
            {(selCuisines.length > 0 || selHoods.length > 0) && <button onClick={clearFilters} className="text-sm font-bold text-red-500 underline">Clear all</button>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-full border ${viewMode === 'map' ? 'bg-white text-black' : 'border-[#666] text-[#999] hover:border-[#aaa] hover:text-[#ccc]'}`}
              title="Map view"
              aria-label="Map view"
            >
              <MapPinned size={18} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-full border ${viewMode === 'card' ? 'bg-white text-black' : 'border-[#666] text-[#999] hover:border-[#aaa] hover:text-[#ccc]'}`}
              title="Card view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full border ${viewMode === 'list' ? 'bg-white text-black' : 'border-[#666] text-[#999] hover:border-[#aaa] hover:text-[#ccc]'}`}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
         <input
  type="text"
  value={address}
  onChange={e => setAddress(e.target.value)}
    onKeyDown={e => {
    if (e.key === 'Enter') {
      fetchDriveTimes();
    }
              }}
  placeholder="Enter address to sort by drive time"
  className="w-full bg-transparent border border-gray-700 px-4 py-3 text-[#F2F2F2] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
/>
          <div className="flex gap-3">
            <button onClick={fetchDriveTimes} disabled={!address.trim() || loading} className="bg-white text-black font-bold px-6 py-3 uppercase text-sm tracking-wide hover:bg-gray-200 disabled:opacity-30">Calculate</button>
            {address && <button onClick={clearAddress} className="px-3 py-3 border border-[#444] hover:bg-[#1e1e1e]" title="Clear address"><span className="sr-only">Clear address</span>⨯</button>}
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">{loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filtered.length} restaurant${filtered.length === 1 ? '' : 's'}`}</p>
      </section>

      <div className={viewMode === 'map' ? 'block' : 'hidden'} aria-hidden={viewMode !== 'map'}>
        <RestaurantMap
          restaurants={filtered}
          userLatLng={userLatLng || null}
          isVisible={viewMode === 'map'}
          onChangeViewMode={setViewMode}
          currentViewMode={viewMode}
          filters={{
            allCuisines,
            selCuisines,
            setSelCuisines,
            allHoods,
            selHoods,
            setSelHoods,
          }}
        />
      </div>
      {viewMode === 'card' && (
        <RestaurantGrid list={filtered} driveTimes={driveTimes} badge={badge} />
      )}
      {viewMode === 'list' && (
        <RestaurantList list={filtered} driveTimes={driveTimes} badge={badge} />
      )}

      {viewMode !== 'map' && hideFilters && scrolledPastHeader && (
        <button
          type="button"
          onClick={() => setHideFilters(false)}
          className="fixed right-4 bottom-20 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#592025] text-white shadow-lg sm:hidden"
          aria-label="Show filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sliders-horizontal"><line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line></svg>
        </button>
      )}
    </main>
  )
}
