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

export const createLinearGradientSource = (
  stops: GradientStop[],
  { x1 = 0, y1 = 0, x2 = 1, y2 = 1 }: GradientOptions = {}
): ImageSource => {
  const stopsMarkup = stops
    .map((stop) => `<stop offset="${stop.offset}%" stop-color="${stop.color}" />`)
    .join('');

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
