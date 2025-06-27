// Godly-style site with brutalist flair
// Adds a separate “Reset address” icon that clears only the address input + drive‑time map.
// Geocodes restaurant addresses on demand using Nominatim (OpenStreetMap)

import { useEffect, useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';
import { XCircle } from 'lucide-react';

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods, setSelHoods] = useState([]);
  const [address, setAddress] = useState('');
  const [driveTimes, setDriveTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const allCuisines = useMemo(() => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(), [restaurants]);
  const allHoods = useMemo(() => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(), [restaurants]);

  async function geocodeAddress(addr) {
    const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`, {
      headers: { 'User-Agent': 'MyRestaurantGeocoder/1.0 (email@example.com)' }
    }).then(r => r.json());
    return geo[0] ? { lat: +geo[0].lat, lng: +geo[0].lon } : null;
  }

  const fetchDriveTimes = async () => {
    if (!address.trim() || !ORS_KEY) return;
    const origin = await geocodeAddress(address);
    if (!origin) { alert('Address not found'); return; }

    const coords = restaurants.filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
    if (!coords.length) { alert('No valid restaurant coordinates'); return; }

    const CHUNK_SIZE = 50;
    const chunks = Array.from({ length: Math.ceil(coords.length / CHUNK_SIZE) }, (_, i) =>
      coords.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    );

    const allDurations = {};
    for (const chunk of chunks) {
      const locations = [[origin.lng, origin.lat], ...chunk.map(r => [r.longitude, r.latitude])];
      const body = JSON.stringify({ locations, metrics: ['duration'], units: 'm' });

      const res = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
        method: 'POST',
        headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
        body
      }).then(r => r.json());

      if (res.error) {
        console.error(res.error);
        alert(res.error.message);
        return;
      }

      const durations = res.durations?.[0] || [];
      durations.slice(1).forEach((sec, i) => {
        allDurations[chunk[i].id] = sec;
      });

      await new Promise(res => setTimeout(res, 1000)); // throttle
    }

    setDriveTimes(allDurations);
  };

  const filteredSorted = useMemo(() => {
    let list = restaurants;
    if (selCuisines.length || selHoods.length) {
      list = list.filter(r => {
        const cuisineMatch = selCuisines.length && (r.cuisines || []).some(c => selCuisines.includes(c));
        const hoodMatch = selHoods.length && selHoods.includes(r.neighborhood);
        return cuisineMatch || hoodMatch;
      });
    }
    if (Object.keys(driveTimes).length) {
      list = [...list].sort((a, b) => (driveTimes[a.id] ?? 1e9) - (driveTimes[b.id] ?? 1e9));
    }
    return list;
  }, [restaurants, selCuisines, selHoods, driveTimes]);

  const hasFilters = Boolean(selCuisines.length || selHoods.length);
  const clearAll = () => {
    setSelCuisines([]);
    setSelHoods([]);
    setDriveTimes({});
  };

  const clearAddress = () => {
    setAddress('');
    setDriveTimes({});
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-12 text-[#F2F2F2] font-mono">
      <h1 className="text-5xl font-bold uppercase tracking-tight mb-10">L.A. Restaurant Recommendations</h1>

      <section className="sticky top-0 z-40 mb-10 bg-[#0D0D0D] border-t border-b border-[#3A3A3A] py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          <MultiSelectFilter
            options={allCuisines}
            value={selCuisines}
            onChange={setSelCuisines}
            placeholder="Cuisine(s)"
            inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white"
          />
          <MultiSelectFilter
            options={allHoods}
            value={selHoods}
            onChange={setSelHoods}
            placeholder="Neighborhood(s)"
            inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-[#3A3A3A] focus:border-white"
          />
          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-bold text-red-500 underline">Clear all</button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6 items-center">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') fetchDriveTimes(); }}
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
          {address.trim() && (
            <button onClick={clearAddress} className="text-red-500 hover:text-red-400">
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {loading ? 'Loading…' : error ? 'Error loading restaurants.' : `Showing ${filteredSorted.length} restaurant${filteredSorted.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* results grid omitted for brevity */}
    </main>
  );
}
