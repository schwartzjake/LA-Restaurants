// lib/mapStyleConfig.js
// Central place to tweak map styling without touching the component logic.
// Adjust colors, widths, expressions, or even swap Geoapify base styles here.

export const MAP_STYLE_CONFIG = {
  /**
   * Geoapify base style id (examples: "dark-matter", "osm-carto", "positron").
   * See https://www.geoapify.com/vector-map-tiles for the full catalog.
   */
  baseStyle: 'dark-matter',

  /**
   * Style overrides are applied after the style.json loads so you can quickly
   * experiment with colors, line widths, and label styling in code.
   */
  overrides: {
    backgroundColor: '#0A0F1E',
    waterColor: '#133C55',
    roadLineColor: '#D7C7A6',
    roadLineWidthExpression: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5, 0.8,
      12, 3.1,
      16, 9,
    ],
    labelColor: '#F7F8FA',
    labelHaloColor: 'rgba(8, 13, 24, 0.94)',
  },

  /**
   * Pin and cluster colors reused inside the React component for consistency.
   */
  markers: {
    accent: '#F06464',
    clusterFill: '#364B63',
    clusterStroke: '#F7F8FA',
  },
};
