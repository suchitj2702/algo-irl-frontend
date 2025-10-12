export interface HeatPalette {
  stops: string[];
  borderStops: string[];
  text: string;
  glow: string;
}

const HEAT_SPECTRUM = [
  { stop: 0, color: '#8c1a0f' },
  { stop: 25, color: '#ff4d18' },
  { stop: 50, color: '#ffd23f' },
  { stop: 75, color: '#fff4d6' },
  { stop: 100, color: '#4da6ff' }
];

const clampScore = (score: number) => Math.min(Math.max(score, 0), 100);

const lerpColor = (value: number): string => {
  for (let i = 0; i < HEAT_SPECTRUM.length - 1; i++) {
    const left = HEAT_SPECTRUM[i];
    const right = HEAT_SPECTRUM[i + 1];
    if (value >= left.stop && value <= right.stop) {
      const range = right.stop - left.stop;
      const t = range === 0 ? 0 : (value - left.stop) / range;
      const parseHex = (hex: string) => hex.match(/\w\w/g)?.map(x => parseInt(x, 16)) ?? [0, 0, 0];
      const [r1, g1, b1] = parseHex(left.color);
      const [r2, g2, b2] = parseHex(right.color);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return HEAT_SPECTRUM[HEAT_SPECTRUM.length - 1].color;
};

const rgbToRgba = (rgb: string, alpha: number): string => {
  const matches = rgb.match(/\d+/g);
  if (!matches) return rgb;
  const [r, g, b] = matches.map(Number);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Return gradient stops, border stops, text coloration, and glow intensity
 * for a hotness score. Consumers can layer multiple gradients using these
 * stops to keep the border/background aligned.
 */
export function getHeatPalette(score: number): HeatPalette {
  const clamped = clampScore(score);
  const baseColor = lerpColor(clamped);
  const midColor = lerpColor(Math.min(clamped + 12, 100));
  const accentColor = lerpColor(Math.min(clamped + 28, 100));

  const textColor = clamped >= 55 ? '#111' : '#fff';
  const glowColor = rgbToRgba(accentColor, 0.28);

  const gradientStops = [`${baseColor} 0%`, `${midColor} 50%`, `${accentColor} 100%`];

  return {
    stops: gradientStops,
    borderStops: gradientStops,
    text: textColor,
    glow: glowColor
  };
}
