// Tailwind-based Bauhaus-style clean UI
// Swaps out glassmorphism for flat color blocks and bold modernist contrast

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
    <main className="relative min-h-screen bg-yellow-100 px-4 py-8 text-black">
      <h1 className="mb-6 text-4xl font-bold text-blue-900">L.A. Restaurant Recommendations</h1>

      {/* Bauhaus Filter Bar */}
      <section className="sticky top-0 z-30 mb-8 rounded-lg border border-gray-300 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <MultiSelectFilter
            options={allCuisines}
            value={selCuisines}
            onChange={setSelCuisines}
            placeholder="Add cuisine…"
            inputClassName="text-black placeholder-gray-500"
          />
          <MultiSelectFilter
            options={allHoods}
            value={selHoods}
            onChange={setSelHoods}
            placeholder="Pick a neighbourhood"
            inputClassName="text-black placeholder-gray-500"
          />
          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto text-sm font-semibold text-red-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {loading
            ? 'Loading…'
            : error
              ? 'Error loading restaurants.'
              : `Showing ${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* Card list */}
      {filtered.length === 0 && !loading ? (
        <p className="text-gray-600">No restaurants match those filters.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(r => (
            <li
              key={r.id}
              className="rounded-lg border border-gray-300 bg-white p-5 shadow-md hover:bg-gray-50 transition"
            >
              <h2 className="text-xl font-semibold text-blue-800">{r.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {(r.cuisines || []).map(c => (
                  <span
                    key={c}
                    className="rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
              {r.neighborhood && (
                <p className="mt-2 text-sm text-gray-700">
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
