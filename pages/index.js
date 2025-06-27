/**
 * Main page – lists restaurants with chip-based cuisine & neighbourhood filters.
 * – Data source: /api/restaurants
 * – UI libs : vanilla React + Tailwind (no extra deps)
 */
import { useState, useMemo } from 'react';
import MultiSelectFilter from '../components/MultiSelectFilter'; // generic chip filter
import useRestaurants    from '../hooks/useRestaurants';        // custom data hook

export default function Home() {
  /* ───────── data fetch ───────── */
  const { data: restaurants = [], error, loading } = useRestaurants();

  /* ───────── derived option lists ───────── */
  const allCuisines   = useMemo(
    () => uniq(restaurants.flatMap(r => r.cuisines || [])).sort(),
    [restaurants]
  );
  const allHoods     = useMemo(
    () => uniq(restaurants.map(r => r.neighborhood).filter(Boolean)).sort(),
    [restaurants]
  );

  /* ───────── local filter state ───────── */
  const [selCuisines, setSelCuisines] = useState([]);
  const [selHoods,    setSelHoods]    = useState([]);

  /* ───────── filtered dataset (OR on cuisine, AND on hood) ───────── */
  const filtered = useMemo(() => {
    let list = restaurants;
    if (selCuisines.length)
      list = list.filter(r => (r.cuisines || []).some(c => selCuisines.includes(c)));
    if (selHoods.length)
      list = list.filter(r => selHoods.includes(r.neighborhood));
    return list;
  }, [restaurants, selCuisines, selHoods]);

  /* ───────── render ───────── */
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <h1 className="mb-6 text-3xl font-bold">L.A. Restaurant Recommendations</h1>

      {/* ---------- sticky filter row ---------- */}
      <section className="sticky top-0 z-20 mb-6 space-y-3 border-b bg-white/95 py-4 shadow-sm backdrop-blur">
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
          {(selectedCuisines.length > 0 || selectedHoods.length > 0) && (
  <button
    onClick={() => { setSelCuisines([]); setSelHoods([]); }}
    className="ml-auto text-sm font-medium text-rose-600 hover:underline"
  >
    Clear all
  </button>
)}

        </div>
        <p className="text-sm text-neutral-600">
          {loading ? 'Loading…' :
           error   ? 'Error loading restaurants.' :
           `Showing ${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </section>

      {/* ---------- results ---------- */}
      {filtered.length === 0 && !loading ? (
        <p className="mt-6 text-neutral-600">No restaurants match those filters.</p>
      ) : (
        <ul className="grid gap-5">
          {filtered.map(r => (
            <li key={r.id} className="rounded-lg border bg-neutral-50 p-4 shadow-sm">
              <h2 className="text-xl font-semibold">{r.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {(r.cuisines || []).map(c => (
                  <span key={c} className="pill">{c}</span>
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

/* ---------- helpers ---------- */
const uniq = arr => [...new Set(arr)];
