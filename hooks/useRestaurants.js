import { useEffect, useState } from 'react';

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function useRestaurants() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/restaurants', { signal: controller.signal });
        if (!response.ok) {
          const message = await response.text().catch(() => response.statusText || 'Request failed');
          throw new Error(message || `Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        if (isMounted) {
          const normalized = Array.isArray(payload) ? payload : [];
          setData(shuffle(normalized));
          setError(null);
        }
      } catch (err) {
        if (!isMounted || err.name === 'AbortError') return;
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { data, error, loading };
}
