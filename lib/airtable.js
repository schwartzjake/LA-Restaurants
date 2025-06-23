import axios from 'axios';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Restaurants';
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

export async function fetchRestaurants() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    },
  });

  return res.data.records.map((r) => ({
    id: r.id,
    name: r.fields['Name'],
    cuisines: r.fields['Cuisine(s)'] || [],
    neighborhood: r.fields['Neighborhood'],
    address: r.fields['Address'],
    latitude: r.fields['Latitude'],
    longitude: r.fields['Longitude'],
  }));
}
