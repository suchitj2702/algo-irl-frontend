#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const paletteConfigPath = resolve(rootDir, 'src', 'theme', 'palettes.json');
const outputPath = resolve(rootDir, 'src', 'theme', 'palette.css');

const FAMILIES = ['navy', 'slate', 'mint', 'cream', 'panel', 'button'];

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    throw new Error(`Invalid hex color ${hex}`);
  }
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
      default:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex({ h, s, l }) {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1, g1, b1;

  if (h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function toHslString(hex) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `${h} ${s}% ${l}%`;
}

function toRgbString(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function contrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#111827' : '#f8fafc';
}

function mixChannel(a, b, amount) {
  return Math.round(a + (b - a) * amount);
}

function mixColors(hexA, hexB, amount) {
  const colorA = hexToRgb(hexA);
  const colorB = hexToRgb(hexB);
  const mixed = {
    r: mixChannel(colorA.r, colorB.r, amount),
    g: mixChannel(colorA.g, colorB.g, amount),
    b: mixChannel(colorA.b, colorB.b, amount),
  };

  return `#${[mixed.r, mixed.g, mixed.b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

const MIX_MAP = {
  day: {
    light: {
      '50': 0.9,
      '100': 0.75,
      '200': 0.55,
      '300': 0.4,
      '400': 0.25,
    },
    dark: {
      '600': 0.12,
      '700': 0.22,
      '800': 0.36,
      '900': 0.5,
    },
  },
  night: {
    light: {
      '50': 0.35,
      '100': 0.28,
      '200': 0.22,
      '300': 0.16,
      '400': 0.1,
    },
    dark: {
      '600': 0.12,
      '700': 0.22,
      '800': 0.34,
      '900': 0.48,
    },
  },
};

function generateFamilyVariables(baseHex, mode) {
  const variables = {};
  const mixConfig = MIX_MAP[mode];

  Object.entries(mixConfig.light).forEach(([level, amount]) => {
    const hex = mixColors(baseHex, '#ffffff', amount);
    variables[level] = { hex, rgb: toRgbString(hex) };
  });

  variables['500'] = { hex: baseHex, rgb: toRgbString(baseHex) };

  Object.entries(mixConfig.dark).forEach(([level, amount]) => {
    const hex = mixColors(baseHex, '#000000', amount);
    variables[level] = { hex, rgb: toRgbString(hex) };
  });

  // Ensure missing middle levels (like 300) exist even if not explicitly defined
  ['200', '300', '400'].forEach((level) => {
    if (!variables[level]) {
      const hex = mixColors(baseHex, '#ffffff', 0.2);
      variables[level] = { hex, rgb: toRgbString(hex) };
    }
  });

  ['600', '700', '800', '900'].forEach((level) => {
    if (!variables[level]) {
      const hex = mixColors(baseHex, '#000000', 0.2);
      variables[level] = { hex, rgb: toRgbString(hex) };
    }
  });

  return variables;
}

function buildCss(palettes) {
  const parts = [];
  const generalVars = (mode) => {
    const palette = palettes[mode];

    const surfacePrimary = palette.cream;
    const surfaceElevated = palette.panel;
    const surfaceMuted = mixColors(surfaceElevated, surfacePrimary, mode === 'day' ? 0.35 : 0.55);

    const textPrimary = palette.text;
    const textMuted = mixColors(textPrimary, surfacePrimary, mode === 'day' ? 0.4 : 0.3);
    const textSubtle = mixColors(textPrimary, surfacePrimary, mode === 'day' ? 0.68 : 0.5);
    const textInverse = contrastColor(surfaceElevated);

    const borderSubtle = mixColors(surfaceElevated, surfacePrimary, mode === 'day' ? 0.5 : 0.58);
    const borderStrong = mixColors(surfaceElevated, textPrimary, mode === 'day' ? 0.35 : 0.35);

    const lines = [];
    const pushVar = (name, value) => lines.push(`  ${name}: ${value};`);
    const pushColor = (token, hex) => {
      pushVar(`--${token}`, toHslString(hex));
      pushVar(`--${token}-rgb`, toRgbString(hex));
    };

    pushColor('background', surfacePrimary);
    pushColor('foreground', textPrimary);
    pushColor('card', surfaceElevated);
    pushColor('card-foreground', textPrimary);
    pushColor('popover', surfaceElevated);
    pushColor('popover-foreground', textPrimary);
    pushColor('primary', palette.navy);
    pushColor('primary-foreground', contrastColor(palette.navy));
    pushColor('secondary', palette.slate);
    pushColor('secondary-foreground', contrastColor(palette.slate));
    pushColor('muted', surfaceMuted);
    pushColor('muted-foreground', textMuted);
    pushColor('accent', palette.mint);
    pushColor('accent-foreground', contrastColor(palette.mint));
    pushVar('--button-foreground', toHslString(contrastColor(palette.button)));
    pushVar('--button-foreground-rgb', toRgbString(contrastColor(palette.button)));
    pushColor('destructive', '#ef4444');
    pushColor('destructive-foreground', '#ffffff');
    pushColor('border', borderSubtle);
    pushColor('input', borderSubtle);
    pushColor('ring', palette.navy);

    // Extended palette tokens for Tailwind consumption
    pushColor('text-primary', textPrimary);
    pushColor('text-muted', textMuted);
    pushColor('text-subtle', textSubtle);
    pushColor('text-inverse', textInverse);

    pushColor('surface-primary', surfacePrimary);
    pushColor('surface-elevated', surfaceElevated);
    pushColor('surface-muted', surfaceMuted);

    pushColor('border-subtle', borderSubtle);
    pushColor('border-strong', borderStrong);

    FAMILIES.forEach((name) => {
      const family = generateFamilyVariables(palette[name], mode);
      Object.entries(family).forEach(([level, data]) => {
        const varName = `--${name}-${level}`;
        pushVar(varName, data.hex);
        pushVar(`${varName}-rgb`, data.rgb);
      });

      pushVar(`--${name}`, palette[name]);
      pushVar(`--${name}-rgb`, toRgbString(palette[name]));
    });

    pushVar('--text', palette.text);
    pushVar('--text-rgb', toRgbString(palette.text));

    return lines.join('\n');
  };

  parts.push(`:root {\n${generalVars('day')}\n}`);
  parts.push(`.dark {\n${generalVars('night')}\n}`);

  return `${parts.join('\n\n')}\n`;
}

const paletteJson = JSON.parse(readFileSync(paletteConfigPath, 'utf-8'));
const cssOutput = buildCss(paletteJson);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, cssOutput);

console.log(`✓ Palette CSS generated at ${outputPath}`);
