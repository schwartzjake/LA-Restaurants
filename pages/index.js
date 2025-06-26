import { useEffect, useState } from 'react';
import CuisineFilter      from '../components/CuisineFilter';
import NeighborhoodFilter from '../components/NeighborhoodFilter';

export default function Home() {
  /* ── state ──────────────────────────────────────────────── */
  const [restaurants,      setRestaurants]   = useState([]);
  const [selectedCuisines, setSelected]      = useState([]);
  const [selectedHoods,    setHoods]         = useState([]);

  /* ── fetch once ─────────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then(setRestaurants);
  }, []);

  /* ── build option lists ─────────────────────────────────── */
  const allCuisines = Array.from(
    new Set(
      (Array.isArray(restaurants) ? restaurants : [])
        .flatMap(r => r.cuisines || [])
    )
  ).sort();

  const allHoods = Array.from(
    new Set(restaurants.map(r => r.neighborhood).filter(Boolean))
  ).sort();

  /* ── apply filters (OR for cuisines + optional neighbourhood) ─ */
  let filtered = restaurants;

  if (selectedCuisines.length) {
    filtered = filtered.filter(r =>
      (r.cuisines || []).some(c => selectedCuisines.includes(c))
    );
  }

  if (selectedHoods.length) {
    filtered = filtered.filter(r =>
      selectedHoods.includes(r.neighborhood)
    );
  }

  /* ── render ─────────────────────────────────────────────── */
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <h1 className="mb-6 text-3xl font-bold">
        L.A. Restaurant Recommendations
      </h1>

      {/* ─────────── SINGLE STICKY FILTER BAR ─────────── */}
      <div className="sticky top-0 z-20 mb-8 border-b border-neutral-200 bg-white/95 backdrop-blur py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          {/* cuisine chips */}
          <CuisineFilter
            options={allCuisines}
            value={selectedCuisines}
            onChange={setSelected}
            placeholder="Select a cuisine"
          />

          {/* neighbourhood chips */}
          <NeighborhoodFilter
            options={allHoods}
            value={selectedHoods}
            onChange={setHoods}
            placeholder="Pick a neighborhood"
          />

          {/* clear buttons */}
          {(selectedCuisines.length > 0 || selectedHoods.length > 0) && (
            <button
              onClick={() => { setSelected([]); setHoods([]); }}
              className="ml-auto text-sm font-medium text-rose-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-neutral-600">
          Showing {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ─────────── LIST ─────────── */}
      {filtered.length === 0 ? (
        <p className="mt-6 text-neutral-600">
          No restaurants match those filters.
        </p>
      ) : (
        <div className="grid gap-5">
          {filtered.map(r => (
            <article
              key={r.id}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-sm"
            >
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
                  Neighbourhood:&nbsp;{r.neighborhood}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
