export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Plate {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  requiredPlates: string[];
}

export interface Laser {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** If defined, laser only fires while all referenced plates are pressed */
  poweredByPlates?: string[];
}

/**
 * Deterministic linear ping-pong moving laser definition (A <-> B).
 */
export interface MovingLaser {
  id: string;
  /** First endpoint (A) of the linear A <-> B trajectory */
  pointA: Point2D;
  /** Second endpoint (B) of the linear A <-> B trajectory */
  pointB: Point2D;
  /** Optional constant beam vector from moving origin p1(t) to p2(t) */
  beamOffset?: Point2D;
  /** Optional trajectory endpoints for beam end p2(t) paired with pointA/pointB */
  beamEndA?: Point2D;
  beamEndB?: Point2D;
  /** Full A -> B -> A cycle duration in frames (finite integer > 0) */
  periodFrames: number;
  /** Initial phase offset in frames (finite integer, deterministic wrt t) */
  phaseOffsetFrames: number;
  /** Deterministic back-and-forth interpolation mode */
  motion: 'ping-pong';
  /** Optional pressure plates required to power the moving laser */
  poweredByPlates?: string[];
  /** Optional declared initial state label */
  declaredState?: string;
}

/**
 * Normalized sub-range [start, end] along a parent laser's effective beam at time t.
 */
export interface LaserSegmentRange {
  start: number;
  end: number;
}

/**
 * Referencable laser segment entity (D1) belonging to a static or moving laser.
 */
export interface LaserSegment {
  id: string;
  /** Parent Laser.id or MovingLaser.id */
  laserId: string;
  /** Deterministic normalized span [start, end] along the parent beam (0 <= start < end <= 1) */
  range: LaserSegmentRange;
  /** Enabled state at start of evaluation or after sequence reset */
  initialEnabled: boolean;
}

/**
 * Ordered switch within a level-wide global sequence.
 */
export interface OrderedSwitch {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  /** 1-based position in the global activation sequence */
  order: number;
  /** IDs of LaserSegment entities controlled by this switch */
  targetSegmentIds: string[];
  /** Effect applied when the global sequence is completed */
  effect: 'enable' | 'disable';
  /** Optional declared initial state label */
  declaredState?: string;
}

export interface OrderedSwitchSequence {
  /** Sequence applies globally across the level */
  scope: 'global';
  /** Any out-of-order activation resets the global sequence */
  resetOnError: true;
  /** Ordered switches forming sequence 1..N */
  switches: OrderedSwitch[];
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  maxLaps: number;
  hint: string;
  spawn: Point2D;
  goal: { x: number; y: number; r: number };
  walls: Rect[];
  plates: Plate[];
  doors: Door[];
  lasers: Laser[];
  /** Optional moving linear lasers (A <-> B ping-pong) */
  movingLasers?: MovingLaser[];
  /** Optional controllable laser segments belonging to static or moving lasers */
  laserSegments?: LaserSegment[];
  /** Optional global ordered switch sequence */
  orderedSwitchSequence?: OrderedSwitchSequence;
}

export const CANVAS_W = 960;
export const CANVAS_H = 400;
export const WALL_T = 24;
export const MIN_SUPPORTED_LAPS = 1;
export const MAX_SUPPORTED_LAPS = 6;
export const MAX_SUPPORTED_LEVELS = 10;

const PERIMETER_WALLS: Rect[] = [
  { x: 0, y: 0, w: CANVAS_W, h: WALL_T },
  { x: 0, y: CANVAS_H - WALL_T, w: CANVAS_W, h: WALL_T },
  { x: 0, y: WALL_T, w: WALL_T, h: CANVAS_H - WALL_T * 2 },
  { x: CANVAS_W - WALL_T, y: WALL_T, w: WALL_T, h: CANVAS_H - WALL_T * 2 },
];

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Caminar',
    subtitle: 'Un cuarto, una meta, sin fantasmas.',
    maxLaps: 1,
    hint: 'Usá WASD o las flechas para rodear el pilar y llegar a la meta dorada.',
    spawn: { x: 120, y: 200 },
    goal: { x: 820, y: 316, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 456, y: 96, w: 24, h: 208 },
    ],
    plates: [],
    doors: [],
    lasers: [],
  },
  {
    id: 2,
    name: 'El sostén',
    subtitle: 'Tu vuelta anterior puede sostener una placa por vos.',
    maxLaps: 2,
    hint: 'Vuelta 1: parate sobre la placa A y terminá la vuelta (Enter). Vuelta 2: rodeá tu rastro sólido y cruzá la puerta.',
    spawn: { x: 120, y: 200 },
    goal: { x: 830, y: 200, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 680, y: 24, w: 24, h: 116 },
      { x: 680, y: 260, w: 24, h: 116 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 360, y: 200, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 680, y: 140, w: 24, h: 120, requiredPlates: ['A'] },
    ],
    lasers: [],
  },
  {
    id: 3,
    name: 'El relevo',
    subtitle: 'Repartí trabajos y encadená tres vueltas.',
    maxLaps: 3,
    hint: 'Vuelta 1 sostiene A (abre Puerta 1). Vuelta 2 cruza a B y la sostiene. Vuelta 3 entra con ambas puertas abiertas.',
    spawn: { x: 110, y: 280 },
    goal: { x: 826, y: 210, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 360, y: 24, w: 24, h: 92 },
      { x: 360, y: 242, w: 24, h: 134 },
      { x: 660, y: 24, w: 24, h: 126 },
      { x: 660, y: 270, w: 24, h: 106 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 210, y: 100, r: 22 },
      { id: 'B', label: 'B', x: 510, y: 308, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 360, y: 116, w: 24, h: 126, requiredPlates: ['A'] },
      { id: 'D2', x: 660, y: 150, w: 24, h: 120, requiredPlates: ['A', 'B'] },
    ],
    lasers: [],
  },
  {
    id: 4,
    name: 'La cuadrilla',
    subtitle: 'Relevo y bloqueo de láser en tres vueltas.',
    maxLaps: 3,
    hint: 'Vuelta 1 sostiene A ~7 s y baja a tapar el láser L1. Vuelta 2 cruza Puerta 1 y sostiene B. Vuelta 3 pasa bajo el bloqueo hacia la meta.',
    spawn: { x: 150, y: 240 },
    goal: { x: 840, y: 260, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 300, y: 24, w: 24, h: 36 },
      { x: 300, y: 172, w: 406, h: 24 },
      { x: 682, y: 24, w: 24, h: 148 },
      { x: 682, y: 328, w: 24, h: 48 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 80, y: 88, r: 22 },
      { id: 'B', label: 'B', x: 480, y: 96, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 300, y: 60, w: 24, h: 112, requiredPlates: ['A'] },
      { id: 'D2', x: 682, y: 196, w: 24, h: 132, requiredPlates: ['B'] },
    ],
    lasers: [
      { id: 'L1', x1: 520, y1: 370, x2: 520, y2: 202, poweredByPlates: ['B'] },
    ],
  },
  {
    id: 5,
    name: 'El pulso',
    subtitle: 'Un haz que va y viene marca tu momento.',
    maxLaps: 3,
    hint: 'El láser se mueve con ritmo fijo. Usá tus vueltas para sostener el paso y cruzar en el momento justo.',
    spawn: { x: 100, y: 200 },
    goal: { x: 848, y: 200, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 420, y: 24, w: 260, h: 136 },
      { x: 420, y: 240, w: 260, h: 24 },
      { x: 740, y: 24, w: 24, h: 116 },
      { x: 740, y: 260, w: 24, h: 116 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 200, y: 96, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 740, y: 140, w: 24, h: 120, requiredPlates: ['A'] },
    ],
    lasers: [],
    movingLasers: [
      {
        id: 'ML1',
        pointA: { x: 515, y: 356 },
        pointB: { x: 585, y: 356 },
        beamEndA: { x: 360, y: 56 },
        beamEndB: { x: 740, y: 56 },
        periodFrames: 120,
        phaseOffsetFrames: 0,
        motion: 'ping-pong',
        poweredByPlates: ['A'],
      },
    ],
  },
  {
    id: 6,
    name: 'Orden correcto',
    subtitle: 'No todo botón se aprieta cuando querés.',
    maxLaps: 4,
    hint: 'Activá los interruptores en orden. Si te equivocás, la secuencia vuelve a empezar.',
    spawn: { x: 100, y: 200 },
    goal: { x: 830, y: 200, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 300, y: 24, w: 24, h: 88 },
      { x: 300, y: 288, w: 24, h: 88 },
      { x: 420, y: 136, w: 120, h: 20 },
      { x: 420, y: 244, w: 120, h: 20 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 200, y: 316, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 300, y: 112, w: 24, h: 176, requiredPlates: ['A'] },
    ],
    lasers: [
      { id: 'L1', x1: 660, y1: 370, x2: 660, y2: 30 },
    ],
    laserSegments: [
      { id: 'SEG1', laserId: 'L1', range: { start: 0, end: 1 }, initialEnabled: true },
    ],
    orderedSwitchSequence: {
      scope: 'global',
      resetOnError: true,
      switches: [
        {
          id: 'S1',
          label: '1',
          x: 480,
          y: 80,
          r: 20,
          order: 1,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
        {
          id: 'S2',
          label: '2',
          x: 480,
          y: 320,
          r: 20,
          order: 2,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
      ],
    },
  },
  {
    id: 7,
    name: 'Sincronía',
    subtitle: 'Ritmo, orden y una última pasada limpia.',
    maxLaps: 5,
    hint: 'Sincronizá tus vueltas: primero dejá el camino listo, después cruzá sin romper el orden.',
    spawn: { x: 96, y: 200 },
    goal: { x: 868, y: 200, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 260, y: 24, w: 24, h: 64 },
      { x: 260, y: 312, w: 24, h: 64 },
      { x: 580, y: 24, w: 224, h: 120 },
      { x: 616, y: 228, w: 188, h: 24 },
      { x: 804, y: 24, w: 24, h: 116 },
      { x: 804, y: 260, w: 24, h: 116 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 176, y: 88, r: 22 },
      { id: 'B', label: 'B', x: 380, y: 316, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 260, y: 88, w: 24, h: 224, requiredPlates: ['A'] },
      { id: 'D2', x: 804, y: 140, w: 24, h: 120, requiredPlates: ['B'] },
    ],
    lasers: [
      { id: 'L1', x1: 540, y1: 370, x2: 540, y2: 30 },
    ],
    movingLasers: [
      {
        id: 'ML1',
        pointA: { x: 671, y: 356 },
        pointB: { x: 741, y: 356 },
        beamEndA: { x: 564, y: 48 },
        beamEndB: { x: 848, y: 48 },
        periodFrames: 96,
        phaseOffsetFrames: 0,
        motion: 'ping-pong',
        poweredByPlates: ['B'],
      },
    ],
    laserSegments: [
      { id: 'SEG_S_BOT', laserId: 'L1', range: { start: 0, end: 0.5 }, initialEnabled: true },
      { id: 'SEG_S_TOP', laserId: 'L1', range: { start: 0.5, end: 1 }, initialEnabled: true },
    ],
    orderedSwitchSequence: {
      scope: 'global',
      resetOnError: true,
      switches: [
        {
          id: 'S1',
          label: '1',
          x: 350,
          y: 96,
          r: 20,
          order: 1,
          targetSegmentIds: ['SEG_S_BOT', 'SEG_S_TOP'],
          effect: 'disable',
        },
        {
          id: 'S2',
          label: '2',
          x: 450,
          y: 96,
          r: 20,
          order: 2,
          targetSegmentIds: ['SEG_S_BOT', 'SEG_S_TOP'],
          effect: 'disable',
        },
        {
          id: 'S3',
          label: '3',
          x: 400,
          y: 236,
          r: 20,
          order: 3,
          targetSegmentIds: ['SEG_S_BOT', 'SEG_S_TOP'],
          effect: 'disable',
        },
      ],
    },
  },
];

export class LevelValidationError extends Error {
  readonly levelId: number;
  readonly reasons: string[];

  constructor(levelId: number, reasons: string[]) {
    super(`Definición inválida en Nivel ${levelId}: ${reasons.join('; ')}`);
    this.name = 'LevelValidationError';
    this.levelId = levelId;
    this.reasons = reasons;
  }
}

function isFinitePoint(pt: Point2D | undefined | null): pt is Point2D {
  return Boolean(pt && Number.isFinite(pt.x) && Number.isFinite(pt.y));
}

/**
 * Policy O1 (explicit deterministic rejection): validates level bounds, maxLaps,
 * plate/laser references, and extensibility metadata without silent normalization.
 */
export function validateLevelDef(level: LevelDef): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(level.id) || level.id < 1) {
    errors.push(`id inválido (${String(level.id)})`);
  }

  if (
    !Number.isInteger(level.maxLaps) ||
    level.maxLaps < MIN_SUPPORTED_LAPS ||
    level.maxLaps > MAX_SUPPORTED_LAPS
  ) {
    errors.push(
      `maxLaps fuera de rango (${MIN_SUPPORTED_LAPS}–${MAX_SUPPORTED_LAPS}): ${String(level.maxLaps)}`
    );
  }

  if (
    !isFinitePoint(level.spawn) ||
    level.spawn.x < 0 ||
    level.spawn.x > CANVAS_W ||
    level.spawn.y < 0 ||
    level.spawn.y > CANVAS_H
  ) {
    errors.push('spawn fuera de los límites del canvas 960×400');
  }

  if (
    !level.goal ||
    !Number.isFinite(level.goal.x) ||
    !Number.isFinite(level.goal.y) ||
    !Number.isFinite(level.goal.r) ||
    level.goal.r <= 0 ||
    level.goal.x < 0 ||
    level.goal.x > CANVAS_W ||
    level.goal.y < 0 ||
    level.goal.y > CANVAS_H
  ) {
    errors.push('goal inválido o fuera de los límites del canvas 960×400');
  }

  const plateIds = new Set<string>();
  for (const plate of level.plates) {
    if (!plate.id) {
      errors.push('placa sin id');
      continue;
    }
    if (plateIds.has(plate.id)) {
      errors.push(`id de placa duplicado: ${plate.id}`);
    }
    plateIds.add(plate.id);
    if (!Number.isFinite(plate.x) || !Number.isFinite(plate.y) || !Number.isFinite(plate.r) || plate.r <= 0) {
      errors.push(`placa ${plate.id} con geometría inválida`);
    }
  }

  for (const door of level.doors) {
    if (!door.id) {
      errors.push('puerta sin id');
    }
    if (!door.requiredPlates || door.requiredPlates.length === 0) {
      errors.push(`puerta ${door.id || '(sin id)'} sin requiredPlates`);
      continue;
    }
    for (const reqId of door.requiredPlates) {
      if (!plateIds.has(reqId)) {
        errors.push(`puerta ${door.id} referencia placa inexistente: ${reqId}`);
      }
    }
  }

  const laserIds = new Set<string>();
  for (const laser of level.lasers) {
    if (!laser.id) {
      errors.push('láser sin id');
    } else {
      if (laserIds.has(laser.id)) {
        errors.push(`id de láser duplicado: ${laser.id}`);
      }
      laserIds.add(laser.id);
    }
    if (
      !Number.isFinite(laser.x1) ||
      !Number.isFinite(laser.y1) ||
      !Number.isFinite(laser.x2) ||
      !Number.isFinite(laser.y2) ||
      (laser.x1 === laser.x2 && laser.y1 === laser.y2)
    ) {
      errors.push(`láser ${laser.id || '(sin id)'} con segmento inválido o degenerado`);
    }
    if (laser.poweredByPlates) {
      for (const pId of laser.poweredByPlates) {
        if (!plateIds.has(pId)) {
          errors.push(`láser ${laser.id} referencia placa inexistente: ${pId}`);
        }
      }
    }
  }

  if (level.movingLasers) {
    for (const ml of level.movingLasers) {
      if (!ml.id) {
        errors.push('láser móvil sin id');
      } else {
        if (laserIds.has(ml.id)) {
          errors.push(`id de láser móvil duplicado: ${ml.id}`);
        }
        laserIds.add(ml.id);
      }
      if (!isFinitePoint(ml.pointA) || !isFinitePoint(ml.pointB)) {
        errors.push(`láser móvil ${ml.id || '(sin id)'} con puntos A/B inválidos`);
      } else if (ml.pointA.x === ml.pointB.x && ml.pointA.y === ml.pointB.y) {
        errors.push(`láser móvil ${ml.id || '(sin id)'} tiene pointA === pointB`);
      }
      if (!Number.isInteger(ml.periodFrames) || ml.periodFrames <= 0) {
        errors.push(`láser móvil ${ml.id || '(sin id)'} requiere periodFrames entero > 0`);
      }
      if (!Number.isInteger(ml.phaseOffsetFrames)) {
        errors.push(`láser móvil ${ml.id || '(sin id)'} requiere phaseOffsetFrames entero finito`);
      }
      if (ml.motion !== 'ping-pong') {
        errors.push(`láser móvil ${ml.id || '(sin id)'} requiere motion = 'ping-pong'`);
      }
      if (ml.beamOffset !== undefined) {
        if (!isFinitePoint(ml.beamOffset) || (ml.beamOffset.x === 0 && ml.beamOffset.y === 0)) {
          errors.push(`láser móvil ${ml.id || '(sin id)'} con beamOffset inválido o nulo`);
        }
      }
      if (ml.beamEndA !== undefined || ml.beamEndB !== undefined) {
        if (!isFinitePoint(ml.beamEndA) || !isFinitePoint(ml.beamEndB)) {
          errors.push(`láser móvil ${ml.id || '(sin id)'} requiere beamEndA y beamEndB finitos`);
        } else if (
          isFinitePoint(ml.pointA) &&
          isFinitePoint(ml.pointB) &&
          ml.beamEndA.x === ml.pointA.x &&
          ml.beamEndA.y === ml.pointA.y &&
          ml.beamEndB.x === ml.pointB.x &&
          ml.beamEndB.y === ml.pointB.y
        ) {
          errors.push(`láser móvil ${ml.id || '(sin id)'} con haz degenerado en beamEndA/B`);
        }
      }
      if (ml.poweredByPlates) {
        for (const pId of ml.poweredByPlates) {
          if (!plateIds.has(pId)) {
            errors.push(`láser móvil ${ml.id} referencia placa inexistente: ${pId}`);
          }
        }
      }
    }
  }

  const segmentIds = new Set<string>();
  if (level.laserSegments) {
    for (const seg of level.laserSegments) {
      if (!seg.id) {
        errors.push('laserSegment sin id');
      } else {
        if (segmentIds.has(seg.id)) {
          errors.push(`id de laserSegment duplicado: ${seg.id}`);
        }
        segmentIds.add(seg.id);
      }
      if (!seg.laserId || !laserIds.has(seg.laserId)) {
        errors.push(
          `laserSegment ${seg.id || '(sin id)'} referencia láser inexistente: ${String(seg.laserId)}`
        );
      }
      if (
        !seg.range ||
        !Number.isFinite(seg.range.start) ||
        !Number.isFinite(seg.range.end) ||
        seg.range.start < 0 ||
        seg.range.end > 1 ||
        seg.range.start >= seg.range.end
      ) {
        errors.push(`laserSegment ${seg.id || '(sin id)'} con rango inválido [0..1]`);
      }
      if (typeof seg.initialEnabled !== 'boolean') {
        errors.push(`laserSegment ${seg.id || '(sin id)'} sin initialEnabled booleano`);
      }
    }
  }

  if (level.orderedSwitchSequence) {
    const seq = level.orderedSwitchSequence;
    if (seq.scope !== 'global') {
      errors.push('orderedSwitchSequence requiere scope = "global"');
    }
    if (seq.resetOnError !== true) {
      errors.push('orderedSwitchSequence requiere resetOnError = true');
    }
    if (!seq.switches || seq.switches.length === 0) {
      errors.push('orderedSwitchSequence debe definir al menos un interruptor');
    } else {
      const switchIds = new Set<string>();
      const orders = new Set<number>();
      for (const sw of seq.switches) {
        if (!sw.id) {
          errors.push('interruptor ordenado sin id');
        } else {
          if (switchIds.has(sw.id)) {
            errors.push(`id de interruptor ordenado duplicado: ${sw.id}`);
          }
          switchIds.add(sw.id);
        }
        if (!sw.label) {
          errors.push(`interruptor ${sw.id || '(sin id)'} sin label`);
        }
        if (!Number.isFinite(sw.x) || !Number.isFinite(sw.y) || !Number.isFinite(sw.r) || sw.r <= 0) {
          errors.push(`interruptor ${sw.id || '(sin id)'} con geometría inválida`);
        }
        if (!Number.isInteger(sw.order) || sw.order < 1 || sw.order > seq.switches.length) {
          errors.push(
            `interruptor ${sw.id || '(sin id)'} con orden fuera de rango (1–${seq.switches.length}): ${String(sw.order)}`
          );
        } else if (orders.has(sw.order)) {
          errors.push(`orden de interruptor duplicado: ${sw.order}`);
        } else {
          orders.add(sw.order);
        }
        if (sw.effect !== 'enable' && sw.effect !== 'disable') {
          errors.push(`interruptor ${sw.id || '(sin id)'} con efecto inválido`);
        }
        if (!sw.targetSegmentIds || sw.targetSegmentIds.length === 0) {
          errors.push(`interruptor ${sw.id || '(sin id)'} sin targetSegmentIds`);
        } else {
          for (const targetSegId of sw.targetSegmentIds) {
            if (!segmentIds.has(targetSegId)) {
              errors.push(
                `interruptor ${sw.id} referencia laserSegment inexistente: ${targetSegId}`
              );
            }
          }
        }
      }
    }
  }

  return errors;
}

export function assertValidLevelDef(level: LevelDef): void {
  const errors = validateLevelDef(level);
  if (errors.length > 0) {
    throw new LevelValidationError(level.id, errors);
  }
}

export function validateLevels(levels: readonly LevelDef[]): void {
  if (levels.length === 0 || levels.length > MAX_SUPPORTED_LEVELS) {
    throw new Error(
      `Cantidad de niveles fuera de rango (1–${MAX_SUPPORTED_LEVELS}): ${levels.length}`
    );
  }
  const seenIds = new Set<number>();
  for (const lvl of levels) {
    if (seenIds.has(lvl.id)) {
      throw new LevelValidationError(lvl.id, [`id de nivel duplicado: ${lvl.id}`]);
    }
    seenIds.add(lvl.id);
    assertValidLevelDef(lvl);
  }
}

validateLevels(LEVELS);
