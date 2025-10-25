/**
 * Color Manipulation Utilities
 * Auto-compute color shades from base colors
 */

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Lighten a color by a percentage
 * @param color - Hex color
 * @param percent - Amount to lighten (0-100)
 */
export function lighten(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const amount = percent / 100;
  const r = rgb.r + (255 - rgb.r) * amount;
  const g = rgb.g + (255 - rgb.g) * amount;
  const b = rgb.b + (255 - rgb.b) * amount;

  return rgbToHex(r, g, b);
}

/**
 * Darken a color by a percentage
 * @param color - Hex color
 * @param percent - Amount to darken (0-100)
 */
export function darken(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const amount = 1 - percent / 100;
  const r = rgb.r * amount;
  const g = rgb.g * amount;
  const b = rgb.b * amount;

  return rgbToHex(r, g, b);
}

/**
 * Add opacity to a color
 * @param color - Hex color
 * @param alpha - Opacity (0-1)
 */
export function opacity(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Blend two colors
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @param ratio - Blend ratio (0 = color1, 1 = color2)
 */
export function blend(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return color1;

  const r = rgb1.r * (1 - ratio) + rgb2.r * ratio;
  const g = rgb1.g * (1 - ratio) + rgb2.g * ratio;
  const b = rgb1.b * (1 - ratio) + rgb2.b * ratio;

  return rgbToHex(r, g, b);
}

/**
 * Color scale definition
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Generate a full color scale from a base color
 * @param baseColor - The base color (500 level)
 * @param isDark - Whether we're in dark mode
 */
export function generateColorScale(baseColor: string, isDark = false): ColorScale {
  if (isDark) {
    // Dark mode: Lighter shades are darker, darker shades are lighter
    return {
      50: darken(baseColor, 70),   // Darkest in dark mode
      100: darken(baseColor, 60),
      200: darken(baseColor, 45),
      300: darken(baseColor, 30),
      400: darken(baseColor, 15),
      500: baseColor,              // Base color
      600: lighten(baseColor, 15),
      700: lighten(baseColor, 30),
      800: lighten(baseColor, 45),
      900: lighten(baseColor, 60), // Lightest in dark mode
    };
  } else {
    // Light mode: Traditional scale
    return {
      50: lighten(baseColor, 95),  // Lightest
      100: lighten(baseColor, 90),
      200: lighten(baseColor, 75),
      300: lighten(baseColor, 50),
      400: lighten(baseColor, 25),
      500: baseColor,              // Base color
      600: darken(baseColor, 10),
      700: darken(baseColor, 20),
      800: darken(baseColor, 30),
      900: darken(baseColor, 40),  // Darkest
    };
  }
}

/**
 * Generate special scales for specific use cases
 */
export function generatePanelScale(background: string, foreground: string, isDark = false): ColorScale {
  // Panel colors are subtle variations of the background
  const base = blend(background, foreground, isDark ? 0.15 : 0.05);

  if (isDark) {
    return {
      50: background,                          // Same as background
      100: blend(background, foreground, 0.05), // Very subtle
      200: blend(background, foreground, 0.10),
      300: blend(background, foreground, 0.15), // Base panel color
      400: blend(background, foreground, 0.25),
      500: blend(background, foreground, 0.35),
      600: blend(background, foreground, 0.45),
      700: blend(background, foreground, 0.55),
      800: blend(background, foreground, 0.65),
      900: blend(background, foreground, 0.75),
    };
  } else {
    return {
      50: lighten(background, 50),              // Very light
      100: background,                          // Same as background
      200: blend(background, foreground, 0.03), // Very subtle
      300: blend(background, foreground, 0.05), // Base panel color
      400: blend(background, foreground, 0.10),
      500: blend(background, foreground, 0.15),
      600: blend(background, foreground, 0.20),
      700: blend(background, foreground, 0.30),
      800: blend(background, foreground, 0.40),
      900: blend(background, foreground, 0.50),
    };
  }
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(variable: string): string {
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variable).trim();
  return value;
}

/**
 * Check if in dark mode
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}