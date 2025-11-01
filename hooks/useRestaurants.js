import { useEffect, useState } from 'react';

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
          setData(Array.isArray(payload) ? payload : []);
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
