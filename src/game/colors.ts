export const MAX_LAPS = 6;

export interface LapColorMeta {
  index: number;
  code: 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';
  label: string;
  color: string;
}

/**
 * Six distinct, non-cyclic lap pigments (Chrono-Atelier mineral palette).
 * Every color satisfies WCAG 2.2 AA (>= 4.5:1 on dark surfaces and >= 4.5:1
 * beneath obsidian ink #0F0E0C for canvas V1-V6 badges).
 */
export const LAP_COLORS = [
  '#56C2C6', // V1: Mineral Teal
  '#F28482', // V2: Terracotta Coral
  '#E9C46A', // V3: Ochre Brass
  '#84D28A', // V4: Botanical Jade
  '#F4A261', // V5: Burnished Apricot
  '#B5A6F5', // V6: Slate Periwinkle
] as const;

export const LAP_LABELS = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'] as const;

export const LAP_META: readonly LapColorMeta[] = [
  { index: 0, code: LAP_LABELS[0], label: 'Vuelta 1', color: LAP_COLORS[0] },
  { index: 1, code: LAP_LABELS[1], label: 'Vuelta 2', color: LAP_COLORS[1] },
  { index: 2, code: LAP_LABELS[2], label: 'Vuelta 3', color: LAP_COLORS[2] },
  { index: 3, code: LAP_LABELS[3], label: 'Vuelta 4', color: LAP_COLORS[3] },
  { index: 4, code: LAP_LABELS[4], label: 'Vuelta 5', color: LAP_COLORS[4] },
  { index: 5, code: LAP_LABELS[5], label: 'Vuelta 6', color: LAP_COLORS[5] },
] as const;

/**
 * Single source of truth for visual design tokens (palette + shape geometry).
 * Consumed by both Canvas 2D renderer and React UI via CSS custom properties.
 */
export const TOKENS = {
  color: {
    // Structural neutrals (warm obsidian & basalt)
    bg: '#0F0E0C',
    bgGrid: '#1D1B17',
    bgGridMajor: '#2A2620',
    surface: '#191714',
    surfaceAlt: '#23201B',
    surfaceMuted: '#14120F',
    border: '#786E5E',
    borderSubtle: '#3A342C',
    borderStrong: '#9A8E7A',
    wall: '#36312A',
    wallEdge: '#7D7362',

    // Typography & focal accent
    text: '#F5F1E8',
    textMuted: '#B8AFA1',
    inkOnAccent: '#0F0E0C',
    accent: '#E5A93B',
    accentHover: '#F0BE59',
    focus: '#E5A93B',

    // Temporal entities
    present: '#FAF7F0',
    rewind: '#6FD1C6',
    goal: '#F2B84B',

    // Interactive world mechanisms (paired with shape/label double-coding)
    plateOff: '#8BB4CC',
    plateOn: '#EAF5FC',
    doorClosed: '#4A433A',
    doorOpen: '#5AD4A6',
    laserActive: '#FF6459',
    laserCore: '#FFE4E0',
    laserInactive: '#9E9588',
    laserDisabled: '#5AD4A6',
    laserBlocked: '#F2C14E',
    switchPending: '#ADA395',
    switchExpected: '#F2B84B',
    switchOn: '#5AD4A6',
    switchError: '#FF7066',
  },
  shape: {
    radiusSm: 6,
    radiusMd: 10,
    radiusLg: 14,
    strokeThin: 1.5,
    strokeBase: 2,
    strokeThick: 3,
    focusWidth: 2,
    gapSm: 8,
    gapMd: 12,
    gapLg: 20,
    controlMinPx: 32,
    opacityTrailSolid: 0.9,
    opacityTrailCore: 0.72,
    opacityTrailSpine: 0.55,
    opacityPresentTrail: 0.16,
    opacityPresentSpine: 0.65,
    opacityFuture1Fill: 0.24,
    opacityFuture1Stroke: 0.85,
    opacityFuture2Fill: 0.12,
    opacityFuture2Stroke: 0.58,
    opacityWireActive: 0.8,
    opacityWireIdle: 0.3,
    opacityScrim: 0.78,
    opacityPauseScrim: 0.42,
  },
} as const;

/**
 * Derived alpha utility so Canvas 2D and UI never duplicate hex literals as raw rgba strings.
 */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

/**
 * Injects all palette and shape tokens from this single source of truth into :root CSS variables.
 * Safe no-op in non-DOM test environments.
 */
export function applyThemeTokens(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  const c = TOKENS.color;
  const s = TOKENS.shape;

  root.setProperty('--color-bg', c.bg);
  root.setProperty('--color-bg-grid', c.bgGrid);
  root.setProperty('--color-surface', c.surface);
  root.setProperty('--color-surface-alt', c.surfaceAlt);
  root.setProperty('--color-surface-muted', c.surfaceMuted);
  root.setProperty('--color-border', c.border);
  root.setProperty('--color-border-subtle', c.borderSubtle);
  root.setProperty('--color-border-strong', c.borderStrong);
  root.setProperty('--color-wall', c.wall);
  root.setProperty('--color-wall-edge', c.wallEdge);

  root.setProperty('--color-text', c.text);
  root.setProperty('--color-text-muted', c.textMuted);
  root.setProperty('--color-ink-on-accent', c.inkOnAccent);
  root.setProperty('--color-accent', c.accent);
  root.setProperty('--color-accent-hover', c.accentHover);
  root.setProperty('--color-accent-selection', withAlpha(c.accent, 0.35));
  root.setProperty('--color-focus', c.focus);

  root.setProperty('--color-present', c.present);
  root.setProperty('--color-rewind', c.rewind);
  root.setProperty('--color-goal', c.goal);
  root.setProperty('--color-plate-off', c.plateOff);
  root.setProperty('--color-plate-on', c.plateOn);
  root.setProperty('--color-door-closed', c.doorClosed);
  root.setProperty('--color-door-open', c.doorOpen);
  root.setProperty('--color-laser-active', c.laserActive);
  root.setProperty('--color-laser-inactive', c.laserInactive);
  root.setProperty('--color-laser-disabled', c.laserDisabled);
  root.setProperty('--color-laser-blocked', c.laserBlocked);
  root.setProperty('--color-switch-pending', c.switchPending);
  root.setProperty('--color-switch-expected', c.switchExpected);
  root.setProperty('--color-switch-on', c.switchOn);
  root.setProperty('--color-switch-error', c.switchError);
  root.setProperty('--color-scrim', withAlpha(c.bg, s.opacityScrim));

  root.setProperty('--radius-sm', `${s.radiusSm}px`);
  root.setProperty('--radius-md', `${s.radiusMd}px`);
  root.setProperty('--radius-lg', `${s.radiusLg}px`);
  root.setProperty('--stroke-thin', `${s.strokeThin}px`);
  root.setProperty('--stroke-base', `${s.strokeBase}px`);
  root.setProperty('--focus-width', `${s.focusWidth}px`);
  root.setProperty('--gap-sm', `${s.gapSm}px`);
  root.setProperty('--gap-md', `${s.gapMd}px`);
  root.setProperty('--control-min', `${s.controlMinPx}px`);
}

/**
 * Preserved COLORS export mapped directly from TOKENS (zero divergent literals).
 */
export const COLORS = {
  bg: TOKENS.color.bg,
  bgGrid: TOKENS.color.bgGrid,
  panel: TOKENS.color.surface,
  panelBorder: TOKENS.color.border,
  wall: TOKENS.color.wall,
  wallHighlight: TOKENS.color.wallEdge,
  present: TOKENS.color.present,
  laps: LAP_COLORS,
  goal: TOKENS.color.goal,
  laser: TOKENS.color.laserActive,
  laserDim: withAlpha(TOKENS.color.laserInactive, 0.75),
  plate: TOKENS.color.plateOff,
  plateActive: TOKENS.color.plateOn,
  doorClosed: TOKENS.color.doorClosed,
  doorOpen: withAlpha(TOKENS.color.doorOpen, 0.16),
  text: TOKENS.color.text,
  textMuted: TOKENS.color.textMuted,
} as const;

export function getLapColor(lapIndex: number): string {
  if (!Number.isInteger(lapIndex) || lapIndex < 0 || lapIndex >= LAP_COLORS.length) {
    throw new RangeError(
      `Invalid lap index outside supported range (0–${MAX_LAPS - 1}): ${lapIndex}`
    );
  }
  return LAP_COLORS[lapIndex];
}

export function getLapCode(lapIndex: number): string {
  if (!Number.isInteger(lapIndex) || lapIndex < 0 || lapIndex >= LAP_LABELS.length) {
    throw new RangeError(
      `Invalid lap index outside supported range (0–${MAX_LAPS - 1}): ${lapIndex}`
    );
  }
  return LAP_LABELS[lapIndex];
}
