// Tailwind-based Apple-style glassmorphism UI
// This component replaces the main filter + card layout in your Next.js site

import { useEffect, useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods, setSelHoods] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const allCuisines = useMemo(
    () => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(),
    [restaurants]
  );
  const allHoods = useMemo(
    () => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(),
    [restaurants]
  );

  const filtered = useMemo(() => {
    let list = restaurants;
    if (selCuisines.length)
      list = list.filter(r => (r.cuisines || []).some(c => selCuisines.includes(c)));
    if (selHoods.length)
      list = list.filter(r => selHoods.includes(r.neighborhood));
    return list;
  }, [restaurants, selCuisines, selHoods]);

  const clearAll = () => { setSelCuisines([]); setSelHoods([]); };
  const hasFilters = Boolean(selCuisines.length || selHoods.length);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-gray-900 px-4 py-8 text-white">
      <h1 className="mb-6 text-4xl font-bold text-white drop-shadow-md">L.A. Restaurant Recommendations</h1>

      {/* Glassy Filter Bar */}
      <section className="sticky top-0 z-30 mb-8 rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <MultiSelectFilter
            options={allCuisines}
            value={selCuisines}
            onChange={setSelCuisines}
            placeholder="Add cuisine…"
          />
          <MultiSelectFilter
            options={allHoods}
            value={selHoods}
            onChange={setSelHoods}
            placeholder="Pick a neighbourhood"
          />
          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto text-sm font-semibold text-rose-300 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-white/70">
          {loading
            ? 'Loading…'
            : error
              ? 'Error loading restaurants.'
              : `Showing ${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* Card list */}
      {filtered.length === 0 && !loading ? (
        <p className="text-white/70">No restaurants match those filters.</p>
      ) : (
        <ul className="grid gap-6">
          {filtered.map(r => (
            <li
              key={r.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md hover:bg-white/10 transition"
            >
              <h2 className="text-xl font-semibold text-white drop-shadow-sm">{r.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {(r.cuisines || []).map(c => (
                  <span
                    key={c}
                    className="rounded-full bg-emerald-200/20 px-2 py-0.5 text-sm text-emerald-100"
                  >
                    {c}
                  </span>
                ))}
              </div>
              {r.neighborhood && (
                <p className="mt-2 text-sm text-white/60">
                  Neighbourhood • {r.neighborhood}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
