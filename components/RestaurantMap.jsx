import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLE_CONFIG } from '../lib/mapStyleConfig';

const GEOAPIFY_KEY = (process.env.NEXT_PUBLIC_GEOAPIFY_KEY || '').trim();
const DEFAULT_CENTER = [-118.2437, 34.0522]; // Downtown LA fallback
const CLUSTER_SOURCE_ID = 'restaurants-source';

const truncate = (value, length = 24) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const escapeHtml = (unsafe) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeCuisines = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => `${item}`.trim()).filter(Boolean);
        }
      } catch (_) {
        // fall through to delimiter-based parsing
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

const buildGeoJson = (restaurants = []) => {
  const toNum = (value) => (typeof value === 'string' ? parseFloat(value) : value);

  const features = restaurants
    .map((r) => {
      const lat = toNum(r.latitude ?? r.Latitude ?? r.lat);
      const lng = toNum(r.longitude ?? r.Longitude ?? r.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const name = r.name ?? r.Name ?? '(Unnamed)';
      const cuisines = normalizeCuisines(r.cuisines ?? r['Cuisine(s)']);

      const googleUrl = r.googleMapsUrl ?? r['Google Maps URL'] ?? r.google_maps_url ?? '#';

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: r.id ?? name,
          name,
          cuisines,
          googleUrl,
          label: truncate(name),
        },
      };
    })
    .filter(Boolean);

  return {
    type: 'FeatureCollection',
    features,
  };
};

const applyStyleOverrides = (map, overrides) => {
  if (!map || !overrides) return;
  const { backgroundColor, waterColor, roadLineColor, roadLineWidthExpression, labelColor, labelHaloColor } =
    overrides;

  const safeSet = (layerId, prop, value) => {
    try {
      map.setPaintProperty(layerId, prop, value);
    } catch (_) {
      // No-op when the property is missing on a layer (style differences per theme).
    }
  };

  const layers = map.getStyle()?.layers ?? [];
  layers.forEach((layer) => {
    if (layer.type === 'background' && backgroundColor) {
      safeSet(layer.id, 'background-color', backgroundColor);
      safeSet(layer.id, 'background-opacity', 1);
    }

    if (layer.type === 'fill' && /water|ocean|lake|river/i.test(layer.id) && waterColor) {
      safeSet(layer.id, 'fill-color', waterColor);
    }

    if (layer.type === 'line' && /(road|highway|street)/i.test(layer.id)) {
      if (roadLineColor) safeSet(layer.id, 'line-color', roadLineColor);
      if (roadLineWidthExpression) safeSet(layer.id, 'line-width', roadLineWidthExpression);
    }

    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      if (labelColor) safeSet(layer.id, 'text-color', labelColor);
      if (labelHaloColor) safeSet(layer.id, 'text-halo-color', labelHaloColor);
    }
  });
};

const buildPopupHtml = ({ name, cuisines, googleUrl }) => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(googleUrl);
  const chips = cuisines
    .slice(0, 6)
    .map((cuisine) => `<span class="maplibre-popup-chip">${escapeHtml(cuisine)}</span>`)
    .join('');

  return `
    <div class="maplibre-popup">
      <h3>${safeName}</h3>
      ${chips ? `<div class="maplibre-popup-chips">${chips}</div>` : ''}
      <a class="maplibre-popup-cta" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
        Open in Google Maps
      </a>
    </div>
  `;
};

const stylePreferences = MAP_STYLE_CONFIG || {};

export default function RestaurantMap({ restaurants, userLatLng }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const hasFitInitialBounds = useRef(false);
  const [styleUrl, setStyleUrl] = useState(null);

  const geoJson = useMemo(() => buildGeoJson(restaurants), [restaurants]);
  const geoJsonRef = useRef(geoJson);

  useEffect(() => {
    geoJsonRef.current = geoJson;
  }, [geoJson]);

  useEffect(() => {
    const customStylePath = (stylePreferences.customStylePath || '').trim();
    if (customStylePath) {
      const normalizedPath = customStylePath.startsWith('http') || customStylePath.startsWith('/')
        ? customStylePath
        : `/${customStylePath}`;
      setStyleUrl(normalizedPath);
      return;
    }

    if (!GEOAPIFY_KEY) return;
    const baseStyle = stylePreferences.baseStyle ?? 'dark-matter';
    setStyleUrl(`https://maps.geoapify.com/v1/styles/${baseStyle}/style.json?apiKey=${GEOAPIFY_KEY}`);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !styleUrl) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: DEFAULT_CENTER,
      zoom: 10.5,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.addControl(new maplibregl.NavigationControl({ showZoom: true, visualizePitch: true }), 'top-right');

    const handleStyle = () => applyStyleOverrides(map, stylePreferences.overrides);
    map.on('styledata', handleStyle);

    map.on('load', () => {
      map.addSource(CLUSTER_SOURCE_ID, {
        type: 'geojson',
        data: geoJsonRef.current,
        cluster: true,
        clusterRadius: 28,
        clusterMaxZoom: 12,
        generateId: true,
      });

      map.addLayer({
        id: 'restaurant-clusters',
        type: 'circle',
        source: CLUSTER_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': stylePreferences?.markers?.clusterFill ?? '#73655D',
          'circle-stroke-color': stylePreferences?.markers?.clusterStroke ?? '#FFFFFF',
          'circle-stroke-width': 2,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            20,
            22,
            50,
            28,
          ],
        },
      });

      map.addLayer({
        id: 'restaurant-cluster-count',
        type: 'symbol',
        source: CLUSTER_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#FFFFFF',
        },
      });

      map.addLayer({
        id: 'restaurant-points',
        type: 'circle',
        source: CLUSTER_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': stylePreferences?.markers?.accent ?? '#592025',
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            6,
            16,
            10,
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5,
        },
      });

      map.addLayer({
        id: 'restaurant-labels',
        type: 'symbol',
        source: CLUSTER_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Semibold'],
          'text-size': 12,
          'text-offset': [0, -1.2],
          'text-anchor': 'bottom',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': stylePreferences?.overrides?.labelColor ?? '#F2F2F2',
          'text-halo-color': stylePreferences?.overrides?.labelHaloColor ?? '#0D0D0D',
          'text-halo-width': 1.5,
        },
      });

      map.on('click', 'restaurant-clusters', (event) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ['restaurant-clusters'],
        });
        const clusterId = features?.[0]?.properties?.cluster_id;
        const source = map.getSource(CLUSTER_SOURCE_ID);
        if (clusterId && source?.getClusterExpansionZoom) {
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error) return;
            map.easeTo({ center: features[0].geometry.coordinates, zoom });
          });
        }
      });

      const openPopupForFeature = (feature) => {
        if (!feature?.geometry?.coordinates) return;
        const { properties } = feature;
        const coordinates = feature.geometry.coordinates.slice();

        if (!popupRef.current) {
          popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: true, maxWidth: '320px' });
        }

        popupRef.current
          .setLngLat(coordinates)
          .setHTML(
              buildPopupHtml({
                name: properties?.name ?? 'Restaurant',
                cuisines: normalizeCuisines(properties?.cuisines),
                googleUrl: properties?.googleUrl ?? '#',
              })
          )
          .addTo(map);
      };

      ['restaurant-points', 'restaurant-labels'].forEach((layerId) => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('click', layerId, (event) => {
          const features = map.queryRenderedFeatures(event.point, { layers: [layerId] });
          if (features.length) openPopupForFeature(features[0]);
        });
      });
    });

    return () => {
      map.off('styledata', handleStyle);
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
    };
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(CLUSTER_SOURCE_ID);
    if (source && source.setData) {
      source.setData(geoJson);
    }
  }, [geoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const features = geoJson.features;
    if (!features.length || hasFitInitialBounds.current) return;

    const bounds = features.reduce((acc, feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      if (!acc) {
        return new maplibregl.LngLatBounds([lng, lat], [lng, lat]);
      }
      return acc.extend([lng, lat]);
    }, null);

    if (bounds) {
      hasFitInitialBounds.current = true;
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [geoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLatLng || userLatLng.length !== 2) return;
    map.easeTo({ center: [userLatLng[1], userLatLng[0]], zoom: 13, duration: 1200 });
  }, [userLatLng]);

  if (!GEOAPIFY_KEY) {
    return (
      <div className="map-wrapper">
        <div className="map-fallback">
          <p className="map-fallback-title">Geoapify key missing.</p>
          <p className="map-fallback-body">
            Add <code>NEXT_PUBLIC_GEOAPIFY_KEY</code> to your environment to render the map.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="map-wrapper" role="presentation" />;
}
