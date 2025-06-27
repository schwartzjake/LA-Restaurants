// pages/index.js
import { useEffect, useMemo, useState } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';
import RestaurantGrid from '../components/RestaurantGrid';

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export default function Home() {
  /* ---------- state ---------- */
  const [restaurants, setRestaurants] = useState([]);
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods, setSelHoods] = useState([]);
  const [address, setAddress] = useState('');
  const [driveTimes, setDriveTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  /* ---------- helpers ---------- */
  const badge = s =>
    s <= 1200 ? 'text-green-400' : s <= 2100 ? 'text-yellow-400' : 'text-red-500';

  /* ---------- fetch restaurants ---------- */
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  /* ---------- option lists ---------- */
  const allCuisines = useMemo(
    () => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(),
    [restaurants]
  );
  const allHoods = useMemo(
    () => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(),
    [restaurants]
  );

  /* ---------- filter + sort ---------- */
  const filtered = useMemo(() => {
    let list = restaurants;
    if (selCuisines.length || selHoods.length) {
      list = list.filter(
        r =>
          (selCuisines.length &&
            (r.cuisines || []).some(c => selCuisines.includes(c))) ||
          (selHoods.length && selHoods.includes(r.neighborhood))
      );
    }
    if (Object.keys(driveTimes).length)
      list = [...list].sort(
        (a, b) => (driveTimes[a.id] ?? 1e9) - (driveTimes[b.id] ?? 1e9)
      );
    return list;
  }, [restaurants, selCuisines, selHoods, driveTimes]);

  /* ---------- UI handlers ---------- */
  const clearFilters = () => {
    setSelCuisines([]);
    setSelHoods([]);
    setDriveTimes({});
  };
  const clearAddress = () => {
    setAddress('');
    setDriveTimes({});
  };

  /* ---------- render ---------- */
  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-12 text-[#F2F2F2] font-mono">
      {/* …Filter bar, address bar, Calculate button—UNCHANGED… */}

      {/* results */}
      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : error ? (
        <p className="text-red-500">Error loading restaurants.</p>
      ) : (
        <RestaurantGrid list={filtered} driveTimes={driveTimes} badge={badge} />
      )}
    </main>
  );
}
