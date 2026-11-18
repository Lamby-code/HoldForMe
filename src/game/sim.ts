import {
  assertValidLevelDef,
  LEVELS,
  type LevelDef,
  type MovingLaser,
  type Rect,
} from './levels.ts';

export const TICK_HZ = 60;
export const LOOP_SECONDS = 20;
export const FRAMES_PER_LAP = TICK_HZ * LOOP_SECONDS; // 1200 frames per lap
export const PLAYER_RADIUS = 12;
export const PLAYER_SPEED = 220; // px/s
export const STEP_DISTANCE = PLAYER_SPEED / TICK_HZ;
export const TRAIL_HALF_WIDTH = 12;
export const TRAIL_SAMPLE_INTERVAL = 4;
export const SPAWN_SAFE_RADIUS = 44;
export const LASER_BEAM_HALF_WIDTH = 5;
export const SWITCH_ACTIVATION_MARGIN = 4;
export const DEATH_SLOWMO_FRAMES = 24; // 0.4s at 60 Hz
const RESOLVE_PASSES = 2;

export interface Frame {
  x: number;
  y: number;
  angle: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type DeathCause = 'crush' | 'laser' | 'timeout';

export interface SimState {
  levelIndex: number;
  /** Optional custom level definition (e.g. test fixtures) without mutating campaign LEVELS */
  levelDef?: LevelDef;
  lap: number;
  t: number;
  player: {
    x: number;
    y: number;
    r: number;
    angle: number;
  };
  laps: Frame[][];
  current: Frame[];
  dead: boolean;
  cause: DeathCause | null;
  culpritLap: number | null;
  deathTimer: number;
}

export interface GhostEntity {
  lapIndex: number;
  x: number;
  y: number;
  angle: number;
}

export interface ActiveLaserSegment {
  id: string;
  laserId: string;
  segmentId: string | null;
  isMoving: boolean;
  powered: boolean;
  enabled: boolean;
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fullX2: number;
  fullY2: number;
  blockedByLap: number | null;
}

export interface DerivedOrderedSwitch {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  order: number;
  targetSegmentIds: string[];
  effect: 'enable' | 'disable';
  activated: boolean;
  isExpected: boolean;
  playerInside: boolean;
}

export interface DerivedSequenceState {
  present: boolean;
  currentStep: number;
  expectedOrder: number | null;
  totalSteps: number;
  completed: boolean;
  errorCount: number;
  hasRecentError: boolean;
  lastErrorTick: number | null;
  lastErrorSwitchId: string | null;
  switches: DerivedOrderedSwitch[];
  segmentEnabled: Record<string, boolean>;
}

export interface DerivedWorld {
  level: LevelDef;
  ghosts: GhostEntity[];
  pressedPlates: Set<string>;
  openDoors: Set<string>;
  lasers: ActiveLaserSegment[];
  sequence: DerivedSequenceState;
  won: boolean;
}

export function createInitialState(levelIndex: number): SimState {
  const safeIdx = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
  const level = LEVELS[safeIdx];
  return createInitialStateForLevel(level, safeIdx, false);
}

/**
 * Pure constructor accepting an arbitrary validated LevelDef (for test fixtures per D7).
 */
export function createInitialStateForLevel(
  level: LevelDef,
  levelIndex = 0,
  attachLevelDef = true
): SimState {
  assertValidLevelDef(level);
  const initialFrame: Frame = { x: level.spawn.x, y: level.spawn.y, angle: 0 };
  return {
    levelIndex,
    ...(attachLevelDef ? { levelDef: level } : {}),
    lap: 0,
    t: 0,
    player: {
      x: level.spawn.x,
      y: level.spawn.y,
      r: PLAYER_RADIUS,
      angle: 0,
    },
    laps: [],
    current: [initialFrame],
    dead: false,
    cause: null,
    culpritLap: null,
    deathTimer: 0,
  };
}

export function getLevel(state: SimState): LevelDef {
  return state.levelDef ?? LEVELS[state.levelIndex];
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * D8 deterministic ping-pong interpolation factor u(t) in [0, 1] (0 at A, 1 at B).
 */
export function getMovingLaserFactor(
  periodFrames: number,
  phaseOffsetFrames: number,
  t: number
): number {
  const q = ((t + phaseOffsetFrames) % periodFrames + periodFrames) % periodFrames;
  return 1 - Math.abs((2 * q) / periodFrames - 1);
}

/**
 * Evaluates effective moving laser beam endpoints (x1, y1) -> (x2, y2) at frame t.
 */
export function getMovingLaserEndpoints(
  ml: MovingLaser,
  t: number
): { x1: number; y1: number; x2: number; y2: number; u: number } {
  const u = getMovingLaserFactor(ml.periodFrames, ml.phaseOffsetFrames, t);
  const ax = ml.pointA.x + (ml.pointB.x - ml.pointA.x) * u;
  const ay = ml.pointA.y + (ml.pointB.y - ml.pointA.y) * u;

  if (ml.beamEndA && ml.beamEndB) {
    const bx = ml.beamEndA.x + (ml.beamEndB.x - ml.beamEndA.x) * u;
    const by = ml.beamEndA.y + (ml.beamEndB.y - ml.beamEndA.y) * u;
    return { x1: ax, y1: ay, x2: bx, y2: by, u };
  }

  if (ml.beamOffset) {
    return {
      x1: ax,
      y1: ay,
      x2: ax + ml.beamOffset.x,
      y2: ay + ml.beamOffset.y,
      u,
    };
  }

  return { x1: ml.pointA.x, y1: ml.pointA.y, x2: ax, y2: ay, u };
}

/**
 * Pure deterministic evaluator for ordered switches, global sequence state, and laserSegments (D2, D3, D4).
 * Evaluates outside->inside transitions strictly from active player's chronological recorded frames
 * across past laps and the current lap up to t (so rewind/seek and cross-lap progress remain 100% deterministic).
 */
export function evaluateOrderedSequence(
  level: LevelDef,
  currentFrames: readonly Frame[],
  dead = false,
  pastLaps: ReadonlyArray<readonly Frame[]> = []
): DerivedSequenceState {
  const segmentEnabled: Record<string, boolean> = {};
  const segmentInitial = new Map<string, boolean>();
  for (const seg of level.laserSegments ?? []) {
    segmentEnabled[seg.id] = seg.initialEnabled;
    segmentInitial.set(seg.id, seg.initialEnabled);
  }

  const seq = level.orderedSwitchSequence;
  if (!seq || seq.switches.length === 0) {
    return {
      present: false,
      currentStep: 0,
      expectedOrder: null,
      totalSteps: 0,
      completed: false,
      errorCount: 0,
      hasRecentError: false,
      lastErrorTick: null,
      lastErrorSwitchId: null,
      switches: [],
      segmentEnabled,
    };
  }

  const sortedSwitches = [...seq.switches].sort((a, b) => a.order - b.order);
  const totalSteps = sortedSwitches.length;

  let currentStep = 0;
  let completed = false;
  let errorCount = 0;
  let lastErrorTick: number | null = null;
  let lastErrorSwitchId: string | null = null;
  let lastEventType: 'advance' | 'complete' | 'error' | null = null;

  const restoreControlledSegments = () => {
    for (const swItem of sortedSwitches) {
      for (const segId of swItem.targetSegmentIds) {
        const init = segmentInitial.get(segId);
        if (init !== undefined) {
          segmentEnabled[segId] = init;
        }
      }
    }
  };

  const recordedLaps: ReadonlyArray<readonly Frame[]> = [...pastLaps, currentFrames];
  for (let lapIdx = 0; lapIdx < recordedLaps.length; lapIdx++) {
    const frames = recordedLaps[lapIdx];
    for (let i = 1; i < frames.length; i++) {
      const prev = frames[i - 1];
      const cur = frames[i];

      for (const sw of sortedSwitches) {
        const threshold = sw.r + SWITCH_ACTIVATION_MARGIN;
        const wasInside = dist(prev.x, prev.y, sw.x, sw.y) <= threshold;
        const isInside = dist(cur.x, cur.y, sw.x, sw.y) <= threshold;

        if (!wasInside && isInside) {
          if (!completed && sw.order === currentStep + 1) {
            currentStep += 1;
            if (currentStep === totalSteps) {
              completed = true;
              lastEventType = 'complete';
              for (const swItem of sortedSwitches) {
                for (const segId of swItem.targetSegmentIds) {
                  if (segmentInitial.has(segId)) {
                    segmentEnabled[segId] = swItem.effect === 'enable';
                  }
                }
              }
            } else {
              lastEventType = 'advance';
            }
          } else {
            currentStep = 0;
            completed = false;
            errorCount += 1;
            lastErrorTick = i;
            lastErrorSwitchId = sw.id;
            lastEventType = 'error';
            restoreControlledSegments();
          }
        }
      }
    }
  }

  const expectedOrder = completed ? null : currentStep + 1;
  const lastFrame = currentFrames.length > 0 ? currentFrames[currentFrames.length - 1] : null;

  const derivedSwitches: DerivedOrderedSwitch[] = sortedSwitches.map((sw) => {
    const threshold = sw.r + SWITCH_ACTIVATION_MARGIN;
    const playerInside = Boolean(
      !dead && lastFrame && dist(lastFrame.x, lastFrame.y, sw.x, sw.y) <= threshold
    );
    return {
      id: sw.id,
      label: sw.label,
      x: sw.x,
      y: sw.y,
      r: sw.r,
      order: sw.order,
      targetSegmentIds: sw.targetSegmentIds,
      effect: sw.effect,
      activated: completed || sw.order <= currentStep,
      isExpected: !completed && sw.order === expectedOrder,
      playerInside,
    };
  });

  return {
    present: true,
    currentStep,
    expectedOrder,
    totalSteps,
    completed,
    errorCount,
    hasRecentError: lastEventType === 'error',
    lastErrorTick,
    lastErrorSwitchId,
    switches: derivedSwitches,
    segmentEnabled,
  };
}

export function getActiveGhosts(state: SimState, atT = state.t): GhostEntity[] {
  const ghosts: GhostEntity[] = [];
  for (let i = 0; i < state.lap; i++) {
    const frames = state.laps[i];
    if (!frames || frames.length === 0) continue;
    const idx = Math.max(0, Math.min(atT, frames.length - 1));
    const f = frames[idx];
    ghosts.push({
      lapIndex: i,
      x: f.x,
      y: f.y,
      angle: f.angle,
    });
  }
  return ghosts;
}

export function getFutureGhostFrame(state: SimState, lapIndex: number, offsetFrames: number): Frame | null {
  const frames = state.laps[lapIndex];
  if (!frames || frames.length === 0) return null;
  const targetT = state.t + offsetFrames;
  if (targetT >= frames.length) {
    return frames[frames.length - 1];
  }
  return frames[targetT];
}

function closestPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { x: number; y: number; t: number; dist: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return { x: ax, y: ay, t: 0, dist: Math.hypot(px - ax, py - ay) };
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return { x: cx, y: cy, t, dist: Math.hypot(px - cx, py - cy) };
}

export function deriveWorld(state: SimState): DerivedWorld {
  const level = getLevel(state);
  const ghosts = getActiveGhosts(state);

  const pressedPlates = new Set<string>();
  for (const plate of level.plates) {
    const threshold = plate.r + 4;
    let isPressed = false;
    if (!state.dead && dist(state.player.x, state.player.y, plate.x, plate.y) <= threshold) {
      isPressed = true;
    } else {
      for (const g of ghosts) {
        if (dist(g.x, g.y, plate.x, plate.y) <= threshold) {
          isPressed = true;
          break;
        }
      }
    }
    if (isPressed) pressedPlates.add(plate.id);
  }

  const openDoors = new Set<string>();
  for (const door of level.doors) {
    const allPressed = door.requiredPlates.every((pId) => pressedPlates.has(pId));
    if (allPressed) openDoors.add(door.id);
  }

  const sequence = evaluateOrderedSequence(level, state.current, state.dead, state.laps);

  const baseLasers: Array<{
    id: string;
    isMoving: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    powered: boolean;
  }> = [];

  for (const laser of level.lasers) {
    const powered =
      !laser.poweredByPlates ||
      laser.poweredByPlates.length === 0 ||
      laser.poweredByPlates.every((pId) => pressedPlates.has(pId));
    baseLasers.push({
      id: laser.id,
      isMoving: false,
      x1: laser.x1,
      y1: laser.y1,
      x2: laser.x2,
      y2: laser.y2,
      powered,
    });
  }

  for (const ml of level.movingLasers ?? []) {
    const powered =
      !ml.poweredByPlates ||
      ml.poweredByPlates.length === 0 ||
      ml.poweredByPlates.every((pId) => pressedPlates.has(pId));
    const geom = getMovingLaserEndpoints(ml, state.t);
    baseLasers.push({
      id: ml.id,
      isMoving: true,
      x1: geom.x1,
      y1: geom.y1,
      x2: geom.x2,
      y2: geom.y2,
      powered,
    });
  }

  const segmentsByLaser = new Map<string, NonNullable<LevelDef['laserSegments']>>();
  for (const seg of level.laserSegments ?? []) {
    const list = segmentsByLaser.get(seg.laserId) ?? [];
    list.push(seg);
    segmentsByLaser.set(seg.laserId, list);
  }

  const lasers: ActiveLaserSegment[] = [];
  for (const base of baseLasers) {
    const attachedSegments = segmentsByLaser.get(base.id);

    if (!attachedSegments || attachedSegments.length === 0) {
      // Implicit single full segment (0..1) preserving existing static laser contract
      if (!base.powered) {
        lasers.push({
          id: base.id,
          laserId: base.id,
          segmentId: null,
          isMoving: base.isMoving,
          powered: false,
          enabled: true,
          active: false,
          x1: base.x1,
          y1: base.y1,
          x2: base.x2,
          y2: base.y2,
          fullX2: base.x2,
          fullY2: base.y2,
          blockedByLap: null,
        });
        continue;
      }

      let bestT = 1;
      let blockedByLap: number | null = null;
      for (const g of ghosts) {
        const hit = closestPointOnSegment(g.x, g.y, base.x1, base.y1, base.x2, base.y2);
        if (hit.dist <= PLAYER_RADIUS + LASER_BEAM_HALF_WIDTH && hit.t < bestT) {
          bestT = hit.t;
          blockedByLap = g.lapIndex;
        }
      }

      const endX = base.x1 + (base.x2 - base.x1) * bestT;
      const endY = base.y1 + (base.y2 - base.y1) * bestT;
      lasers.push({
        id: base.id,
        laserId: base.id,
        segmentId: null,
        isMoving: base.isMoving,
        powered: true,
        enabled: true,
        active: true,
        x1: base.x1,
        y1: base.y1,
        x2: endX,
        y2: endY,
        fullX2: base.x2,
        fullY2: base.y2,
        blockedByLap,
      });
      continue;
    }

    // Explicit laserSegment entities ordered along beam [0..1]
    const orderedSegs = [...attachedSegments].sort((a, b) => a.range.start - b.range.start);
    let upstreamBlockedLap: number | null = null;

    for (const seg of orderedSegs) {
      const sx1 = base.x1 + (base.x2 - base.x1) * seg.range.start;
      const sy1 = base.y1 + (base.y2 - base.y1) * seg.range.start;
      const sx2 = base.x1 + (base.x2 - base.x1) * seg.range.end;
      const sy2 = base.y1 + (base.y2 - base.y1) * seg.range.end;
      const enabled = sequence.segmentEnabled[seg.id] ?? seg.initialEnabled;

      // Precedence 1: poweredByPlates off -> totally inactive
      if (!base.powered) {
        lasers.push({
          id: seg.id,
          laserId: base.id,
          segmentId: seg.id,
          isMoving: base.isMoving,
          powered: false,
          enabled,
          active: false,
          x1: sx1,
          y1: sy1,
          x2: sx2,
          y2: sy2,
          fullX2: sx2,
          fullY2: sy2,
          blockedByLap: null,
        });
        continue;
      }

      // Precedence 2: disabled by sequence/segment -> non-harmful (opens path)
      if (!enabled) {
        lasers.push({
          id: seg.id,
          laserId: base.id,
          segmentId: seg.id,
          isMoving: base.isMoving,
          powered: true,
          enabled: false,
          active: false,
          x1: sx1,
          y1: sy1,
          x2: sx2,
          y2: sy2,
          fullX2: sx2,
          fullY2: sy2,
          blockedByLap: null,
        });
        continue;
      }

      // Precedence 3: upstream enabled segment already blocked by a ghost
      if (upstreamBlockedLap !== null) {
        lasers.push({
          id: seg.id,
          laserId: base.id,
          segmentId: seg.id,
          isMoving: base.isMoving,
          powered: true,
          enabled: true,
          active: false,
          x1: sx1,
          y1: sy1,
          x2: sx1,
          y2: sy1,
          fullX2: sx2,
          fullY2: sy2,
          blockedByLap: upstreamBlockedLap,
        });
        continue;
      }

      // Precedence 3/4: check ghost blocking along this active segment
      let bestT = 1;
      let blockedByLap: number | null = null;
      for (const g of ghosts) {
        const hit = closestPointOnSegment(g.x, g.y, sx1, sy1, sx2, sy2);
        if (hit.dist <= PLAYER_RADIUS + LASER_BEAM_HALF_WIDTH && hit.t < bestT) {
          bestT = hit.t;
          blockedByLap = g.lapIndex;
        }
      }
      if (blockedByLap !== null) {
        upstreamBlockedLap = blockedByLap;
      }

      const endX = sx1 + (sx2 - sx1) * bestT;
      const endY = sy1 + (sy2 - sy1) * bestT;
      lasers.push({
        id: seg.id,
        laserId: base.id,
        segmentId: seg.id,
        isMoving: base.isMoving,
        powered: true,
        enabled: true,
        active: true,
        x1: sx1,
        y1: sy1,
        x2: endX,
        y2: endY,
        fullX2: sx2,
        fullY2: sy2,
        blockedByLap,
      });
    }
  }

  const won =
    !state.dead &&
    dist(state.player.x, state.player.y, level.goal.x, level.goal.y) <=
      state.player.r + level.goal.r;

  return { level, ghosts, pressedPlates, openDoors, lasers, sequence, won };
}

export function isWon(state: SimState): boolean {
  if (state.dead) return false;
  const level = getLevel(state);
  return dist(state.player.x, state.player.y, level.goal.x, level.goal.y) <= state.player.r + level.goal.r;
}

function resolveCircleRectAxis(
  x: number,
  y: number,
  r: number,
  rect: Rect,
  axis: 'x' | 'y'
): { x: number; y: number } {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - closestX;
  const dy = y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= r * r) return { x, y };

  if (distSq === 0) {
    // Center is inside rect; push out along shortest axis
    const leftPen = x - rect.x;
    const rightPen = rect.x + rect.w - x;
    const topPen = y - rect.y;
    const bottomPen = rect.y + rect.h - y;
    const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
    if (minPen === leftPen) return { x: rect.x - r, y };
    if (minPen === rightPen) return { x: rect.x + rect.w + r, y };
    if (minPen === topPen) return { x, y: rect.y - r };
    return { x, y: rect.y + rect.h + r };
  }

  const d = Math.sqrt(distSq);
  const overlap = r - d;
  if (axis === 'x') {
    if (dx !== 0) {
      return { x: x + (dx / d) * overlap, y };
    }
  } else {
    if (dy !== 0) {
      return { x, y: y + (dy / d) * overlap };
    }
  }
  return { x: x + (dx / d) * overlap, y: y + (dy / d) * overlap };
}

export function getTrailCapsules(
  frames: Frame[],
  spawn: { x: number; y: number }
): Array<{ ax: number; ay: number; bx: number; by: number }> {
  const capsules: Array<{ ax: number; ay: number; bx: number; by: number }> = [];
  if (frames.length < 2) return capsules;

  let prev = frames[0];
  for (let i = TRAIL_SAMPLE_INTERVAL; i < frames.length; i += TRAIL_SAMPLE_INTERVAL) {
    const cur = frames[i];
    const midX = (prev.x + cur.x) * 0.5;
    const midY = (prev.y + cur.y) * 0.5;
    if (dist(midX, midY, spawn.x, spawn.y) > SPAWN_SAFE_RADIUS) {
      capsules.push({ ax: prev.x, ay: prev.y, bx: cur.x, by: cur.y });
    }
    prev = cur;
  }

  const last = frames[frames.length - 1];
  if (last !== prev) {
    const midX = (prev.x + last.x) * 0.5;
    const midY = (prev.y + last.y) * 0.5;
    if (dist(midX, midY, spawn.x, spawn.y) > SPAWN_SAFE_RADIUS) {
      capsules.push({ ax: prev.x, ay: prev.y, bx: last.x, by: last.y });
    }
  }
  return capsules;
}

function resolveSolidGeometry(
  x: number,
  y: number,
  r: number,
  rects: Rect[],
  trailCapsules: Array<{ ax: number; ay: number; bx: number; by: number }>,
  moveX: number,
  moveY: number
): { x: number; y: number } {
  let px = x + moveX;
  let py = y;

  for (let pass = 0; pass < RESOLVE_PASSES; pass++) {
    for (const rect of rects) {
      const res = resolveCircleRectAxis(px, py, r, rect, 'x');
      px = res.x;
      py = res.y;
    }
  }

  py += moveY;
  for (let pass = 0; pass < RESOLVE_PASSES; pass++) {
    for (const rect of rects) {
      const res = resolveCircleRectAxis(px, py, r, rect, 'y');
      px = res.x;
      py = res.y;
    }
  }

  // Circle vs past trail capsules
  const minCenterDist = r + TRAIL_HALF_WIDTH;
  for (let pass = 0; pass < RESOLVE_PASSES; pass++) {
    for (const cap of trailCapsules) {
      const hit = closestPointOnSegment(px, py, cap.ax, cap.ay, cap.bx, cap.by);
      if (hit.dist < minCenterDist) {
        if (hit.dist > 1e-6) {
          const push = minCenterDist - hit.dist;
          px += ((px - hit.x) / hit.dist) * push;
          py += ((py - hit.y) / hit.dist) * push;
        } else {
          px += minCenterDist;
        }
      }
    }
    // Re-check walls after trail push on both axes
    for (const rect of rects) {
      const rx = resolveCircleRectAxis(px, py, r, rect, 'x');
      const ry = resolveCircleRectAxis(rx.x, rx.y, r, rect, 'y');
      px = ry.x;
      py = ry.y;
    }
  }

  return { x: px, y: py };
}

function checkGeometryOverlap(
  px: number,
  py: number,
  r: number,
  rects: Rect[],
  trailCapsules: Array<{ ax: number; ay: number; bx: number; by: number }>
): boolean {
  const tolerance = 2.0;
  for (const rect of rects) {
    const closestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));
    const d = Math.hypot(px - closestX, py - closestY);
    if (d < r - tolerance) return true;
  }
  const minDist = r + TRAIL_HALF_WIDTH - tolerance;
  for (const cap of trailCapsules) {
    const hit = closestPointOnSegment(px, py, cap.ax, cap.ay, cap.bx, cap.by);
    if (hit.dist < minDist) return true;
  }
  return false;
}

export function stepSim(state: SimState, input: InputState): SimState {
  if (state.dead) {
    return {
      ...state,
      deathTimer: Math.min(DEATH_SLOWMO_FRAMES, state.deathTimer + 1),
    };
  }

  if (isWon(state)) {
    return state;
  }

  const level = getLevel(state);

  // Movement vector
  let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(ix, iy);
  let moveX = 0;
  let moveY = 0;
  let angle = state.player.angle;
  if (mag > 0) {
    ix /= mag;
    iy /= mag;
    moveX = ix * STEP_DISTANCE;
    moveY = iy * STEP_DISTANCE;
    angle = Math.atan2(iy, ix);
  }

  // Pre-derive doors from current positions
  const preWorld = deriveWorld(state);
  const solidRects: Rect[] = [...level.walls];
  for (const door of level.doors) {
    if (!preWorld.openDoors.has(door.id)) {
      solidRects.push({ x: door.x, y: door.y, w: door.w, h: door.h });
    }
  }

  // Collect solid trail capsules from all completed past laps
  const trailCapsules: Array<{ ax: number; ay: number; bx: number; by: number }> = [];
  for (let i = 0; i < state.lap; i++) {
    trailCapsules.push(...getTrailCapsules(state.laps[i], level.spawn));
  }

  // 1. Resolve player movement against walls, closed doors, and past trails
  let resolved = resolveSolidGeometry(
    state.player.x,
    state.player.y,
    state.player.r,
    solidRects,
    trailCapsules,
    moveX,
    moveY
  );

  // 2. Resolve player vs active solid ghosts outside the spawn pad (circle-circle push-out)
  const ghosts = getActiveGhosts(state).filter(
    (g) => dist(g.x, g.y, level.spawn.x, level.spawn.y) >= SPAWN_SAFE_RADIUS
  );
  const ghostMinDist = state.player.r + PLAYER_RADIUS;
  let touchedGhostLap: number | null = null;

  for (const g of ghosts) {
    const dx = resolved.x - g.x;
    const dy = resolved.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < ghostMinDist) {
      touchedGhostLap = g.lapIndex;
      if (d > 1e-5) {
        const push = ghostMinDist - d;
        resolved.x += (dx / d) * push;
        resolved.y += (dy / d) * push;
      } else {
        resolved.x += Math.cos(g.angle) * ghostMinDist || ghostMinDist;
        resolved.y += Math.sin(g.angle) * ghostMinDist;
      }
    }
  }

  // 3. Re-resolve walls/trails after ghost push-out
  if (touchedGhostLap !== null) {
    resolved = resolveSolidGeometry(
      resolved.x,
      resolved.y,
      state.player.r,
      solidRects,
      trailCapsules,
      0,
      0
    );
  }

  // 4. Detect crush: if after resolving solid geometry, player still overlaps any ghost or geometry
  let crushedByLap: number | null = null;
  for (const g of ghosts) {
    const d = dist(resolved.x, resolved.y, g.x, g.y);
    if (d < ghostMinDist - 2.0) {
      crushedByLap = g.lapIndex;
      break;
    }
  }
  if (crushedByLap === null && touchedGhostLap !== null) {
    if (checkGeometryOverlap(resolved.x, resolved.y, state.player.r, solidRects, trailCapsules)) {
      crushedByLap = touchedGhostLap;
    }
  }

  if (crushedByLap !== null) {
    return {
      ...state,
      player: { ...state.player, x: resolved.x, y: resolved.y, angle },
      dead: true,
      cause: 'crush',
      culpritLap: crushedByLap,
      deathTimer: 0,
    };
  }

  // 5. Check active lasers (with new player frame included so switch deactivation takes effect immediately)
  const recordedCurrent = state.current.slice(0, state.t + 1);
  recordedCurrent.push({ x: resolved.x, y: resolved.y, angle });

  const nextPlayerState: SimState = {
    ...state,
    player: { ...state.player, x: resolved.x, y: resolved.y, angle },
  };
  const postWorld = deriveWorld({
    ...nextPlayerState,
    current: recordedCurrent,
  });

  for (const laser of postWorld.lasers) {
    if (!laser.active) continue;
    const hit = closestPointOnSegment(resolved.x, resolved.y, laser.x1, laser.y1, laser.x2, laser.y2);
    if (hit.dist <= state.player.r + LASER_BEAM_HALF_WIDTH - 2) {
      return {
        ...nextPlayerState,
        dead: true,
        cause: 'laser',
        culpritLap: null,
        deathTimer: 0,
      };
    }
  }

  // 6. Check goal win before advancing lap
  if (postWorld.won) {
    return {
      ...nextPlayerState,
      current: recordedCurrent,
    };
  }

  // 7. Advance frame / handle lap transition
  const nextT = state.t + 1;

  if (nextT >= FRAMES_PER_LAP) {
    if (state.lap + 1 < level.maxLaps) {
      const nextLaps = [...state.laps, recordedCurrent];
      const spawnFrame: Frame = { x: level.spawn.x, y: level.spawn.y, angle: 0 };
      return {
        ...state,
        lap: state.lap + 1,
        t: 0,
        player: {
          x: level.spawn.x,
          y: level.spawn.y,
          r: PLAYER_RADIUS,
          angle: 0,
        },
        laps: nextLaps,
        current: [spawnFrame],
        dead: false,
        cause: null,
        culpritLap: null,
        deathTimer: 0,
      };
    } else {
      return {
        ...nextPlayerState,
        current: recordedCurrent,
        dead: true,
        cause: 'timeout',
        culpritLap: null,
        deathTimer: 0,
      };
    }
  }

  return {
    ...nextPlayerState,
    t: nextT,
    current: recordedCurrent,
  };
}

export function rewindStep(state: SimState, steps = 1): SimState {
  let cur = state;
  if (cur.dead) {
    cur = {
      ...cur,
      dead: false,
      cause: null,
      culpritLap: null,
      deathTimer: 0,
    };
  }

  for (let s = 0; s < steps; s++) {
    if (cur.t > 0) {
      const nextT = cur.t - 1;
      const truncated = cur.current.slice(0, nextT + 1);
      const frame = truncated[nextT];
      cur = {
        ...cur,
        t: nextT,
        current: truncated,
        player: {
          ...cur.player,
          x: frame.x,
          y: frame.y,
          angle: frame.angle,
        },
      };
    } else if (cur.lap > 0) {
      const prevLap = cur.lap - 1;
      const prevFrames = cur.laps[prevLap];
      const nextLaps = cur.laps.slice(0, prevLap);
      const nextT = Math.max(0, prevFrames.length - 1);
      const truncated = prevFrames.slice(0, nextT + 1);
      const frame = truncated[nextT];
      cur = {
        ...cur,
        lap: prevLap,
        t: nextT,
        laps: nextLaps,
        current: truncated,
        player: {
          ...cur.player,
          x: frame.x,
          y: frame.y,
          angle: frame.angle,
        },
      };
    } else {
      break;
    }
  }
  return cur;
}

export function seekToFrame(state: SimState, targetLap: number, targetT: number): SimState {
  const clampedLap = Math.max(0, Math.min(state.lap, targetLap));
  const sourceFrames = clampedLap === state.lap ? state.current : state.laps[clampedLap];
  if (!sourceFrames || sourceFrames.length === 0) return state;

  const maxAllowedT = clampedLap === state.lap ? state.t : sourceFrames.length - 1;
  const clampedT = Math.max(0, Math.min(maxAllowedT, targetT));
  const truncated = sourceFrames.slice(0, clampedT + 1);
  const frame = truncated[clampedT];

  return {
    ...state,
    lap: clampedLap,
    t: clampedT,
    laps: state.laps.slice(0, clampedLap),
    current: truncated,
    player: {
      ...state.player,
      x: frame.x,
      y: frame.y,
      angle: frame.angle,
    },
    dead: false,
    cause: null,
    culpritLap: null,
    deathTimer: 0,
  };
}

export function finishCurrentLap(state: SimState): SimState {
  if (state.dead || isWon(state)) return state;
  const level = getLevel(state);
  if (state.lap + 1 >= level.maxLaps) return state;

  const startLap = state.lap;
  const idle: InputState = { up: false, down: false, left: false, right: false };
  let cur = state;
  let guard = 0;
  while (cur.lap === startLap && !cur.dead && !isWon(cur) && guard <= FRAMES_PER_LAP) {
    cur = stepSim(cur, idle);
    guard++;
  }
  return cur;
}

export function getDeathMessage(state: SimState): string {
  if (!state.dead || !state.cause) return '';
  if (state.cause === 'crush') {
    const lapNum = (state.culpritLap ?? 0) + 1;
    return `Te cerró tu vuelta ${lapNum}.`;
  }
  if (state.cause === 'laser') {
    return 'Te cortó el láser.';
  }
  return 'Se terminó el loop.';
}
