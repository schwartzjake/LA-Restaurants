// Godly-style site with brutalist flair
// Changes:
// 1) Cuisine pills use #592025 background and #F2F2F2 text
// 2) Neighbourhood text uses #73655D
// 3) Cuisine and neighbourhood filters combine with OR logic

import { useEffect, useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods,    setSelHoods]    = useState([]);
  const [address, setAddress]         = useState('');
  const [driveTimes, setDriveTimes]   = useState({});
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);

  /* ─── Fetch data ─── */
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  /* ─── Option lists ─── */
  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants]);
  const allHoods    = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants]);

  /* ─── Drive‑time fetch ─── */
  const fetchDriveTimes = async () => {
    if (!address.trim() || !GMAPS_KEY) return;
    const geo = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GMAPS_KEY}`).then(r => r.json());
    const loc = geo.results?.[0]?.geometry?.location;
    if (!loc) { alert('Address not found'); return; }

    const dests = restaurants.map(r => `${r.latitude},${r.longitude}`).join('|');
    const url   = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${loc.lat},${loc.lng}&destinations=${dests}&units=imperial&key=${GMAPS_KEY}`;
    const dm    = await fetch(url).then(r => r.json());
    const vals  = dm.rows?.[0]?.elements || [];
    const map   = {};
    vals.forEach((el, idx) => { if (el.status === 'OK') map[restaurants[idx].id] = el.duration.value; });
    setDriveTimes(map);
  };

  /* ─── Filter + OR logic ─── */
  const filteredSorted = useMemo(() => {
    let list = restaurants;

    // when at least one filter exists, keep items that match ANY selected cuisine OR neighbourhood
    if (selCuisines.length || selHoods.length) {
      list = list.filter(r => {
        const cuisineMatch = selCuisines.length && (r.cuisines || []).some(c => selCuisines.includes(c));
        const hoodMatch    = selHoods.length && selHoods.includes(r.neighborhood);
        return cuisineMatch || hoodMatch;
      });
    }

    if (Object.keys(driveTimes).length) {
      list = [...list].sort((a, b) => (driveTimes[a.id] ?? 1e9) - (driveTimes[b.id] ?? 1e9));
    }
    return list;
  }, [restaurants, selCuisines, selHoods, driveTimes]);

  const hasFilters = Boolean(selCuisines.length || selHoods.length);
  const clearAll   = () => { setSelCuisines([]); setSelHoods([]); setDriveTimes({}); setAddress(''); };

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-12 text-[#F2F2F2] font-mono">
      <h1 className="text-5xl font-bold uppercase tracking-tight mb-10">L.A. Restaurant Recommendations</h1>

      {/* Filter section */}
      <section className="sticky top-0 z-40 mb-10 bg-[#0D0D0D] border-t border-b border-[#3A3A3A] py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          <MultiSelectFilter
            options={allCuisines}
            value={selCuisines}
            onChange={setSelCuisines}
            placeholder="Add cuisine…"
            inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white"
          />
          <MultiSelectFilter
            options={allHoods}
            value={selHoods}
            onChange={setSelHoods}
            placeholder="Pick a neighbourhood"
            inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white"
          />
          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-bold text-red-500 underline">Clear all</button>
          )}
        </div>

        {/* Address input */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Enter your address to sort by drive time"
            className="w-full bg-transparent border border-[#3A3A3A] px-4 py-3 text-[#F2F2F2] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            onClick={fetchDriveTimes}
            disabled={!address.trim() || loading}
            className="bg-white text-black font-bold px-6 py-3 uppercase text-sm tracking-wide hover:bg-[#3A3A3A] disabled:opacity-30"
          >
            Calculate
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filteredSorted.length} restaurant${filteredSorted.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* Restaurant cards */}
      {filteredSorted.length === 0 && !loading ? (
        <p className="text-gray-500">No restaurants match those filters.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredSorted.map(r => {
            const dur = driveTimes[r.id];
            return (
              <li key={r.id} className="border border-[#2A2A2A] p-6 bg-[#73655D] hover:bg-[#5E4F47] transition">
                <h2 className="text-2xl font-bold uppercase mb-2 text-[#F2F2F2]">{r.name}</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(r.cuisines || []).map(c => (
                    <span key={c} className="px-2 py-0.5 text-xs font-semibold uppercase" style={{ background: '#592025', color: '#F2F2F2' }}>{c}</span>
                  ))}
                </div>
                {r.neighborhood && <p className="text-xs" style={{ color: '#40211E' }}>{r.neighborhood}</p>}
                {dur && <p className="text-xs text-green-400 font-mono mt-1">Drive: {Math.round(dur / 60)} min</p>}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
