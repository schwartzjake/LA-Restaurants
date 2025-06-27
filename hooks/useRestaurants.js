import { useState, useEffect } from 'react';

export default function useRestaurants() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading };
}
