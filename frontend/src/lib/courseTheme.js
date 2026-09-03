/**
 * Course theme configuration schema, presets, and CSS variable generation.
 *
 * These themes control how a course's landing page looks to students.
 * They are rendered inside a Shadow DOM so they never leak into the app shell.
 */

/** All properties a course theme can define. */
export const THEME_PROPERTIES = {
  primaryColor: { label: 'Primary color', type: 'color', default: '#4F46E5' },
  accentColor:  { label: 'Accent color',  type: 'color', default: '#F59E0B' },
  bgColor:      { label: 'Background',    type: 'color', default: '#FFFFFF' },
  textColor:    { label: 'Text color',    type: 'color', default: '#111827' },
  fontFamily:   { label: 'Font',          type: 'font',  default: 'Inter, system-ui, sans-serif' },
  borderRadius: { label: 'Roundness',     type: 'range', default: 8, min: 0, max: 24, unit: 'px' },
  heroStyle:    { label: 'Hero style',    type: 'select', default: 'gradient', options: ['gradient', 'solid', 'image'] },
};

/** Font options shown in the editor dropdown. */
export const FONT_OPTIONS = [
  { label: 'Inter',           value: 'Inter, system-ui, sans-serif' },
  { label: 'System default',  value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Georgia',         value: 'Georgia, "Times New Roman", serif' },
  { label: 'Merriweather',    value: 'Merriweather, Georgia, serif' },
  { label: 'Roboto',          value: 'Roboto, "Helvetica Neue", sans-serif' },
  { label: 'Open Sans',       value: '"Open Sans", "Helvetica Neue", sans-serif' },
  { label: 'Lato',            value: 'Lato, "Helvetica Neue", sans-serif' },
  { label: 'Poppins',         value: 'Poppins, system-ui, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Courier New',     value: '"Courier New", Courier, monospace' },
];

/** Built-in presets teachers can apply with one click. */
export const THEME_PRESETS = {
  classic: {
    name: 'Classic',
    config: {
      primaryColor: '#4F46E5',
      accentColor: '#F59E0B',
      bgColor: '#FFFFFF',
      textColor: '#111827',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: 8,
      heroStyle: 'gradient',
    },
  },
  modernDark: {
    name: 'Modern dark',
    config: {
      primaryColor: '#818CF8',
      accentColor: '#34D399',
      bgColor: '#0F172A',
      textColor: '#F1F5F9',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: 12,
      heroStyle: 'solid',
    },
  },
  warm: {
    name: 'Warm',
    config: {
      primaryColor: '#D97706',
      accentColor: '#DC2626',
      bgColor: '#FFFBEB',
      textColor: '#451A03',
      fontFamily: 'Georgia, "Times New Roman", serif',
      borderRadius: 6,
      heroStyle: 'gradient',
    },
  },
  ocean: {
    name: 'Ocean',
    config: {
      primaryColor: '#0891B2',
      accentColor: '#6366F1',
      bgColor: '#F0F9FF',
      textColor: '#0C4A6E',
      fontFamily: '"Open Sans", "Helvetica Neue", sans-serif',
      borderRadius: 10,
      heroStyle: 'gradient',
    },
  },
};

/** Returns a default theme config object (all defaults from THEME_PROPERTIES). */
export function getDefaultTheme() {
  const theme = {};
  for (const [key, prop] of Object.entries(THEME_PROPERTIES)) {
    theme[key] = prop.default;
  }
  return theme;
}

/**
 * Generate a CSS string of custom properties from a theme config.
 * These are injected into the shadow root's <style> element.
 */
export function generateThemeCSS(config) {
  const c = { ...getDefaultTheme(), ...config };

  return `
    :host {
      --ct-primary: ${c.primaryColor};
      --ct-accent: ${c.accentColor};
      --ct-bg: ${c.bgColor};
      --ct-text: ${c.textColor};
      --ct-font: ${c.fontFamily};
      --ct-radius: ${c.borderRadius}px;
      --ct-hero-style: ${c.heroStyle};

      color: var(--ct-text);
      background: var(--ct-bg);
      font-family: var(--ct-font);
      line-height: 1.6;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
  `.trim();
}
