export const MAX_LAPS = 6;

export interface LapColorMeta {
  index: number;
  code: string;
  label: string;
  color: string;
}

export const LAP_META: readonly LapColorMeta[] = [
  { index: 0, code: 'V1', label: 'Vuelta 1', color: '#4cc9f0' },
  { index: 1, code: 'V2', label: 'Vuelta 2', color: '#f72585' },
  { index: 2, code: 'V3', label: 'Vuelta 3', color: '#ffd166' },
  { index: 3, code: 'V4', label: 'Vuelta 4', color: '#80ed99' },
  { index: 4, code: 'V5', label: 'Vuelta 5', color: '#ff924c' },
  { index: 5, code: 'V6', label: 'Vuelta 6', color: '#c77dff' },
] as const;

export const COLORS = {
  bg: '#14161a',
  bgGrid: '#1b1f26',
  panel: '#1c2026',
  panelBorder: '#2a303a',
  wall: '#3a4048',
  wallHighlight: '#4a525d',
  present: '#ffffff',
  laps: ['#4cc9f0', '#f72585', '#ffd166', '#80ed99', '#ff924c', '#c77dff'] as const,
  goal: '#ffb703',
  laser: '#ff3b3b',
  laserDim: 'rgba(255, 59, 59, 0.25)',
  plate: '#8ecae6',
  plateActive: '#ffffff',
  doorClosed: '#5a6370',
  doorOpen: 'rgba(142, 202, 230, 0.14)',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
} as const;

export function getLapColor(lapIndex: number): string {
  const entry = LAP_META[lapIndex];
  if (!entry) {
    throw new RangeError(
      `Índice de vuelta fuera del rango soportado (0–${MAX_LAPS - 1}): ${lapIndex}`
    );
  }
  return entry.color;
}

export function getLapCode(lapIndex: number): string {
  const entry = LAP_META[lapIndex];
  if (!entry) {
    throw new RangeError(
      `Índice de vuelta fuera del rango soportado (0–${MAX_LAPS - 1}): ${lapIndex}`
    );
  }
  return entry.code;
}
