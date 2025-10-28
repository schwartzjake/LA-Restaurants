// lib/mapStyleConfig.js
// Central place to tweak map styling without touching the component logic.
// Adjust colors, widths, expressions, or even swap Geoapify base styles here.

export const MAP_STYLE_CONFIG = {
  /**
   * Optional self-hosted MapLibre style JSON. Drop your style file in /public and
   * point this to it (e.g. '/map-styles/custom.json'). When provided, Geoapify
   * won't be used.
   */
  customStylePath: '/osmbrightsmooth_2510128_02.json',

  /**
   * Geoapify base style id (examples: "dark-matter", "osm-carto", "positron").
   * See https://www.geoapify.com/vector-map-tiles for the full catalog.
   */
  baseStyle: 'osm-bright-smooth',

  /**
   * Style overrides are applied after the style.json loads so you can quickly
   * experiment with colors, line widths, and label styling in code.
   */
  /* overrides: {
    backgroundColor: '#0B0F1A',
    waterColor: '#14213D',
    roadLineColor: '#3D4B63',
    roadLineWidthExpression: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5, 0.45,
      12, 1.8,
      16, 5.2,
    ],
    labelColor: '#E8F1FF',
    labelHaloColor: 'rgba(5, 7, 15, 0.92)',
  }, */

  /**
   * Pin and cluster colors reused inside the React component for consistency.
   */
  markers: {
    accent: '#FF6B6B',
    clusterFill: '#4457FF',
    clusterStroke: '#0B0F1A',
  },
};
