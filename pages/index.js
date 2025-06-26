// pages/index.js
import { useEffect, useState } from 'react';
import CuisineFilter from '../components/CuisineFilter';

export default function Home() {
  /* ───────── state ───────── */
  const [restaurants, setRestaurants]   = useState([]);
  const [selectedCuisines, setSelected] = useState([]);

  /* ───────── fetch once ───────── */
  useEffect(() => {
    async function load() {
      const res  = await fetch('/api/restaurants');
      const data = await res.json();
      setRestaurants(data);
      console.log(restaurants.length)
    }
    load();
  }, []);

  /* ───────── helper lists ───────── */
  const allCuisines = Array.from(
    new Set(restaurants.flatMap(r => r.cuisines || []))
  ).sort();

  const filtered = selectedCuisines.length
    ? restaurants.filter(r =>
        selectedCuisines.every(c => (r.cuisines || []).includes(c))
      )
    : restaurants;

  /* ───────── render ───────── */
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Restaurant Recommendations</h1>

      <CuisineFilter
        allCuisines={allCuisines}
        selected={selectedCuisines}
        onChange={setSelected}
      />

      <ul style={{ padding: 0, listStyle: 'none' }}>
        {filtered.map(r => (
          <li key={r.id} style={{ marginBottom: '1rem' }}>
            <strong>{r.name}</strong><br />
            <em>{(r.cuisines || []).join(', ')}</em>
            {r.neighborhood ? ` — ${r.neighborhood}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
