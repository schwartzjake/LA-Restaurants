import { useEffect, useState } from 'react';
import CuisineFilter from '../components/CuisineFilter';

export default function Home() {
const [restaurants, setRestaurants]       = useState([]);
const [selectedCuisines, setSelected]     = useState([]); // <- array of chosen tags

  useEffect(() => {
  async function loadData() {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    const allCuisines = Array
  .from(
    new Set(
      restaurants.flatMap(r => r.cuisines || [])
    )
  )
  .sort();
    setRestaurants(data);
  }

  loadData();
}, []);

  const filtered = selectedCuisines.length
  ? restaurants.filter(r =>
      selectedCuisines.every(c => (r.cuisines || []).includes(c))
    )
  : restaurants;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Restaurant Recommendations</h1>
      <CuisineFilter
  allCuisines={allCuisines}
  selected={selectedCuisines}
  onChange={setSelected}
/>
      <ul>
  {filtered.map((r) => (
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
