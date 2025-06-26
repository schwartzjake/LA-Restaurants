import axios from 'axios';

export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = 'Restaurants';
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
    });

    const records = response.data.records.map((r) => ({
      id: r.id,
      name: r.fields['Name'],
      cuisines: r.fields['Cuisine(s)'] || [],
      neighborhood: r.fields['Neighborhood'],
      address: r.fields['Address'],
      latitude: r.fields['Latitude'],
      longitude: r.fields['Longitude'],
    }));

    res.status(200).json(records);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch data from Airtable' });
  }
}
