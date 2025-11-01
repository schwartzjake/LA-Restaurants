// lib/restaurantUtils.js
// Shared helpers for normalizing restaurant data across the app.

const POTENTIAL_ID_KEYS = ['id', 'ID', 'Id'];
const POTENTIAL_NAME_KEYS = ['Name', 'name', 'TITLE', 'title'];
const POTENTIAL_NEIGHBORHOOD_KEYS = ['Neighborhood', 'neighborhood'];
const POTENTIAL_ADDRESS_KEYS = ['Address', 'address'];
const POTENTIAL_CUISINES_KEYS = ['Cuisine(s)', 'Cuisines', 'cuisines'];
const POTENTIAL_LAT_KEYS = ['Latitude', 'latitude', 'LAT', 'Lat', 'lat'];
const POTENTIAL_LNG_KEYS = ['Longitude', 'longitude', 'LNG', 'Lng', 'lng', 'Long', 'long'];
const POTENTIAL_GOOGLE_MAP_KEYS = ['Google Maps URL', 'googleMapsUrl', 'google_maps_url', 'mapsUrl', 'maps_url'];

const guessValue = (source, keys) => {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key];
  }
  return undefined;
};

export const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const normalizeCuisines = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => `${item}`.trim()).filter(Boolean);
        }
      } catch {
        // Fall through to delimiter-based parsing below.
      }
    }

    return trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((part) => part.replace(/^['"]+|['"]+$/g, '').trim())
      .filter(Boolean);
  }

  return [];
};

const toNullableString = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = `${value}`.trim();
  return normalized ? normalized : null;
};

/**
 * Normalizes a raw Airtable record or any loosely shaped restaurant object.
 */
export const sanitizeRestaurantRecord = (record) => {
  if (!record) return null;

  const fields = typeof record.fields === 'object' && record.fields !== null ? record.fields : record;

  const id = record.id ?? guessValue(fields, POTENTIAL_ID_KEYS);
  const name = guessValue(fields, POTENTIAL_NAME_KEYS) ?? (id ? `${id}` : null);

  if (!id || !name) return null;

  const neighborhood = guessValue(fields, POTENTIAL_NEIGHBORHOOD_KEYS);
  const address = guessValue(fields, POTENTIAL_ADDRESS_KEYS);
  const cuisines = normalizeCuisines(guessValue(fields, POTENTIAL_CUISINES_KEYS));
  const latitude = toNumber(guessValue(fields, POTENTIAL_LAT_KEYS));
  const longitude = toNumber(guessValue(fields, POTENTIAL_LNG_KEYS));
  const googleMapsUrl = guessValue(fields, POTENTIAL_GOOGLE_MAP_KEYS);

  return {
    id,
    name: `${name}`.trim(),
    neighborhood: toNullableString(neighborhood),
    address: toNullableString(address),
    cuisines,
    latitude,
    longitude,
    googleMapsUrl: toNullableString(googleMapsUrl),
  };
};

export const sortByDriveTime = (restaurants, driveTimes = {}) => {
  if (!restaurants?.length) return [];
  return [...restaurants].sort((a, b) => {
    const timeA = Number.isFinite(driveTimes[a.id]) ? driveTimes[a.id] : Number.POSITIVE_INFINITY;
    const timeB = Number.isFinite(driveTimes[b.id]) ? driveTimes[b.id] : Number.POSITIVE_INFINITY;
    if (timeA === timeB) return a.name.localeCompare(b.name);
    return timeA - timeB;
  });
};
