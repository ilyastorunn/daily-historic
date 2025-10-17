import type { ImageSource } from 'expo-image';

type GradientStop = {
  offset: number;
  color: string;
};

type GradientOptions = {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

type Rgba = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const clampPercent = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
};

const parseHexColor = (raw: string): Rgba | null => {
  const hex = raw.replace('#', '');
  if (![3, 4, 6, 8].includes(hex.length)) {
    return null;
  }

  const expand = (value: string) => (value.length === 1 ? value.repeat(2) : value);

  const chunkSize = hex.length <= 4 ? 1 : 2;
  const chunks = hex.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  if (!chunks) {
    return null;
  }

  const [r, g, b, a] = chunks.map((chunk) => Number.parseInt(expand(chunk), 16));
  return {
    r: chunkSize === 1 ? (r ?? 0) * 17 : r ?? 0,
    g: chunkSize === 1 ? (g ?? 0) * 17 : g ?? 0,
    b: chunkSize === 1 ? (b ?? 0) * 17 : b ?? 0,
    a: typeof a === 'number' ? (chunkSize === 1 ? a * 17 : a) / 255 : 1,
  };
};

const parseRgbColor = (raw: string): Rgba | null => {
  const match = raw
    .replace(/\s+/g, '')
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,(0|0?\.\d+|1(?:\.0+)?))?\)$/i);

  if (!match) {
    return null;
  }

  const [, r, g, b, alpha] = match;
  return {
    r: Number.parseInt(r, 10),
    g: Number.parseInt(g, 10),
    b: Number.parseInt(b, 10),
    a: alpha !== undefined ? Number.parseFloat(alpha) : 1,
  };
};

const parseColor = (input: string): Rgba => {
  const trimmed = input.trim();
  return (
    parseRgbColor(trimmed) ??
    parseHexColor(trimmed) ?? {
      r: 0,
      g: 0,
      b: 0,
      a: 1,
    }
  );
};

const toStopMarkup = ({ offset, color }: GradientStop) => {
  const { r, g, b, a } = parseColor(color);
  const safeOffset = clampPercent(offset);
  const stopColor = `rgb(${r}, ${g}, ${b})`;
  const opacity = Math.min(Math.max(a, 0), 1);

  return `<stop offset="${safeOffset}%" stop-color="${stopColor}" stop-opacity="${opacity}" />`;
};

export const createLinearGradientSource = (
  stops: GradientStop[],
  { x1 = 0, y1 = 0, x2 = 1, y2 = 1 }: GradientOptions = {},
): ImageSource => {
  const stopsMarkup = stops.map(toStopMarkup).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">
      ${stopsMarkup}
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1" height="1" fill="url(#g)" />
</svg>`;

  return { uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` };
};
