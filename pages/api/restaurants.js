import { fetchAirtableRestaurants, isAirtableConfigured } from '../../lib/airtable';

export default async function handler(_req, res) {
  if (!isAirtableConfigured) {
    return res.status(500).json({ error: 'Airtable environment variables are not configured.' });
  }

  try {
    const restaurants = await fetchAirtableRestaurants();
    return res.status(200).json(restaurants);
  } catch (err) {
    const status = err?.statusCode ?? 500;
    const message = err?.message || 'Failed to fetch restaurants from Airtable.';
    console.error('Airtable fetch failed:', err?.details || message);
    return res.status(status).json({ error: 'Failed to fetch from Airtable' });
  }
}
