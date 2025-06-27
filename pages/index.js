// Godly‑style site with brutalist flair
// • Calculate button fixed with dedicated `calculating` state
// • Separate Reset‑Address icon (inline SVG)
// • Drive‑time colours: 0‑20 min → green, 21‑35 min → yellow, 36 + min → red
// • Suppress stray “0” by hiding 0‑sec drive times
// • Full results grid intact

import { useEffect, useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods, setSelHoods] = useState([]);
  const [address, setAddress] = useState('');
  const [driveTimes, setDriveTimes] = useState({});
  const [loading, setLoading] = useState(true);   // initial data load
  const [calculating, setCalculating] = useState(false); // distance calc state
  const [error, setError] = useState(null);

  // ───────────────────────────────────── fetch Airtable data once
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // ───────────────────────────────────── option lists
  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants]);
  const allHoods    = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants]);

  // ───────────────────────────────────── helper: geocode user address
  async function geocode(addr) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'LA-Rest-Geocoder/1.0 (contact@example.com)' } }).then(r => r.json());
    return res[0] ? { lat: +res[0].lat, lng: +res[0].lon } : null;
  }

  // ───────────────────────────────────── distance matrix via ORS
  const fetchDriveTimes = async () => {
    if (!address.trim() || !ORS_KEY || calculating) return;
    setCalculating(true);
    try {
      const origin = await geocode(address);
      if (!origin) { alert('Address not found'); return; }

      const coords = restaurants.filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
      if (!coords.length) { alert('No valid restaurant coordinates'); return; }

      const CHUNK = 40;
      const chunks = Array.from({ length: Math.ceil(coords.length / CHUNK) }, (_, i) => coords.slice(i * CHUNK, (i + 1) * CHUNK));

      const map = {};
      for (const c of chunks) {
        const body = JSON.stringify({
          locations: [[origin.lng, origin.lat], ...c.map(r => [r.longitude, r.latitude])],
          metrics: ['duration'], units: 'm'
        });
        const res = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
          method: 'POST', headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' }, body
        }).then(r => r.json());
        if (res.error) { console.error(res.error); alert(res.error.message); return; }
        (res.durations?.[0] || []).slice(1).forEach((sec, i) => { map[c[i].id] = sec; });
        await new Promise(r => setTimeout(r, 800)); // polite throttle
      }
      setDriveTimes(map);
    } finally {
      setCalculating(false);
    }
  };

  // ───────────────────────────────────── filtering + sorting
  const filteredSorted = useMemo(() => {
    let list = restaurants;
    if (selCuisines.length || selHoods.length) {
      list = list.filter(r => {
        const cuisineOk = selCuisines.length && (r.cuisines || []).some(c => selCuisines.includes(c));
        const hoodOk    = selHoods.length && selHoods.includes(r.neighborhood);
        return cuisineOk || hoodOk;
      });
    }
    if (Object.keys(driveTimes).length) list = [...list].sort((a, b) => (driveTimes[a.id] ?? 9e9) - (driveTimes[b.id] ?? 9e9));
    return list;
  }, [restaurants, selCuisines, selHoods, driveTimes]);

  // ───────────────────────────────────── ui helpers
  const clearFilters  = () => { setSelCuisines([]); setSelHoods([]); setDriveTimes({}); };
  const clearAddress  = () => { setAddress(''); setDriveTimes({}); };
  const hasFilters    = selCuisines.length || selHoods.length;

  const colorForSecs = s => {
    if (s <= 1200) return 'text-green-400';   // 0‑20 min
    if (s <= 2100) return 'text-yellow-400';  // 21‑35 min
    return 'text-red-500';                    // 36+ min
  };

  // ───────────────────────────────────── render
  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-12 text-[#F2F2F2] font-mono">
      <h1 className="text-5xl font-bold uppercase tracking-tight mb-10">L.A. Restaurant Recommendations</h1>

      {/* ─── Filter bar ─── */}
      <section className="sticky top-0 z-40 mb-10 bg-[#0D0D0D] border-y border-[#3A3A3A] py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          <MultiSelectFilter options={allCuisines} value={selCuisines} onChange={setSelCuisines} placeholder="Add cuisine…" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" />
          <MultiSelectFilter options={allHoods}    value={selHoods}    onChange={setSelHoods}    placeholder="Pick a neighbourhood" inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white" />
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm font-bold text-red-500 underline">Clear all</button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6 items-center">
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchDriveTimes()} placeholder="Enter your address to sort by drive time" className="w-full bg-transparent border border-[#3A3A3A] px-4 py-3 text-[#F2F2F2] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white" />
          <button onClick={fetchDriveTimes} disabled={!address.trim() || calculating} className="bg-white text-black font-bold px-6 py-3 uppercase text-sm tracking-wide hover:bg-[#3A3A3A] disabled:opacity-30">
            {calculating ? 'Calculating…' : 'Calculate'}
          </button>
          {address.trim() && (
            <button onClick={clearAddress} className="text-red-500 hover:text-red-400" title="Clear address">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M6 6l12 12M6 18L18 6" /></svg>
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filteredSorted.length} restaurant${filteredSorted.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* ─── Results grid ─── */}
      {filteredSorted.length === 0 && !loading ? (
        <p className="text-gray-500">No restaurants match those filters.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredSorted.map(r => {
            const secs = driveTimes[r.id];
            return (
              <li key={
