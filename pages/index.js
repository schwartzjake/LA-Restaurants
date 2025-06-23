import { useEffect, useState } from 'react';
import { fetchRestaurants } from '../lib/airtable';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchRestaurants().then(setRestaurants);
  }, []);

  const filtered = filter
    ? restaurants.filter((r) =>
        r.cuisines?.some((c) =>
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
        style={{ padding: '0.5rem', marginBottom: '1rem', width: '100%' }}
      />
      <ul>
        {filtered.map((r) => (
          <li key={r.id}>
            <strong>{r.name}</strong> — {r.cuisines?.join(', ')} — {r.neighborhood}
          </li>
        ))}
      </ul>
    </div>
  );
}
