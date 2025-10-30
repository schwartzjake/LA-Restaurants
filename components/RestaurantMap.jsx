import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLE_CONFIG } from '../lib/mapStyleConfig';
import MultiSelectFilter from './MultiSelectFilter';

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

export default function RestaurantMap({
  restaurants,
  userLatLng,
  isVisible = true,
  onChangeViewMode,
  currentViewMode = 'map',
  filters = {},
}) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const hasFitInitialBounds = useRef(false);
  const isFullscreenRef = useRef(false);
  const setFullscreenRef = useRef(null);
  const [styleUrl, setStyleUrl] = useState(null);
  const [isFilterOverlayOpen, setFilterOverlayOpen] = useState(false);
  const viewButtonsRef = useRef([]);

  const syncViewButtons = (mode) => {
    viewButtonsRef.current.forEach(({ view, button }) => {
      if (!button) return;
      if (view === mode) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  };

  const geoJson = useMemo(() => buildGeoJson(restaurants), [restaurants]);
  const geoJsonRef = useRef(geoJson);
  const initialGeoJsonRef = useRef(null);
  const filterButtonRef = useRef(null);

  const {
    allCuisines = [],
    selCuisines = [],
    setSelCuisines,
    allHoods = [],
    selHoods = [],
    setSelHoods,
  } = filters;

  const canEditFilters =
    typeof setSelCuisines === 'function' && typeof setSelHoods === 'function';

  useEffect(() => {
    geoJsonRef.current = geoJson;
    if (!initialGeoJsonRef.current && geoJson?.features?.length) {
      initialGeoJsonRef.current = geoJson;
    }
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

    let handleSourceData;
    let mobileControls;

    const disablePageScroll = () => {
      document.body.classList.add('map-fullscreen-locked');
    };

    const enablePageScroll = () => {
      document.body.classList.remove('map-fullscreen-locked');
    };

    const setFullscreen = (nextState) => {
      if (!wrapperRef.current) return;
      const isFullscreen = Boolean(nextState);
      isFullscreenRef.current = isFullscreen;
      wrapperRef.current.classList.toggle('fullscreen-map', isFullscreen);
      if (isFullscreen) {
        disablePageScroll();
      } else {
        enablePageScroll();
      }
      requestAnimationFrame(() => map.resize());
    };

    setFullscreenRef.current = setFullscreen;

    const attemptInitialFit = () => {
      if (hasFitInitialBounds.current) return;
      const features = initialGeoJsonRef.current?.features ?? geoJsonRef.current?.features ?? [];
      if (!features.length) return;

      const bounds = features.reduce((acc, feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        if (!acc) return new maplibregl.LngLatBounds([lng, lat], [lng, lat]);
        return acc.extend([lng, lat]);
      }, null);

      if (bounds) {
        hasFitInitialBounds.current = true;
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
    };

    map.on('load', () => {
      map.addSource(CLUSTER_SOURCE_ID, {
        type: 'geojson',
        data: geoJsonRef.current,
        cluster: true,
        clusterRadius: 24,
        clusterMaxZoom: 11,
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
          'text-anchor': 'left',
          'text-variable-anchor': ['left', 'top', 'bottom', 'right'],
          'text-radial-offset': 1.1,
          'text-offset': [0, -0.4],
          'text-justify': 'auto',
          'text-allow-overlap': false,
          'text-padding': 4,
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

      handleSourceData = (event) => {
        if (event.sourceId !== CLUSTER_SOURCE_ID || !event.isSourceLoaded) return;
        attemptInitialFit();
        if (hasFitInitialBounds.current) {
          map.off('data', handleSourceData);
        }
      };

      attemptInitialFit();
      map.on('data', handleSourceData);

      if (typeof window !== 'undefined') {
        const prefersMobile = window.matchMedia('(max-width: 768px)').matches;
        if (prefersMobile) {
          const slidersIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sliders-horizontal" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line></svg>';
          const gridIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>';
          const listIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list" aria-hidden="true"><path d="M3 12h.01"></path><path d="M3 18h.01"></path><path d="M3 6h.01"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M8 6h13"></path></svg>';

          const buttons = [];

          mobileControls = {
            onAdd(ctrlMap) {
              this._map = ctrlMap;
              const container = document.createElement('div');
              container.className = 'maplibregl-ctrl maplibregl-ctrl-group maplibre-mobile-controls';

              const viewGroup = document.createElement('div');
              viewGroup.className = 'maplibre-mobile-controls__view-group';

              const createButton = (label, icon, handler, extraClass = '') => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `maplibre-map-icon-button ${extraClass}`.trim();
                button.innerHTML = icon;
                button.setAttribute('aria-label', label);
                button.addEventListener('click', handler);
                buttons.push({ button, handler });
                return button;
              };

              if (typeof onChangeViewMode === 'function') {
                const cardHandler = () => {
                  setFilterOverlayOpen(false);
                  onChangeViewMode('card');
                };
                const listHandler = () => {
                  setFilterOverlayOpen(false);
                  onChangeViewMode('list');
                };
                const cardButton = createButton('Card view', gridIcon, cardHandler, 'maplibre-map-icon-button--view maplibre-map-icon-button--view-top');
                const listButton = createButton('List view', listIcon, listHandler, 'maplibre-map-icon-button--view maplibre-map-icon-button--view-bottom');
                viewButtonsRef.current = [
                  { view: 'card', button: cardButton },
                  { view: 'list', button: listButton },
                ];
                syncViewButtons(currentViewMode);
                viewGroup.appendChild(cardButton);
                viewGroup.appendChild(listButton);
                container.appendChild(viewGroup);
              }

              if (canEditFilters) {
                const handleToggleFilters = () => {
                  setFilterOverlayOpen((prev) => !prev);
                };
                const filterButton = createButton('Toggle filters', slidersIcon, handleToggleFilters, 'maplibre-map-icon-button--filter');
                container.appendChild(filterButton);
                filterButtonRef.current = filterButton;
              }

              return container;
            },
            onRemove() {
              buttons.forEach(({ button, handler }) => {
                button.removeEventListener('click', handler);
              });
              buttons.length = 0;
              viewButtonsRef.current = [];
              filterButtonRef.current = null;
              this._map = undefined;
            },
          };

          map.addControl(mobileControls, 'top-right');
          if (isVisible && !isFullscreenRef.current) {
            requestAnimationFrame(() => setFullscreen(true));
          }
        }
      }
    });

    return () => {
      map.off('styledata', handleStyle);
      if (handleSourceData) {
        map.off('data', handleSourceData);
      }
      if (mobileControls) {
        map.removeControl(mobileControls);
      }
      if (isFullscreenRef.current) {
        enablePageScroll();
        if (wrapperRef.current) {
          wrapperRef.current.classList.remove('fullscreen-map');
        }
      }
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
      setFullscreenRef.current = null;
      isFullscreenRef.current = false;
    };
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

    if (isVisible) {
      if (isMobile && setFullscreenRef.current && !isFullscreenRef.current) {
        setFullscreenRef.current(true);
      } else {
        requestAnimationFrame(() => map.resize());
      }
    } else {
      setFilterOverlayOpen(false);
      if (isFullscreenRef.current && setFullscreenRef.current) {
        setFullscreenRef.current(false);
      }
    }
  }, [isVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(CLUSTER_SOURCE_ID);
    if (source && source.setData) {
      source.setData(geoJson);
    }
  }, [geoJson]);

  useEffect(() => {
    syncViewButtons(currentViewMode);
  }, [currentViewMode]);

  useEffect(() => {
    if (filterButtonRef.current) {
      filterButtonRef.current.setAttribute('aria-pressed', String(isFilterOverlayOpen));
    }
  }, [isFilterOverlayOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLatLng || userLatLng.length !== 2) return;
    map.easeTo({ center: [userLatLng[1], userLatLng[0]], zoom: 13, duration: 1200 });
  }, [userLatLng]);

  const closeFilterOverlay = () => setFilterOverlayOpen(false);
  const clearFilters = () => {
    if (!canEditFilters) return;
    setSelCuisines([]);
    setSelHoods([]);
  };

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

  return (
    <div ref={wrapperRef} className="map-wrapper" role="presentation">
      <div ref={containerRef} className="map-canvas" />
      {canEditFilters && (
        <div className={`map-filter-overlay ${isFilterOverlayOpen ? 'open' : ''}`} aria-hidden={!isFilterOverlayOpen}>
          <div className="map-filter-overlay__backdrop" onClick={closeFilterOverlay} />
          <div className="map-filter-overlay__sheet">
            <div className="map-filter-overlay__header">
              <span className="map-filter-overlay__title">Filters</span>
              <button type="button" className="map-filter-overlay__close" onClick={closeFilterOverlay} aria-label="Close filters">
                &times;
              </button>
            </div>
            <div className="map-filter-overlay__content">
              <div className="map-filter-overlay__body">
                <MultiSelectFilter
                  options={allCuisines}
                  value={selCuisines}
                  onChange={setSelCuisines}
                  placeholder="Select Cuisine(s)"
                  inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-gray-600 focus:border-white"
                />
                <MultiSelectFilter
                  options={allHoods}
                  value={selHoods}
                  onChange={setSelHoods}
                  placeholder="Select Neighborhood(s)"
                  inputClassName="bg-transparent text-[#F2F2F2] placeholder-gray-400 border-b border-gray-600 focus:border-white"
                />
              </div>
              <div className="map-filter-overlay__actions">
                <button type="button" className="map-filter-overlay__clear" onClick={clearFilters}>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
