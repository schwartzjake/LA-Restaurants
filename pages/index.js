import { useEffect, useState } from 'react';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
  async function loadData() {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    setRestaurants(data);
  }

  loadData();
}, []);

  const filtered = filter.trim()
  ? restaurants.filter((r) =>
      Array.isArray(r.cuisines) &&
      r.cuisines.some((c) =>
        c.toLowerCase().includes(filter.toLowerCase())
      )
    )
  : restaurants;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Restaurant Recommendations</h1>
      <input
  placeholder="Filter by cuisine (e.g., Thai)"
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
  style={{
    padding: '0.5rem',
    marginBottom: '1rem',
    width: '100%',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px'
  }}
/>
      <ul>
        {filtered.map((r) => (
          <li key={r.id} style={{ marginBottom: '1rem' }}>
  <strong>{r.name}</strong><br />
  <span>
    <em>{r.cuisines?.join(', ') || 'No cuisines listed'}</em>
    {r.neighborhood ? ` — ${r.neighborhood}` : ''}
  </span>
</li>
        ))}
      </ul>
    </div>
  );
}
