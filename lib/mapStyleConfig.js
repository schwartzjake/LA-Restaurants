// lib/mapStyleConfig.js
// Central place to tweak map styling without touching the component logic.
// Adjust colors, widths, expressions, or even swap Geoapify base styles here.

export const MAP_STYLE_CONFIG = {
  /**
   * Geoapify base style id (examples: "dark-matter", "osm-carto", "positron").
   * See https://www.geoapify.com/vector-map-tiles for the full catalog.
   */
  baseStyle: 'osm-carto',

  /**
   * Style overrides are applied after the style.json loads so you can quickly
   * experiment with colors, line widths, and label styling in code.
   */
  overrides: {
    backgroundColor: '#F3F4F7',
    waterColor: '#A7D3F5',
    roadLineColor: '#F6B958',
    roadLineWidthExpression: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5, 0.5,
      12, 2.2,
      16, 6,
    ],
    labelColor: '#212121',
    labelHaloColor: '#FFFFFF',
  },

  /**
   * Pin and cluster colors reused inside the React component for consistency.
   */
  markers: {
    accent: '#D93025',
    clusterFill: '#4285F4',
    clusterStroke: '#FFFFFF',
  },
};
