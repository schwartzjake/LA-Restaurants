import { useEffect, useState } from 'react';
import CuisineFilter from '../components/CuisineFilter';

export default function Home() {
  const [restaurants, setRestaurants]   = useState([]);
  const [selectedCuisines, setSelected] = useState([]);

  useEffect(() => {
    async function load() {
      const res  = await fetch('/api/restaurants');
      const data = await res.json();
      setRestaurants(data);
    }
    load();
  }, []);

  const allCuisines = Array.from(
    new Set(restaurants.flatMap(r => r.cuisines || []))
  ).sort();

  const filtered = selectedCuisines.length
    ? restaurants.filter(r =>
        selectedCuisines.every(c => (r.cuisines || []).includes(c))
      )
    : restaurants;

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: 800,
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        L.A. Restaurant Recommendations
      </h1>

      <CuisineFilter
        allCuisines={allCuisines}
        selected={selectedCuisines}
        onChange={setSelected}
      />

      {filtered.length === 0 ? (
        <p>No restaurants match those cuisines.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              border: '1px solid #ddd',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
                {r.name}
              </h2>
              <div style={{ marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(r.cuisines || []).map(c => (
                  <span key={c} style={{
                    background: '#eee',
                    padding: '2px 8px',
                    fontSize: '0.85rem',
                    borderRadius: 12
                  }}>{c}</span>
                ))}
              </div>
              {r.neighborhood && (
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Neighborhood: {r.neighborhood}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
