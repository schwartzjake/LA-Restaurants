/**
 * Main UI
 * -------
 * One sticky filter row (cuisine + neighbourhood) above a card grid.
 */

import { useEffect, useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter';

export default function Home() {
  /* ─── State ─────────────────────────────────────── */
  const [restaurants, setRestaurants]   = useState([]);
  const [selCuisines, setSelCuisines]   = useState([]);
  const [selHoods,    setSelHoods]      = useState([]);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(true);

  /* ─── Fetch once on mount ───────────────────────── */
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setRestaurants)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  /* ─── Build distinct option lists ───────────────── */
  const allCuisines = useMemo(
    () => [...new Set(restaurants.flatMap(r => r.cuisines || []))].sort(),
    [restaurants]
  );

  const allHoods = useMemo(
    () => [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort(),
    [restaurants]
  );

  /* ─── Filtered data (OR on cuisine, AND on hood) ── */
  const filtered = useMemo(() => {
    let list = restaurants;

    if (selCuisines.length) {
      list = list.filter(r =>
        (r.cuisines || []).some(c => selCuisines.includes(c))
      );
    }
    if (selHoods.length) {
      list = list.filter(r => selHoods.includes(r.neighborhood));
    }
    return list;
  }, [restaurants, selCuisines, selHoods]);

  /* ─── Helpers ───────────────────────────────────── */
  const clearAll = () => { setSelCuisines([]); setSelHoods([]); };
  const hasFilters = Boolean(selCuisines.length || selHoods.length);

  /* ─── Render ────────────────────────────────────── */
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <h1 className="mb-6 text-3xl font-bold">L.A. Restaurant Recommendations</h1>

      {/* Sticky filter bar */}
      <section className="sticky top-0 z-20 mb-8 border-b bg-white/95 py-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <MultiSelectFilter
            options={allCuisines}
            value={selCuisines}
            onChange={setSelCuisines}
            placeholder="Select Cuisine(s)"
          />
          <MultiSelectFilter
            options={allHoods}
            value={selHoods}
            onChange={setSelHoods}
            placeholder="Pick a Neighborhood"
          />

          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto text-sm font-medium text-rose-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-neutral-600">
          {loading
            ? 'Loading…'
            : error
              ? 'Error loading restaurants.'
              : `Showing ${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`
          }
        </p>
      </section>

      {/* Card grid */}
      {filtered.length === 0 && !loading ? (
        <p className="mt-6 text-neutral-600">No restaurants match those filters.</p>
      ) : (
        <ul className="grid gap-5">
          {filtered.map(r => (
            <li key={r.id} className="rounded-lg border bg-neutral-50 p-4 shadow-sm">
              <h2 className="text-xl font-semibold">{r.name}</h2>

              <div className="mt-2 flex flex-wrap gap-2">
                {(r.cuisines || []).map(c => (
                  <span
                    key={c}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-900"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {r.neighborhood && (
                <p className="mt-1 text-sm text-neutral-600">
                  Neighbourhood&nbsp;•&nbsp;{r.neighborhood}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
