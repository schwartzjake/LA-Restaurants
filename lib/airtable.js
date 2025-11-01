// lib/airtable.js
// Server-side helpers for querying Airtable and normalizing results.

import { sanitizeRestaurantRecord } from './restaurantUtils';

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Restaurants';
const TOKEN = process.env.AIRTABLE_TOKEN;
const PAGE_SIZE = 100;

const encodeTableName = (name) => encodeURIComponent(name).replace(/%20/g, '+');

const buildBaseUrl = () => {
  if (!BASE_ID || !TABLE_NAME) return null;
  return `https://api.airtable.com/v0/${BASE_ID}/${encodeTableName(TABLE_NAME)}`;
};

const AIRTABLE_BASE_URL = buildBaseUrl();

export const isAirtableConfigured = Boolean(AIRTABLE_BASE_URL && TOKEN);

async function fetchPage(offset) {
  if (!AIRTABLE_BASE_URL || !TOKEN) {
    throw new Error('Airtable credentials are not configured.');
  }

  const url = new URL(AIRTABLE_BASE_URL);
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  if (offset) url.searchParams.set('offset', offset);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const error = new Error(`Airtable request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.details = body;
    throw error;
  }

  return response.json();
}

export async function fetchAirtableRestaurants() {
  if (!isAirtableConfigured) {
    throw new Error('Airtable environment variables are missing.');
  }

  const records = [];
  let offset;

  do {
    const payload = await fetchPage(offset);
    records.push(...(payload.records ?? []));
    offset = payload.offset;
  } while (offset);

  return records
    .map((record) => sanitizeRestaurantRecord(record))
    .filter(Boolean);
}
