import axios from 'axios';

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE   = 'Restaurants';
const TOKEN   = process.env.AIRTABLE_TOKEN;

export default async function handler(req, res) {
  const headers = { Authorization: `Bearer ${TOKEN}` };
  let records = [];
  let offset  = null;

  try {
    do {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const result = await axios.get(url, { headers });

      records.push(...result.data.records);
      offset = result.data.offset;
    } while (offset);

    const cleaned = records.map(r => ({
      id: r.id,
      name: r.fields['Name'],
      cuisines: r.fields['Cuisine(s)'] || [],
      neighborhood: r.fields['Neighborhood'],
      address: r.fields['Address'],
      googleMapsUrl: r.fields["Google Maps URL"],
      latitude: r.fields['Latitude'],
      longitude: r.fields['Longitude'],
    }));

    res.status(200).json(cleaned);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch from Airtable' });
  }
}
