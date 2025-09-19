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
    backgroundColor: '#0D0D0D',
    waterColor: '#1B263B',
    roadLineColor: '#73655D',
    roadLineWidthExpression: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5, 0.6,
      12, 2.5,
      16, 7,
    ],
    labelColor: '#F2F2F2',
    labelHaloColor: '#0D0D0D',
  },

  /**
   * Pin and cluster colors reused inside the React component for consistency.
   */
  markers: {
    accent: '#592025',
    clusterFill: '#73655D',
    clusterStroke: '#FFFFFF',
  },
};
