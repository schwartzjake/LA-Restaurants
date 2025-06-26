import axios from 'axios';

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN   = process.env.AIRTABLE_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}` };

export default async function handler(req, res) {
  try {
    // 1️⃣ Pull cuisines first
    const cuRes = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/Cuisines`,
      { headers }
    );
    const idToCuisine = {};
    cuRes.data.records.forEach(rec => {
      idToCuisine[rec.id] = rec.fields['Name'];   // adjust field name if different
    });

    // 2️⃣ Pull restaurants
    const restRes = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/Restaurants`,
      { headers }
    );

    // 3️⃣ Map cuisine IDs → names
    const restaurants = restRes.data.records.map(r => ({
      id:   r.id,
      name: r.fields['Name'],
      cuisines: (r.fields['Cuisine(s)'] || []).map(id => idToCuisine[id]),
      neighborhood: r.fields['Neighborhood'],
      address: r.fields['Address'],
      latitude: r.fields['Latitude'],
      longitude: r.fields['Longitude'],
    }));

    res.status(200).json(restaurants);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Airtable fetch failed' });
  }
}
