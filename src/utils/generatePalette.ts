/**
 * Runtime Palette Generator
 * Dynamically generates all color scales from core semantic colors
 */

import {
  generateColorScale,
  generatePanelScale,
  getCSSVariable,
  isDarkMode,
  blend,
  type ColorScale,
  hexToRgbString
} from './colorUtils';

interface ColorPalette {
  navy: ColorScale;
  slate: ColorScale;
  mint: ColorScale;
  cream: ColorScale;
  panel: ColorScale;
  button: ColorScale;
  sage: ColorScale;
  teal: ColorScale;
}

/**
 * Generate complete color palette from core colors
 */
export function generatePalette(): ColorPalette {
  const dark = isDarkMode();

  // Get core semantic colors
  const primary = getCSSVariable('--primary');
  const secondary = getCSSVariable('--secondary');
  const accent = getCSSVariable('--accent');
  const background = getCSSVariable('--background');
  const foreground = getCSSVariable('--foreground');
  const muted = getCSSVariable('--muted');

  // Maintain a consistent secondary/mint scale across themes
  const mintScale = generateColorScale(secondary, false);

  // Generate scales for each color family
  const palette: ColorPalette = {
    // Navy scale - based on primary color
    navy: generateColorScale(primary, dark),

    // Slate scale - based on muted color (neutral grays)
    slate: generateColorScale(muted, dark),

    // Mint scale - based on secondary color
    mint: mintScale,

    // Cream scale - based on accent color
    cream: generateColorScale(accent, dark),

    // Panel scale - blend of background and foreground
    panel: generatePanelScale(background, foreground, dark),

    // Button scale - align with IntroSection blue (mint gradient anchor)
    button: generateColorScale(mintScale[600], dark),

    // Sage scale - green tint for Easy difficulty
    sage: generateColorScale('#22c55e', dark), // Using success green as base

    // Teal scale - yellow-teal for Medium difficulty
    teal: generateColorScale('#eab308', dark), // Using warning yellow as base
  };

  return palette;
}

/**
 * Inject color scales as CSS custom properties
 */
export function injectColorScales(palette: ColorPalette): void {
  const root = document.documentElement;

  // Inject each color scale
  Object.entries(palette).forEach(([name, scale]) => {
    Object.entries(scale).forEach(([level, color]) => {
      root.style.setProperty(`--${name}-${level}`, color);
    });
    // Also set the DEFAULT value
    root.style.setProperty(`--${name}`, scale[500]);
  });

  // Add special computed properties
  const dark = isDarkMode();

  // Panel muted is a common pattern - lighter in dark mode for better contrast
  root.style.setProperty('--panel-muted', dark ? palette.panel[200] : palette.panel[100]);

  // Button foreground - brighter white in dark mode
  root.style.setProperty('--button-foreground', dark ? '#ffffff' : getCSSVariable('--foreground'));

  // Text hierarchy - improved readability in dark mode
  root.style.setProperty('--text-primary', getCSSVariable('--foreground'));
  root.style.setProperty('--text-muted', dark ? palette.slate[300] : palette.slate[600]);
  root.style.setProperty('--text-subtle', dark ? palette.slate[400] : palette.slate[500]);
  root.style.setProperty('--text-inverse', getCSSVariable('--background'));

  // Surface colors - brighter elevated surfaces in dark mode
  const surfacePrimary = getCSSVariable('--background');
  const surfaceElevated = dark ? palette.panel[100] : '#ffffff';
  const surfaceMuted = dark ? palette.panel[200] : palette.panel[100];

  root.style.setProperty('--surface-primary', surfacePrimary);
  root.style.setProperty('--surface-elevated', surfaceElevated);
  root.style.setProperty('--surface-muted', surfaceMuted);

  // Provide RGB channels for surfaces so Tailwind opacity modifiers work
  root.style.setProperty('--surface-primary-rgb', hexToRgbString(surfacePrimary));
  root.style.setProperty('--surface-elevated-rgb', hexToRgbString(surfaceElevated));
  root.style.setProperty('--surface-muted-rgb', hexToRgbString(surfaceMuted));

  // Borders - better visibility in dark mode
  root.style.setProperty('--border', palette.panel[200]);
  root.style.setProperty('--border-subtle', dark ? palette.panel[100] : palette.panel[200]);
  root.style.setProperty('--border-strong', dark ? palette.panel[400] : palette.panel[300]);

  // Semantic scale generation
  const success = getCSSVariable('--success');
  const warning = getCSSVariable('--warning');
  const error = getCSSVariable('--error');
  const info = getCSSVariable('--info');

  // Generate semantic color scales
  const successScale = generateColorScale(success, dark);
  const warningScale = generateColorScale(warning, dark);
  const errorScale = generateColorScale(error, dark);
  const infoScale = generateColorScale(info, dark);

  // Inject commonly used semantic scale values
  root.style.setProperty('--success-50', successScale[50]);
  root.style.setProperty('--success-500', successScale[500]);
  root.style.setProperty('--success-600', successScale[600]);
  root.style.setProperty('--success-700', successScale[700]);

  root.style.setProperty('--warning-50', warningScale[50]);
  root.style.setProperty('--warning-500', warningScale[500]);
  root.style.setProperty('--warning-600', warningScale[600]);

  root.style.setProperty('--error-50', errorScale[50]);
  root.style.setProperty('--error-500', errorScale[500]);
  root.style.setProperty('--error-600', errorScale[600]);
  root.style.setProperty('--error-700', errorScale[700]);

  root.style.setProperty('--info-50', infoScale[50]);
  root.style.setProperty('--info-500', infoScale[500]);
  root.style.setProperty('--info-600', infoScale[600]);

  // Add shorthand aliases for commonly used colors
  root.style.setProperty('--mint-light', palette.mint[100]);
  root.style.setProperty('--mint-dark', palette.mint[700]);

  root.style.setProperty('--slate-light', palette.slate[100]);

  root.style.setProperty('--sage', palette.sage[500]);
  root.style.setProperty('--sage-light', palette.sage[100]);
  root.style.setProperty('--sage-dark', palette.sage[700]);

  root.style.setProperty('--teal', palette.teal[500]);
  root.style.setProperty('--teal-light', palette.teal[100]);
  root.style.setProperty('--teal-dark', palette.teal[700]);
}

/**
 * Initialize palette generation
 * Should be called on app startup and theme changes
 */
export function initializePalette(): void {
  const palette = generatePalette();
  injectColorScales(palette);
}

/**
 * Listen for theme changes and regenerate palette
 */
export function watchThemeChanges(): void {
  // Watch for class changes on document element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // Theme changed, regenerate palette
        initializePalette();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

/**
 * Export individual scale getters for use in components
 */
export function getNavyScale(): ColorScale {
  return generateColorScale(getCSSVariable('--primary'), isDarkMode());
}

export function getSlateScale(): ColorScale {
  return generateColorScale(getCSSVariable('--muted'), isDarkMode());
}

export function getMintScale(): ColorScale {
  return generateColorScale(getCSSVariable('--secondary'), isDarkMode());
}

export function getCreamScale(): ColorScale {
  return generateColorScale(getCSSVariable('--accent'), isDarkMode());
}

export function getPanelScale(): ColorScale {
  return generatePanelScale(
    getCSSVariable('--background'),
    getCSSVariable('--foreground'),
    isDarkMode()
  );
}

export function getButtonScale(): ColorScale {
  return generateColorScale(getCSSVariable('--primary'), isDarkMode());
}

export function getSageScale(): ColorScale {
  return generateColorScale('#22c55e', isDarkMode());
}

export function getTealScale(): ColorScale {
  return generateColorScale('#eab308', isDarkMode());
}
