// Tailwind‑based Bauhaus UI **with drive‑time sorting**
// Adds an address bar that geocodes the user input and sorts cards by Google
// Distance Matrix driving time.  Requires `NEXT_PUBLIC_GOOGLE_MAPS_KEY` env var.

import { useEffect, useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default function Home() {
  /* ───────── core data ───────── */
  const [restaurants, setRestaurants] = useState([]);           // full data
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods,    setSelHoods]    = useState([]);

  /* drive‑time state */
  const [address, setAddress]         = useState('');           // user input
  const [driveTimes, setDriveTimes]   = useState({});          // id → seconds
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);

  /* ───────── fetch Airtable ───────── */
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  /* ───────── unique option lists ───────── */
  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines||[]))].sort(), [restaurants]);
  const allHoods   = useMemo(() => [...new Set(restaurants.map(r=>r.neighborhood).filter(Boolean))].sort(), [restaurants]);

  /* ───────── handle drive‑time fetch ───────── */
  const fetchDriveTimes = async () => {
    if (!address.trim() || !GMAPS_KEY) return;

    // 1. geocode the user address
    const geo = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GMAPS_KEY}`).then(r=>r.json());
    const loc = geo.results?.[0]?.geometry?.location;
    if (!loc) return alert('Address not found');

    // 2. build destinations string (lat,lng|lat,lng|…)
    const dests = restaurants.map(r => `${r.latitude},${r.longitude}`).join('|');
    const url   = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${loc.lat},${loc.lng}&destinations=${dests}&units=imperial&key=${GMAPS_KEY}`;
    const dm    = await fetch(url).then(r=>r.json());
    const vals  = dm.rows?.[0]?.elements || [];
    const map   = {};
    vals.forEach((el, idx) => { if (el.status==='OK') map[restaurants[idx].id] = el.duration.value; });
    setDriveTimes(map);
  };

  /* ───────── filtered + sorted list ───────── */
  const filteredSorted = useMemo(() => {
    let list = restaurants;
    if (selCuisines.length)
      list = list.filter(r => (r.cuisines||[]).some(c=>selCuisines.includes(c)));
    if (selHoods.length)
      list = list.filter(r => selHoods.includes(r.neighborhood));

    // sort by drive time if we have data
    if (Object.keys(driveTimes).length)
      list = [...list].sort((a,b)=>(driveTimes[a.id]??1e9)-(driveTimes[b.id]??1e9));

    return list;
  }, [restaurants, selCuisines, selHoods, driveTimes]);

  const hasFilters = Boolean(selCuisines.length || selHoods.length);
  const clearAll   = () => { setSelCuisines([]); setSelHoods([]); setDriveTimes({}); setAddress(''); };

  /* ───────── render ───────── */
  return (
    <main className="relative min-h-screen bg-yellow-100 px-4 py-8 text-black font-sans">
      <h1 className="mb-6 text-4xl font-extrabold text-blue-900 tracking-tight uppercase">L.A. Restaurant Recommendations</h1>

      {/* Filter Bar */}
      <section className="sticky top-0 z-30 mb-4 rounded-lg border-4 border-black bg-yellow-50 p-4 shadow-md space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <MultiSelectFilter options={allCuisines} value={selCuisines} onChange={setSelCuisines} placeholder="Add cuisine…" inputClassName="text-black placeholder-gray-500 border-b-2 border-red-600 focus:border-red-800" />
          <MultiSelectFilter options={allHoods}   value={selHoods}    onChange={setSelHoods}    placeholder="Pick a neighbourhood" inputClassName="text-black placeholder-gray-500 border-b-2 border-blue-600 focus:border-blue-800" />
          {hasFilters && (
            <button onClick={clearAll} className="ml-auto text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Clear all</button>
          )}
        </div>

        {/* Address bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="text"
            value={address}
            onChange={e=>setAddress(e.target.value)}
            placeholder="Enter your address to sort by drive time"
            className="flex-1 rounded border-2 border-black px-3 py-2 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          <button
            onClick={fetchDriveTimes}
            disabled={!address.trim() || loading}
            className="w-full md:w-auto bg-blue-700 text-white font-bold px-4 py-2 rounded disabled:opacity-40"
          >
            Calculate
          </button>
        </div>

        <p className="text-sm text-gray-800 font-medium pt-1">
          {loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filteredSorted.length} restaurant${filteredSorted.length!==1?'s':''}`}
        </p>
      </section>

      {/* Cards */}
      {filteredSorted.length===0 && !loading ? (
        <p className="text-gray-800">No restaurants match those filters.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSorted.map(r=>{
            const dur=driveTimes[r.id];
            return (
              <li key={r.id} className="rounded-lg border-4 border-black bg-white p-5 shadow-md hover:bg-gray-100 transition flex flex-col space-y-2">
                <h2 className="text-xl font-extrabold text-blue-900 uppercase tracking-wide">{r.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {(r.cuisines||[]).map(c=>(<span key={c} className="rounded-full bg-red-500 text-white px-3 py-1 text-xs font-bold uppercase">{c}</span>))}
                </div>
                {r.neighborhood && <p className="text-sm font-semibold">Neighbourhood: {r.neighborhood}</p>}
                {dur && <p className="text-sm text-green-700 font-bold">Drive: {Math.round(dur/60)} min</p>}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
