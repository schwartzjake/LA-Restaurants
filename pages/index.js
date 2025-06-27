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
    <main className="relative min-h-screen bg-yellow-100 px-4 py-8 text-black font-sans">
      <h1 className="mb-6 text-4xl font-extrabold text-blue-900 tracking-tight uppercase">L.A. Restaurant Recommendations</h1>

      {/* Bauhaus Filter Bar */}
      <section className="sticky top-0 z-30 mb-8 rounded-lg border-4 border-black bg-yellow-50 p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <MultiSelectFilter
            options={allCuisines}
            value={selCuisines}
            onChange={setSelCuisines}
            placeholder="Add cuisine…"
            inputClassName="text-black placeholder-gray-500 border-b-2 border-red-600 focus:border-red-800"
          />
          <MultiSelectFilter
            options={allHoods}
            value={selHoods}
            onChange={setSelHoods}
            placeholder="Pick a neighbourhood"
            inputClassName="text-black placeholder-gray-500 border-b-2 border-blue-600 focus:border-blue-800"
          />
          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-800 font-medium">
          {loading
            ? 'Loading…'
            : error
              ? 'Error loading restaurants.'
              : `Showing ${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* Card list */}
      {filtered.length === 0 && !loading ? (
        <p className="text-gray-800">No restaurants match those filters.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(r => (
            <li
              key={r.id}
              className="rounded-lg border-4 border-black bg-white p-5 shadow-md hover:bg-gray-100 transition flex flex-col justify-between"
            >
              <h2 className="text-xl font-extrabold text-blue-900 uppercase tracking-wide mb-2">{r.name}</h2>
              <div className="flex flex-wrap gap-2 mb-2">
                {(r.cuisines || []).map(c => (
                  <span
                    key={c}
                    className="rounded-full bg-red-500 text-white px-3 py-1 text-xs font-bold uppercase"
                  >
                    {c}
                  </span>
                ))}
              </div>
              {r.neighborhood && (
                <p className="mt-auto text-sm text-gray-700 font-semibold">
                  Neighbourhood: {r.neighborhood}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
