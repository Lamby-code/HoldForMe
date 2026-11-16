export const COLORS = {
  bg: '#14161a',
  bgGrid: '#1b1f26',
  panel: '#1c2026',
  panelBorder: '#2a303a',
  wall: '#3a4048',
  wallHighlight: '#4a525d',
  present: '#ffffff',
  laps: ['#4cc9f0', '#f72585', '#ffd166', '#80ed99'] as const,
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
  return COLORS.laps[lapIndex % COLORS.laps.length];
}
