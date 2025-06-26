import { useEffect, useState } from 'react';
import CuisineFilter from '../components/CuisineFilter';

export default function Home() {
  const [restaurants, setRestaurants]   = useState([]);
  const [selectedCuisines, setSelected] = useState([]);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then(setRestaurants);
  }, []);

  const allCuisines = Array.from(
  new Set(
    (Array.isArray(restaurants) ? restaurants : [])      // ✅ guard
      .flatMap(r => r.cuisines || [])
  )
).sort();

  const filtered = selectedCuisines.length
    ? restaurants.filter(r =>
        (r.cuisines || []).some(c => selectedCuisines.includes(c))
                        )
    : restaurants;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <h1 className="mb-4 text-3xl font-bold">
        L.A. Restaurant Recommendations
      </h1>

      <div className="sticky top-0 z-10 bg-white py-4 mb-6 border-b border-neutral-200 shadow-sm">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <CuisineFilter
      allCuisines={allCuisines}
      selected={selectedCuisines}
      onChange={setSelected}
    />

    {selectedCuisines.length > 0 && (
      <button
        onClick={() => setSelected([])}
        className="text-sm font-medium text-rose-600 hover:underline"
      >
        Clear all
      </button>
    )}
  </div>

  <p className="mt-2 text-sm text-neutral-600">
    Showing {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
  </p>
</div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-neutral-600">
          No restaurants match those cuisines.
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
                  Neighborhood: {r.neighborhood}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
