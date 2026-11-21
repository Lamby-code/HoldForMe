import assert from 'node:assert/strict';
import test from 'node:test';
import { getLapCode, getLapColor, LAP_META, MAX_LAPS } from './colors.ts';
import {
  assertValidLevelDef,
  CANVAS_H,
  CANVAS_W,
  LEVELS,
  LevelValidationError,
  validateLevelDef,
  type LevelDef,
} from './levels.ts';
import {
  createInitialState,
  createInitialStateForLevel,
  deriveWorld,
  evaluateOrderedSequence,
  finishCurrentLap,
  FRAMES_PER_LAP,
  getMovingLaserEndpoints,
  getMovingLaserFactor,
  isWon,
  rewindStep,
  seekToFrame,
  stepSim,
  type InputState,
  type SimState,
} from './sim.ts';

const IDLE: InputState = { up: false, down: false, left: false, right: false };

function steerTowards(state: SimState, tx: number, ty: number, tol = 4): InputState {
  const dx = tx - state.player.x;
  const dy = ty - state.player.y;
  return {
    left: dx < -tol,
    right: dx > tol,
    up: dy < -tol,
    down: dy > tol,
  };
}

function walkTo(state: SimState, tx: number, ty: number, maxTicks: number): SimState {
  let cur = state;
  for (let i = 0; i < maxTicks; i++) {
    if (Math.hypot(cur.player.x - tx, cur.player.y - ty) <= 6) {
      cur = stepSim(cur, IDLE);
    } else {
      cur = stepSim(cur, steerTowards(cur, tx, ty));
    }
  }
  return cur;
}

function runTicks(state: SimState, ticks: number, inputFn: (s: SimState) => InputState): SimState {
  let cur = state;
  for (let i = 0; i < ticks; i++) {
    cur = stepSim(cur, inputFn(cur));
  }
  return cur;
}

test('Canvas is 960x400 and all 10 campaign levels (N1-N10) pass O1 validation', () => {
  assert.equal(CANVAS_W, 960);
  assert.equal(CANVAS_H, 400);
  assert.equal(LEVELS.length, 10);
  for (let i = 0; i < LEVELS.length; i++) {
    assert.equal(LEVELS[i].id, i + 1);
    assert.deepEqual(validateLevelDef(LEVELS[i]), []);
  }
  const sixLapLevels = LEVELS.filter((l) => l.maxLaps === 6);
  assert.equal(sixLapLevels.length, 0);

  assert.equal(LEVELS[3].maxLaps, 3);
  assert.equal(LEVELS[4].maxLaps, 2);
  assert.equal(LEVELS[4].movingLasers?.length, 1);
  assert.equal(LEVELS[4].orderedSwitchSequence, undefined);
  assert.equal(LEVELS[5].maxLaps, 2);
  assert.equal(LEVELS[5].movingLasers, undefined);
  assert.equal(LEVELS[5].orderedSwitchSequence?.switches.length, 2);
  assert.equal(LEVELS[5].laserSegments?.length, 1);
  assert.equal(LEVELS[6].maxLaps, 3);
  assert.equal(LEVELS[6].movingLasers?.length, 1);
  assert.equal(LEVELS[6].orderedSwitchSequence?.switches.length, 3);
  assert.equal(LEVELS[6].laserSegments?.length, 2);

  // N8: 3 laps, 2 switches, 1 segment, 1 moving laser
  assert.equal(LEVELS[7].maxLaps, 3);
  assert.equal(LEVELS[7].movingLasers?.length, 1);
  assert.equal(LEVELS[7].orderedSwitchSequence?.switches.length, 2);
  assert.equal(LEVELS[7].laserSegments?.length, 1);

  // N9: 3 laps, 3 switches, 2 segments, 1 moving laser
  assert.equal(LEVELS[8].maxLaps, 3);
  assert.equal(LEVELS[8].movingLasers?.length, 1);
  assert.equal(LEVELS[8].orderedSwitchSequence?.switches.length, 3);
  assert.equal(LEVELS[8].laserSegments?.length, 2);

  // N10: 3 laps, 2 plates, 2 doors, 1 moving + 1 static laser, 3 switches, 2 segments
  assert.equal(LEVELS[9].maxLaps, 3);
  assert.equal(LEVELS[9].plates.length, 2);
  assert.equal(LEVELS[9].doors.length, 2);
  assert.equal(LEVELS[9].lasers.length, 1);
  assert.equal(LEVELS[9].movingLasers?.length, 1);
  assert.equal(LEVELS[9].orderedSwitchSequence?.switches.length, 3);
  assert.equal(LEVELS[9].laserSegments?.length, 2);
});

test('Level 1 (Caminar) can be solved in 1 lap on 960x400', () => {
  let s = createInitialState(0);
  s = walkTo(s, 300, 60, 90);
  s = walkTo(s, 560, 60, 100);
  s = walkTo(s, 820, 316, 160);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 2 (El sostén) solves in 2 laps and past trail is solid on 960x400', () => {
  let s = createInitialState(1);
  // Lap 1: stand on Plate A (360, 200)
  s = walkTo(s, 360, 200, FRAMES_PER_LAP);
  assert.equal(s.lap, 1);

  // Lap 2: go around Lap 1 trail via top corridor and reach Goal (830, 200)
  s = walkTo(s, 120, 100, 45);
  s = walkTo(s, 520, 100, 140);
  s = walkTo(s, 830, 200, 140);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 3 (El relevo) solves in 3 laps on 960x400', () => {
  let s = createInitialState(2);
  // Lap 1: go up to Plate A (210, 100) and hold
  s = walkTo(s, 110, 100, 70);
  s = walkTo(s, 210, 100, FRAMES_PER_LAP - 70);
  assert.equal(s.lap, 1);

  // Lap 2: cross Door 1 (y=210) and hold Plate B (510, 308)
  s = walkTo(s, 290, 280, 70);
  s = walkTo(s, 290, 210, 40);
  s = walkTo(s, 420, 210, 55);
  s = walkTo(s, 510, 308, FRAMES_PER_LAP - 165);
  assert.equal(s.lap, 2);

  // Lap 3: weave between Lap 1 and Lap 2 trails above y=146 through Door 1 and Door 2 to Goal
  s = walkTo(s, 200, 280, 40);
  s = walkTo(s, 200, 146, 55);
  s = walkTo(s, 560, 146, 120);
  s = walkTo(s, 560, 210, 35);
  s = walkTo(s, 826, 210, 100);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 4 (La cuadrilla) solves in 3 laps (V1-V3) conserving A, B, D1, D2, L1', () => {
  let s = createInitialState(3);

  // V1: hold Plate A (80, 88) for ~7s so D1 opens for Ghost 2, then move along bottom to block L1 at (520, 348)
  s = walkTo(s, 80, 88, 60);
  s = runTicks(s, 360, () => IDLE);
  s = walkTo(s, 64, 88, 15);
  s = walkTo(s, 64, 348, 90);
  s = walkTo(s, 520, 348, 150);
  s = runTicks(s, FRAMES_PER_LAP - 675, () => IDLE);
  assert.equal(s.lap, 1);

  // V2: enter through Door 1 (300, 116) while Ghost 1 holds A, then hold Plate B (480, 96)
  s = walkTo(s, 300, 116, 70);
  s = walkTo(s, 480, 96, FRAMES_PER_LAP - 70);
  assert.equal(s.lap, 2);

  // V3: wait until Ghost 1 blocks L1 and Ghost 2 holds B (t = 700)
  s = runTicks(s, 700, () => IDLE);
  const world = deriveWorld(s);
  assert.equal(world.pressedPlates.has('B'), true);
  assert.equal(world.openDoors.has('D2'), true);
  assert.equal(world.lasers[0].active, true);
  assert.equal(world.lasers[0].blockedByLap, 0);

  // Cross under Ghost 1's blocked L1 and through open Door D2 to Goal (840, 260)
  s = walkTo(s, 520, 260, 120);
  s = walkTo(s, 840, 260, 110);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 4 kills player with laser L1 when Ghost 1 holds A without blocking L1', () => {
  let s = createInitialState(3);
  // V1: hold Plate A the entire lap (never move to block L1)
  s = walkTo(s, 80, 88, FRAMES_PER_LAP);
  assert.equal(s.lap, 1);

  // V2: cross D1 and hold Plate B (powers L1 and opens D2)
  s = walkTo(s, 300, 116, 70);
  s = walkTo(s, 480, 96, FRAMES_PER_LAP - 70);
  assert.equal(s.lap, 2);

  // V3: wait until B is active, then try to cross L1 at (520, 260)
  s = runTicks(s, 180, () => IDLE);
  s = walkTo(s, 520, 260, 130);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');
});

test('Level 4 triggers timeout when Lap 3 (final lap) runs out without reaching Goal', () => {
  let s = createInitialState(3);
  s = runTicks(s, FRAMES_PER_LAP * 3, () => IDLE);
  assert.equal(s.lap, 2);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'timeout');
});

test('Rewind and seekToFrame restore exact past state and truncate future', () => {
  let s = createInitialState(0);
  s = runTicks(s, 60, () => ({ up: false, down: false, left: false, right: true }));
  const posAt60 = { x: s.player.x, y: s.player.y };
  s = runTicks(s, 60, () => ({ up: true, down: false, left: false, right: false }));
  assert.notEqual(s.player.y, posAt60.y);

  const rewound = rewindStep(s, 60);
  assert.equal(rewound.t, 60);
  assert.equal(rewound.player.x, posAt60.x);
  assert.equal(rewound.player.y, posAt60.y);

  const sought = seekToFrame(s, 0, 0);
  assert.equal(sought.t, 0);
  assert.equal(sought.current.length, 1);
});

test('finishCurrentLap holds current position until end of lap and advances cleanly', () => {
  let s = createInitialState(1);
  // Walk onto Plate A (360, 200) and end lap early
  s = walkTo(s, 360, 200, 90);
  assert.equal(s.lap, 0);
  const posOnPlate = { x: s.player.x, y: s.player.y };

  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);
  assert.equal(s.t, 0);
  assert.equal(s.laps[0].length, FRAMES_PER_LAP + 1);
  assert.equal(s.laps[0][FRAMES_PER_LAP].x, posOnPlate.x);
  assert.equal(s.laps[0][FRAMES_PER_LAP].y, posOnPlate.y);

  // In Lap 2, Ghost 1 holds Plate A so Door 1 stays open while player goes to Goal
  s = walkTo(s, 120, 100, 45);
  s = walkTo(s, 520, 100, 140);
  s = walkTo(s, 830, 200, 140);
  assert.equal(isWon(s), true);
});

test('Running out of time on the final lap triggers timeout loss', () => {
  let s = createInitialState(0); // Level 1 has 1 lap
  s = runTicks(s, FRAMES_PER_LAP, () => IDLE);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'timeout');
  assert.equal(isWon(s), false);
});

test('O1 explicit rejection rejects maxLaps outside 1..6 and invalid extensibility metadata', () => {
  const baseLevel: LevelDef = structuredClone(LEVELS[0]);

  // 1. maxLaps out of 1..6 (0 and 7)
  assert.throws(
    () => assertValidLevelDef({ ...baseLevel, maxLaps: 0 }),
    LevelValidationError
  );
  assert.throws(
    () => assertValidLevelDef({ ...baseLevel, maxLaps: 7 }),
    LevelValidationError
  );

  // 2. Moving laser with periodFrames <= 0 or non-integer
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        movingLasers: [
          {
            id: 'ML1',
            pointA: { x: 200, y: 100 },
            pointB: { x: 400, y: 100 },
            periodFrames: 0,
            phaseOffsetFrames: 0,
            motion: 'ping-pong',
          },
        ],
      }),
    LevelValidationError
  );
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        movingLasers: [
          {
            id: 'ML1',
            pointA: { x: 200, y: 100 },
            pointB: { x: 400, y: 100 },
            periodFrames: 120.5,
            phaseOffsetFrames: 0,
            motion: 'ping-pong',
          },
        ],
      }),
    LevelValidationError
  );

  // 3. Moving laser with non-finite or non-integer phaseOffsetFrames
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        movingLasers: [
          {
            id: 'ML1',
            pointA: { x: 200, y: 100 },
            pointB: { x: 400, y: 100 },
            periodFrames: 180,
            phaseOffsetFrames: Number.NaN,
            motion: 'ping-pong',
          },
        ],
      }),
    LevelValidationError
  );
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        movingLasers: [
          {
            id: 'ML1',
            pointA: { x: 200, y: 100 },
            pointB: { x: 400, y: 100 },
            periodFrames: 180,
            phaseOffsetFrames: 12.25,
            motion: 'ping-pong',
          },
        ],
      }),
    LevelValidationError
  );

  // 4. Moving laser with pointA === pointB or invalid beamOffset / beamEnd
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        movingLasers: [
          {
            id: 'ML1',
            pointA: { x: 300, y: 150 },
            pointB: { x: 300, y: 150 },
            periodFrames: 180,
            phaseOffsetFrames: 0,
            motion: 'ping-pong',
          },
        ],
      }),
    LevelValidationError
  );
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        movingLasers: [
          {
            id: 'ML1',
            pointA: { x: 200, y: 150 },
            pointB: { x: 400, y: 150 },
            beamOffset: { x: 0, y: 0 },
            periodFrames: 180,
            phaseOffsetFrames: 0,
            motion: 'ping-pong',
          },
        ],
      }),
    LevelValidationError
  );

  // 5. LaserSegment with invalid laserId or invalid range [0..1]
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        laserSegments: [
          {
            id: 'SEG1',
            laserId: 'NON_EXISTENT_LASER',
            range: { start: 0, end: 1 },
            initialEnabled: true,
          },
        ],
      }),
    LevelValidationError
  );
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        lasers: [{ id: 'L1', x1: 300, y1: 100, x2: 300, y2: 300 }],
        laserSegments: [
          {
            id: 'SEG1',
            laserId: 'L1',
            range: { start: 0.7, end: 0.5 },
            initialEnabled: true,
          },
        ],
      }),
    LevelValidationError
  );

  // 6. Ordered switch referencing non-existent laserSegment
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        lasers: [{ id: 'L1', x1: 300, y1: 100, x2: 300, y2: 300 }],
        orderedSwitchSequence: {
          scope: 'global',
          resetOnError: true,
          switches: [
            {
              id: 'S1',
              label: '1',
              x: 200,
              y: 200,
              r: 18,
              order: 1,
              targetSegmentIds: ['NON_EXISTENT_SEG'],
              effect: 'disable',
            },
          ],
        },
      }),
    LevelValidationError
  );

  // 7. Ordered switch sequence with gap in global numbering
  assert.throws(
    () =>
      assertValidLevelDef({
        ...baseLevel,
        lasers: [{ id: 'L1', x1: 300, y1: 100, x2: 300, y2: 300 }],
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
              x: 200,
              y: 200,
              r: 18,
              order: 2,
              targetSegmentIds: ['SEG1'],
              effect: 'disable',
            },
          ],
        },
      }),
    LevelValidationError
  );

  // 8. Valid Spec 002 extensibility metadata passes O1 validation cleanly
  assert.deepEqual(
    validateLevelDef({
      ...baseLevel,
      maxLaps: 6,
      plates: [{ id: 'P1', label: 'P1', x: 200, y: 120, r: 20 }],
      movingLasers: [
        {
          id: 'ML1',
          pointA: { x: 400, y: 80 },
          pointB: { x: 400, y: 320 },
          beamOffset: { x: 0, y: -60 },
          periodFrames: 240,
          phaseOffsetFrames: 60,
          motion: 'ping-pong',
          poweredByPlates: ['P1'],
        },
      ],
      laserSegments: [
        {
          id: 'SEG_ML1',
          laserId: 'ML1',
          range: { start: 0, end: 1 },
          initialEnabled: true,
        },
      ],
      orderedSwitchSequence: {
        scope: 'global',
        resetOnError: true,
        switches: [
          {
            id: 'S1',
            label: '1',
            x: 250,
            y: 250,
            r: 18,
            order: 1,
            targetSegmentIds: ['SEG_ML1'],
            effect: 'disable',
          },
        ],
      },
    }),
    []
  );
});

test('6-lap palette provides 6 distinct non-cyclic colors and rejects out-of-range lap indices', () => {
  assert.equal(MAX_LAPS, 6);
  assert.equal(LAP_META.length, 6);
  const colors = LAP_META.map((_, idx) => getLapColor(idx));
  const codes = LAP_META.map((_, idx) => getLapCode(idx));
  assert.equal(new Set(colors).size, 6);
  assert.deepEqual(codes, ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']);
  assert.throws(() => getLapColor(6), RangeError);
  assert.throws(() => getLapColor(-1), RangeError);
});

test('D8 moving laser ping-pong formula is deterministic across t and phaseOffsetFrames', () => {
  assert.equal(getMovingLaserFactor(120, 0, 0), 0);
  assert.equal(getMovingLaserFactor(120, 0, 30), 0.5);
  assert.equal(getMovingLaserFactor(120, 0, 60), 1);
  assert.equal(getMovingLaserFactor(120, 0, 90), 0.5);
  assert.equal(getMovingLaserFactor(120, 0, 120), 0);
  assert.equal(getMovingLaserFactor(120, 0, 1170), 0.5);

  // Positive and negative phase offsets
  assert.equal(getMovingLaserFactor(120, 30, 0), 0.5);
  assert.equal(getMovingLaserFactor(120, 30, 30), 1);
  assert.equal(getMovingLaserFactor(120, -30, 0), 0.5);
  assert.equal(getMovingLaserFactor(120, -30, 30), 0);

  const mlBeamOffset = {
    id: 'ML_OFF',
    pointA: { x: 400, y: 340 },
    pointB: { x: 600, y: 340 },
    beamOffset: { x: 0, y: -200 },
    periodFrames: 120,
    phaseOffsetFrames: 0,
    motion: 'ping-pong' as const,
  };
  assert.deepEqual(getMovingLaserEndpoints(mlBeamOffset, 0), {
    x1: 400,
    y1: 340,
    x2: 400,
    y2: 140,
    u: 0,
  });
  assert.deepEqual(getMovingLaserEndpoints(mlBeamOffset, 60), {
    x1: 600,
    y1: 340,
    x2: 600,
    y2: 140,
    u: 1,
  });

  const mlDual = {
    id: 'ML_DUAL',
    pointA: { x: 300, y: 350 },
    pointB: { x: 500, y: 350 },
    beamEndA: { x: 300, y: 100 },
    beamEndB: { x: 540, y: 140 },
    periodFrames: 120,
    phaseOffsetFrames: 0,
    motion: 'ping-pong' as const,
  };
  assert.deepEqual(getMovingLaserEndpoints(mlDual, 60), {
    x1: 500,
    y1: 350,
    x2: 540,
    y2: 140,
    u: 1,
  });
});

test('RF-8 precedence & moving laser ghost blocking work deterministically', () => {
  const basePerimeter = LEVELS[0].walls.slice(0, 4);

  const mlFixture: LevelDef = {
    id: 91,
    name: 'Fixture Moving Laser Precedence & Ghost Block',
    subtitle: 'Precedence 1..4',
    maxLaps: 2,
    hint: 'Test',
    spawn: { x: 120, y: 200 },
    goal: { x: 820, y: 200, r: 24 },
    walls: basePerimeter,
    plates: [{ id: 'P1', label: 'P1', x: 200, y: 120, r: 20 }],
    doors: [],
    lasers: [],
    movingLasers: [
      {
        id: 'ML1',
        pointA: { x: 460, y: 340 },
        pointB: { x: 580, y: 340 },
        beamOffset: { x: 0, y: -280 },
        periodFrames: 240,
        phaseOffsetFrames: 0,
        motion: 'ping-pong',
        poweredByPlates: ['P1'],
      },
    ],
    laserSegments: [
      { id: 'SEG_ML1', laserId: 'ML1', range: { start: 0, end: 1 }, initialEnabled: true },
    ],
  };

  // 1. Precedence 1: poweredByPlates off disables moving laser even when segment is enabled
  let s = createInitialStateForLevel(mlFixture);
  let world = deriveWorld(s);
  assert.equal(world.lasers[0].powered, false);
  assert.equal(world.lasers[0].enabled, true);
  assert.equal(world.lasers[0].active, false);

  // Walking across unpowered moving laser reaches Goal safely
  const sWinUnpowered = walkTo(s, 820, 200, 220);
  assert.equal(sWinUnpowered.dead, false);
  assert.equal(isWon(sWinUnpowered), true);

  // 2. Precedence 3: Lap 1 walks safely to (460, 300) while ML1 is unpowered, then Lap 2 powers P1
  let sBlock = walkTo(s, 460, 300, 140);
  sBlock = finishCurrentLap(sBlock);
  assert.equal(sBlock.lap, 1);

  // Player 2 steps onto P1 (200, 120) and waits until t=240 (u=0 -> ML1 at x=460, right under Ghost 1)
  sBlock = walkTo(sBlock, 200, 120, 50);
  sBlock = runTicks(sBlock, 240 - sBlock.t, () => IDLE);
  world = deriveWorld(sBlock);
  assert.equal(world.pressedPlates.has('P1'), true);
  assert.equal(world.lasers[0].powered, true);
  assert.equal(world.lasers[0].active, true);
  assert.equal(world.lasers[0].blockedByLap, 0);
  assert.ok(world.lasers[0].y2 >= 280);

  // At t=360 (u=1 -> ML1 sweeps to x=580 away from Ghost 1), full beam is unblocked
  const sSweep = runTicks(sBlock, 120, () => IDLE);
  world = deriveWorld(sSweep);
  assert.equal(world.lasers[0].blockedByLap, null);
  assert.equal(world.lasers[0].x1, 580);
  assert.equal(world.lasers[0].y2, 60);

  // 3. Precedence 4: Ghost 1 holds P1 in Lap 2, Player 2 walks into unblocked ML1 and dies
  let sHit = walkTo(s, 200, 120, 50);
  sHit = finishCurrentLap(sHit);
  assert.equal(sHit.lap, 1);
  sHit = runTicks(sHit, 50, () => IDLE); // Wait until Ghost 1 reaches P1
  sHit = walkTo(sHit, 620, 200, 180);
  assert.equal(sHit.dead, true);
  assert.equal(sHit.cause, 'laser');
});

test('LaserSegment splits beam span, respects disable state, and propagates upstream ghost occlusion', () => {
  const basePerimeter = LEVELS[0].walls.slice(0, 4);

  // Subcase A: Completing sequence disables SEG_HIGH (y=200..50) while SEG_LOW (y=350..200) stays active
  const segFixture: LevelDef = {
    id: 93,
    name: 'Fixture LaserSegment Split',
    subtitle: 'Segments & occlusion',
    maxLaps: 2,
    hint: 'Test',
    spawn: { x: 120, y: 120 },
    goal: { x: 760, y: 120, r: 24 },
    walls: basePerimeter,
    plates: [],
    doors: [],
    lasers: [{ id: 'L1', x1: 500, y1: 350, x2: 500, y2: 50 }],
    laserSegments: [
      { id: 'SEG_LOW', laserId: 'L1', range: { start: 0, end: 0.5 }, initialEnabled: true },
      { id: 'SEG_HIGH', laserId: 'L1', range: { start: 0.5, end: 1 }, initialEnabled: true },
    ],
    orderedSwitchSequence: {
      scope: 'global',
      resetOnError: true,
      switches: [
        {
          id: 'S1',
          label: '1',
          x: 240,
          y: 120,
          r: 20,
          order: 1,
          targetSegmentIds: ['SEG_HIGH'],
          effect: 'disable',
        },
      ],
    },
  };

  let s = createInitialStateForLevel(segFixture);
  s = walkTo(s, 240, 120, 45);
  let world = deriveWorld(s);
  assert.equal(world.sequence.completed, true);
  const segLow = world.lasers.find((l) => l.segmentId === 'SEG_LOW')!;
  const segHigh = world.lasers.find((l) => l.segmentId === 'SEG_HIGH')!;
  assert.equal(segLow.active, true);
  assert.equal(segHigh.enabled, false);
  assert.equal(segHigh.active, false);

  // Player crosses SEG_HIGH at y=120 to Goal safely
  s = walkTo(s, 760, 120, 160);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);

  // Subcase B: Upstream ghost on SEG_LOW occludes SEG_HIGH even when SEG_HIGH is enabled
  const occlusionFixture: LevelDef = {
    ...segFixture,
    id: 930,
    plates: [{ id: 'P1', label: 'P1', x: 180, y: 72, r: 20 }],
    lasers: [{ id: 'L1', x1: 500, y1: 350, x2: 500, y2: 50, poweredByPlates: ['P1'] }],
    orderedSwitchSequence: undefined,
  };

  let sLap1 = createInitialStateForLevel(occlusionFixture);
  sLap1 = walkTo(sLap1, 500, 300, 150);
  let sLap2 = finishCurrentLap(sLap1);
  assert.equal(sLap2.lap, 1);

  // Player 2 steps onto P1 so L1 powers on and waits until Ghost 1 reaches (500, 300) on SEG_LOW
  sLap2 = walkTo(sLap2, 180, 72, 40);
  sLap2 = runTicks(sLap2, 120, () => IDLE);
  world = deriveWorld(sLap2);
  const lap2Low = world.lasers.find((l) => l.segmentId === 'SEG_LOW')!;
  const lap2High = world.lasers.find((l) => l.segmentId === 'SEG_HIGH')!;
  assert.equal(lap2Low.powered, true);
  assert.equal(lap2Low.blockedByLap, 0);
  assert.equal(lap2High.enabled, true);
  assert.equal(lap2High.active, false);
  assert.equal(lap2High.blockedByLap, 0);
});

test('D3 switch activation triggers only for active player on outside->inside entry (not stay, not ghosts)', () => {
  const basePerimeter = LEVELS[0].walls.slice(0, 4);
  const d3Fixture: LevelDef = {
    id: 94,
    name: 'Fixture D3 Activation',
    subtitle: 'Outside->inside & player-only',
    maxLaps: 2,
    hint: 'Test',
    spawn: { x: 100, y: 200 },
    goal: { x: 800, y: 200, r: 24 },
    walls: basePerimeter,
    plates: [],
    doors: [],
    lasers: [{ id: 'L1', x1: 600, y1: 40, x2: 600, y2: 360 }],
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
          x: 200,
          y: 200,
          r: 20,
          order: 1,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
        {
          id: 'S2',
          label: '2',
          x: 340,
          y: 200,
          r: 20,
          order: 2,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
      ],
    },
  };

  // A. Enter S1 once -> step 1/2; staying inside for 60 ticks does NOT re-trigger or cause error
  let s = createInitialStateForLevel(d3Fixture);
  s = walkTo(s, 200, 200, 35);
  let seq = deriveWorld(s).sequence;
  assert.equal(seq.currentStep, 1);
  assert.equal(seq.expectedOrder, 2);
  assert.equal(seq.errorCount, 0);
  assert.equal(seq.switches[0].playerInside, true);

  s = runTicks(s, 60, () => IDLE);
  seq = deriveWorld(s).sequence;
  assert.equal(seq.currentStep, 1);
  assert.equal(seq.errorCount, 0);
  assert.equal(seq.hasRecentError, false);

  // B. Exit S1 and re-enter S1 when #2 is expected -> triggers out-of-order error & resets to 0
  s = walkTo(s, 130, 200, 25);
  assert.equal(deriveWorld(s).sequence.switches[0].playerInside, false);
  s = walkTo(s, 200, 200, 25);
  seq = deriveWorld(s).sequence;
  assert.equal(seq.currentStep, 0);
  assert.equal(seq.errorCount, 1);
  assert.equal(seq.hasRecentError, true);

  // C. Ghost crossing S1 in Lap 2 never activates ordered switches
  let sGhost = createInitialStateForLevel(d3Fixture);
  sGhost = walkTo(sGhost, 200, 200, 40);
  sGhost = finishCurrentLap(sGhost);
  assert.equal(sGhost.lap, 1);

  // Step 50 frames in Lap 2 while active player stays idle at spawn (Ghost 1 walks onto S1)
  // Lap 1 already set sequence to 1/2 (expectedOrder=2); Ghost 1 entering S1 must NOT advance or cause error!
  sGhost = runTicks(sGhost, 50, () => IDLE);
  const lap2World = deriveWorld(sGhost);
  assert.ok(Math.hypot(lap2World.ghosts[0].x - 200, lap2World.ghosts[0].y - 200) <= 24);
  assert.equal(lap2World.sequence.currentStep, 1);
  assert.equal(lap2World.sequence.expectedOrder, 2);
  assert.equal(lap2World.sequence.errorCount, 0);
  assert.equal(lap2World.sequence.hasRecentError, false);
});

test('D2 global sequence completes, persists after leaving switches, resets on error, and retries to win', () => {
  const basePerimeter = LEVELS[0].walls.slice(0, 4);
  const d2Fixture: LevelDef = {
    id: 95,
    name: 'Fixture D2 Sequence',
    subtitle: 'Advance, error reset, persist, win',
    maxLaps: 2,
    hint: 'Test',
    spawn: { x: 100, y: 200 },
    goal: { x: 740, y: 200, r: 24 },
    walls: basePerimeter,
    plates: [],
    doors: [],
    lasers: [{ id: 'L1', x1: 540, y1: 40, x2: 540, y2: 360 }],
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
          x: 200,
          y: 200,
          r: 20,
          order: 1,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
        {
          id: 'S2',
          label: '2',
          x: 340,
          y: 200,
          r: 20,
          order: 2,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
      ],
    },
  };

  let s = createInitialStateForLevel(d2Fixture);

  // 1. Trigger error first by bypassing S1 (walk above y=120) and entering S2
  s = walkTo(s, 200, 120, 40);
  s = walkTo(s, 340, 120, 45);
  s = walkTo(s, 340, 200, 30);
  let world = deriveWorld(s);
  assert.equal(world.sequence.currentStep, 0);
  assert.equal(world.sequence.completed, false);
  assert.equal(world.sequence.hasRecentError, true);
  assert.equal(world.sequence.segmentEnabled.SEG1, true);
  assert.equal(world.lasers[0].active, true);

  // 2. Exit S2, activate S1 then S2 in order
  s = walkTo(s, 270, 200, 25);
  s = walkTo(s, 200, 200, 25);
  world = deriveWorld(s);
  assert.equal(world.sequence.currentStep, 1);
  assert.equal(world.sequence.hasRecentError, false);
  assert.equal(world.sequence.segmentEnabled.SEG1, true);

  s = walkTo(s, 340, 200, 45);
  world = deriveWorld(s);
  assert.equal(world.sequence.currentStep, 2);
  assert.equal(world.sequence.completed, true);
  assert.equal(world.sequence.segmentEnabled.SEG1, false);
  assert.equal(world.lasers[0].active, false);

  // 3. Branch A: verify post-completion error resets sequence and restores initialEnabled (true)
  let sPostErr = walkTo(s, 270, 200, 25);
  sPostErr = walkTo(sPostErr, 200, 200, 25);
  const errWorld = deriveWorld(sPostErr);
  assert.equal(errWorld.sequence.completed, false);
  assert.equal(errWorld.sequence.currentStep, 0);
  assert.equal(errWorld.sequence.hasRecentError, true);
  assert.equal(errWorld.sequence.segmentEnabled.SEG1, true);
  assert.equal(errWorld.lasers[0].active, true);

  // 4. Branch B: from completed state, leave switches and cross disabled L1 to Goal -> WIN
  s = walkTo(s, 740, 200, 140);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('D4 rewindStep and seekToFrame keep ordered switches & segments 100% deterministic with zero cross-lap leakage', () => {
  const basePerimeter = LEVELS[0].walls.slice(0, 4);
  const d4Fixture: LevelDef = {
    id: 96,
    name: 'Fixture D4 Determinism',
    subtitle: 'Rewind & seek',
    maxLaps: 2,
    hint: 'Test',
    spawn: { x: 100, y: 200 },
    goal: { x: 740, y: 200, r: 24 },
    walls: basePerimeter,
    plates: [],
    doors: [],
    lasers: [{ id: 'L1', x1: 540, y1: 40, x2: 540, y2: 360 }],
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
          x: 200,
          y: 200,
          r: 20,
          order: 1,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
        {
          id: 'S2',
          label: '2',
          x: 340,
          y: 200,
          r: 20,
          order: 2,
          targetSegmentIds: ['SEG1'],
          effect: 'disable',
        },
      ],
    },
  };

  let s = createInitialStateForLevel(d4Fixture);
  s = walkTo(s, 150, 200, 15);
  const tBeforeS1 = s.t;
  assert.equal(deriveWorld(s).sequence.currentStep, 0);

  s = walkTo(s, 200, 200, 20);
  assert.equal(deriveWorld(s).sequence.currentStep, 1);

  s = walkTo(s, 340, 200, 45);
  const tCompleted = s.t;
  const completedStateSnapshot = structuredClone(s);
  const completedWorldSnapshot = deriveWorld(s);
  assert.equal(completedWorldSnapshot.sequence.completed, true);
  assert.equal(completedWorldSnapshot.sequence.segmentEnabled.SEG1, false);

  // Trigger an error after completion
  s = walkTo(s, 270, 200, 25);
  s = walkTo(s, 340, 200, 25);
  assert.equal(deriveWorld(s).sequence.hasRecentError, true);
  assert.equal(deriveWorld(s).sequence.segmentEnabled.SEG1, true);

  // Rewind back to tCompleted
  const rewound = rewindStep(s, s.t - tCompleted);
  assert.equal(rewound.t, tCompleted);
  assert.deepEqual(deriveWorld(rewound).sequence, completedWorldSnapshot.sequence);

  // Seek back before S1 and replay identical steps -> bit-for-bit identical SimState & DerivedWorld
  let sought = seekToFrame(s, 0, tBeforeS1);
  assert.equal(deriveWorld(sought).sequence.currentStep, 0);
  assert.equal(deriveWorld(sought).sequence.errorCount, 0);
  assert.equal(deriveWorld(sought).sequence.segmentEnabled.SEG1, true);

  sought = walkTo(sought, 200, 200, 20);
  sought = walkTo(sought, 340, 200, 45);
  assert.deepEqual(sought, completedStateSnapshot);
  assert.deepEqual(deriveWorld(sought), completedWorldSnapshot);

  // Advancing to Lap 2 preserves replay-derived progress from laps[0] without hidden state
  const lap2 = finishCurrentLap(completedStateSnapshot);
  assert.equal(lap2.lap, 1);
  assert.equal(deriveWorld(lap2).sequence.currentStep, 2);
  assert.equal(deriveWorld(lap2).sequence.completed, true);
  assert.equal(deriveWorld(lap2).sequence.segmentEnabled.SEG1, false);

  // Seeking back into Lap 1 before S1 reverts replay-derived state cleanly
  const backToLap1Before = seekToFrame(lap2, 0, tBeforeS1);
  assert.equal(backToLap1Before.lap, 0);
  assert.equal(deriveWorld(backToLap1Before).sequence.currentStep, 0);
  assert.equal(deriveWorld(backToLap1Before).sequence.segmentEnabled.SEG1, true);

  // Direct pure evaluation check
  const directSeq = evaluateOrderedSequence(d4Fixture, completedStateSnapshot.current, false);
  assert.equal(directSeq.completed, true);
  assert.equal(directSeq.segmentEnabled.SEG1, false);
});

test('Level 5 (El pulso) solves deterministically in 2 laps (V1-V2) via delayed plate and door A', () => {
  let s = createInitialState(4); // Level 5

  // V1: delay reaching Plate A so ML1 stays unpowered while V2 crosses the corridor
  s = runTicks(s, 100, () => IDLE);
  s = walkTo(s, 200, 96, 120);
  assert.equal(deriveWorld(s).openDoors.has('D1'), true);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);

  // V2: cross right before Ghost 1 reaches A, then wait for D1 to open and reach Goal
  s = walkTo(s, 700, 200, 220);
  assert.equal(s.dead, false);
  while (s.t < FRAMES_PER_LAP - 1 && !deriveWorld(s).openDoors.has('D1') && !s.dead) {
    s = stepSim(s, IDLE);
  }
  assert.equal(s.dead, false);
  assert.equal(deriveWorld(s).openDoors.has('D1'), true);
  s = walkTo(s, 848, 200, 120);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 5 fails if Plate A is held too early or if Lap 2 times out', () => {
  // Case A: Ghost 1 powers ML1 before V2 crosses -> laser death
  let s = createInitialState(4);
  s = walkTo(s, 200, 96, 80);
  s = finishCurrentLap(s);
  s = walkTo(s, 400, 200, 140);
  s = walkTo(s, 848, 200, 300);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');

  // Case B: Timeout when final Lap 2 ends without reaching Goal
  let sTimeout = createInitialState(4);
  sTimeout = runTicks(sTimeout, FRAMES_PER_LAP * 2, () => IDLE);
  assert.equal(sTimeout.lap, 1);
  assert.equal(sTimeout.dead, true);
  assert.equal(sTimeout.cause, 'timeout');
});

test('Level 6 (Orden correcto) solves deterministically in 2 laps (V1-V2) with ordered switches & SEG1', () => {
  let s = createInitialState(5); // Level 6

  // V1: hold Plate A (200, 316) to keep Door D1 open for V2
  s = walkTo(s, 100, 316, 45);
  s = walkTo(s, 200, 316, 40);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);

  // V2: cross top lane of D1 and activate Switch #1 (S1 at 480, 80) -> sequence 1/2
  s = walkTo(s, 100, 200, 60);
  s = walkTo(s, 240, 128, 60);
  s = walkTo(s, 360, 128, 45);
  s = walkTo(s, 360, 80, 25);
  s = walkTo(s, 480, 80, 45);
  const wV2 = deriveWorld(s);
  assert.equal(wV2.sequence.currentStep, 1);
  assert.equal(wV2.sequence.expectedOrder, 2);
  assert.equal(wV2.sequence.completed, false);
  assert.equal(wV2.sequence.segmentEnabled.SEG1, true);

  // Keep the same V2: drop to the bottom lane and activate S2 -> sequence 2/2 disables SEG1
  s = walkTo(s, 240, 272, 70);
  s = walkTo(s, 360, 272, 45);
  s = walkTo(s, 360, 320, 25);
  s = walkTo(s, 480, 320, 60);
  const wV2Complete = deriveWorld(s);
  assert.equal(wV2Complete.sequence.currentStep, 2);
  assert.equal(wV2Complete.sequence.completed, true);
  assert.equal(wV2Complete.sequence.segmentEnabled.SEG1, false);
  assert.equal(wV2Complete.lasers[0].active, false);

  // Still in V2: walk straight down the middle corridor and cross disabled SEG1 to Goal
  s = walkTo(s, 830, 200, 260);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 6 resets sequence on out-of-order switch activation and kills player at L1/SEG1', () => {
  let s = createInitialState(5); // Level 6
  s = walkTo(s, 100, 316, 45);
  s = walkTo(s, 200, 316, 40);
  s = finishCurrentLap(s);

  // In V2, activate S2 BEFORE S1 -> triggers order error, resets to 0/2, SEG1 stays enabled
  s = runTicks(s, 90, () => IDLE);
  s = walkTo(s, 240, 272, 60);
  s = walkTo(s, 360, 272, 45);
  s = walkTo(s, 360, 320, 25);
  s = walkTo(s, 480, 320, 45);
  const errWorld = deriveWorld(s);
  assert.equal(errWorld.sequence.currentStep, 0);
  assert.equal(errWorld.sequence.hasRecentError, true);
  assert.equal(errWorld.sequence.segmentEnabled.SEG1, true);
  assert.equal(errWorld.lasers[0].active, true);

  // Trying to cross L1/SEG1 at (660, 200) kills player with laser
  s = walkTo(s, 600, 320, 45);
  s = walkTo(s, 600, 200, 45);
  s = walkTo(s, 690, 200, 40);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');
});

test('Level 7 (Sincronía) completes all 3 switches in 2 laps and times out on the final lap', () => {
  let s = createInitialState(6); // Level 7

  // V1: hold Plate A (176, 88) so D1 opens for V2
  s = walkTo(s, 96, 88, 35);
  s = walkTo(s, 176, 88, 30);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);

  // V2: activate S1 (350, 96), S2 (450, 96) and S3 (400, 236) in the same lap
  s = runTicks(s, 65, () => IDLE);
  s = walkTo(s, 150, 140, 28);
  s = walkTo(s, 260, 112, 35);
  s = walkTo(s, 350, 96, 30);
  s = walkTo(s, 450, 96, 35);
  s = walkTo(s, 150, 248, 45);
  s = walkTo(s, 260, 248, 35);
  s = walkTo(s, 400, 236, 50);
  const wV2 = deriveWorld(s);
  assert.equal(wV2.sequence.currentStep, 3);
  assert.equal(wV2.sequence.completed, true);
  assert.equal(wV2.sequence.segmentEnabled.SEG_S_BOT, false);
  assert.equal(wV2.sequence.segmentEnabled.SEG_S_TOP, false);

  // With the current 3-lap cap, the final lap ends in a timeout if the goal is not reached
  s = finishCurrentLap(s);
  assert.equal(s.lap, 2);
  s = runTicks(s, FRAMES_PER_LAP, () => IDLE);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'timeout');
});

test('Level 7 fails on out-of-order switch activation', () => {
  // Case A: hitting S3 out of order (before S1->S2) resets sequence; crossing L1 kills player
  let s = createInitialState(6);
  s = walkTo(s, 96, 88, 35);
  s = walkTo(s, 176, 88, 30);
  s = finishCurrentLap(s); // V1 holds A
  s = runTicks(s, 65, () => IDLE);
  s = walkTo(s, 150, 248, 28);
  s = walkTo(s, 260, 248, 35);
  s = walkTo(s, 400, 236, 45); // S3 out of order!
  const wErr = deriveWorld(s);
  assert.equal(wErr.sequence.currentStep, 0);
  assert.equal(wErr.sequence.hasRecentError, true);
  assert.equal(wErr.sequence.segmentEnabled.SEG_S_BOT, true);
  s = walkTo(s, 560, 236, 60);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');

});

test('Level 8 (La herradura) solves deterministically in 3 laps (V1-V3) around the central spine with moving laser and 2-floor switches', () => {
  let s = createInitialState(7); // Level 8

  // V1: straight UP then right to Plate A (216, 56) to open D1
  s = walkTo(s, 96, 56, 20);
  s = walkTo(s, 216, 56, 40);
  assert.equal(deriveWorld(s).pressedPlates.has('A'), true);
  assert.equal(deriveWorld(s).openDoors.has('D1'), true);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);

  // V2: DOWN-RIGHT through open D1 -> S1 (520, 88) -> outer ring -> S2 (496, 300) disables SEG1 -> Plate B (612, 336)
  s = runTicks(s, 65, () => IDLE);
  s = walkTo(s, 124, 116, 18);
  s = walkTo(s, 420, 116, 86);
  s = walkTo(s, 520, 88, 34);
  const wV2 = deriveWorld(s);
  assert.equal(wV2.sequence.currentStep, 1);
  assert.equal(wV2.sequence.expectedOrder, 2);
  assert.equal(wV2.sequence.completed, false);
  assert.equal(wV2.sequence.segmentEnabled.SEG1, true);
  s = walkTo(s, 712, 144, 70);
  s = runTicks(s, (25 - (s.t % 180) + 180) % 180, () => IDLE);
  s = walkTo(s, 792, 144, 24);
  s = walkTo(s, 792, 300, 46);
  s = walkTo(s, 712, 300, 24);
  s = walkTo(s, 496, 300, 66);
  const wV2Complete = deriveWorld(s);
  assert.equal(wV2Complete.sequence.currentStep, 2);
  assert.equal(wV2Complete.sequence.completed, true);
  assert.equal(wV2Complete.sequence.segmentEnabled.SEG1, false);
  s = walkTo(s, 612, 336, 50);
  assert.equal(deriveWorld(s).pressedPlates.has('B'), true);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 2);

  // V3 (inner U-turn ring x=756): exit LEFT -> y=172 -> time ML1 -> y=256 -> cross disabled L1 & open D2 -> Goal (96, 312)
  s = runTicks(s, 120, () => IDLE);
  s = walkTo(s, 48, 88, 22);
  s = walkTo(s, 48, 172, 28);
  s = walkTo(s, 712, 172, 195);
  s = runTicks(s, (35 - (s.t % 180) + 180) % 180, () => IDLE);
  s = walkTo(s, 756, 172, 14);
  s = walkTo(s, 756, 256, 26);
  s = walkTo(s, 712, 256, 14);
  if (s.t < 580) {
    s = runTicks(s, 580 - s.t, () => IDLE);
  }
  const wPreGoal = deriveWorld(s);
  assert.equal(wPreGoal.openDoors.has('D2'), true);
  assert.equal(wPreGoal.sequence.completed, true);
  s = walkTo(s, 260, 256, 134);
  s = walkTo(s, 96, 312, 54);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 8 fails on out-of-order switch activation (SEG1 stays active) and on mistimed moving laser ML1 crossing', () => {
  // Case A: hitting S2 before S1 resets sequence and L1/SEG1 stays active & kills player
  let s = createInitialState(7);
  s = walkTo(s, 96, 56, 20);
  s = walkTo(s, 216, 56, 40);
  s = finishCurrentLap(s); // V1 holds A
  s = runTicks(s, 65, () => IDLE);
  s = walkTo(s, 128, 120, 18);
  s = walkTo(s, 712, 120, 175);
  s = runTicks(s, (35 - (s.t % 180) + 180) % 180, () => IDLE);
  s = walkTo(s, 780, 120, 23);
  s = walkTo(s, 780, 300, 56);
  s = walkTo(s, 712, 300, 23);
  s = walkTo(s, 496, 300, 66); // S2 out of order!
  const wErr = deriveWorld(s);
  assert.equal(wErr.sequence.currentStep, 0);
  assert.equal(wErr.sequence.hasRecentError, true);
  assert.equal(wErr.sequence.segmentEnabled.SEG1, true);
  s = walkTo(s, 320, 300, 55);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');

  // Case B: ignoring ML1 pendulum phase in right bay kills player
  let sLaser = createInitialState(7);
  sLaser = walkTo(sLaser, 96, 56, 20);
  sLaser = walkTo(sLaser, 216, 56, 40);
  sLaser = finishCurrentLap(sLaser); // V1 A
  sLaser = runTicks(sLaser, 65, () => IDLE);
  sLaser = walkTo(sLaser, 128, 120, 18);
  sLaser = walkTo(sLaser, 900, 120, 260);
  assert.equal(sLaser.dead, true);
  assert.equal(sLaser.cause, 'laser');
});

test('Level 9 (Cámaras cruzadas) solves deterministically in 3 laps (V1-V3) across 3 columns with horizontal L1 and Room 3 ML1', () => {
  let s = createInitialState(8); // Level 9

  // V1: exit LEFT -> loop top-left to Plate A (120, 88) -> opens D1 and powers ML1
  s = walkTo(s, 48, 312, 18);
  s = walkTo(s, 48, 48, 80);
  s = walkTo(s, 120, 48, 24);
  s = walkTo(s, 120, 88, 16);
  assert.equal(deriveWorld(s).pressedPlates.has('A'), true);
  assert.equal(deriveWorld(s).openDoors.has('D1'), true);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);

  // V2: S1 (224, 88) -> lower Room 2 -> S2 (408, 316) and S3 (548, 316) disable horizontal L1 -> hold Plate B (480, 88)
  s = runTicks(s, 110, () => IDLE);
  s = walkTo(s, 96, 148, 50);
  s = walkTo(s, 224, 148, 40);
  s = walkTo(s, 224, 88, 22);
  const wV2 = deriveWorld(s);
  assert.equal(wV2.sequence.currentStep, 1);
  assert.equal(wV2.sequence.expectedOrder, 2);
  assert.equal(wV2.sequence.completed, false);
  s = walkTo(s, 408, 316, 95);
  s = walkTo(s, 548, 316, 44);
  const wV2Complete = deriveWorld(s);
  assert.equal(wV2Complete.sequence.currentStep, 3);
  assert.equal(wV2Complete.sequence.completed, true);
  assert.equal(wV2Complete.sequence.segmentEnabled.SEG_L, false);
  assert.equal(wV2Complete.sequence.segmentEnabled.SEG_R, false);
  s = walkTo(s, 444, 244, 60);
  s = walkTo(s, 444, 52, 80);
  s = walkTo(s, 480, 88, 36);
  assert.equal(deriveWorld(s).pressedPlates.has('B'), true);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 2);

  // V3: cross under to x=592 -> rise through disabled L1 -> cross D2 -> drop past ML1 into Goal (880, 320)
  s = runTicks(s, 165, () => IDLE);
  s = walkTo(s, 96, 356, 18);
  s = walkTo(s, 592, 356, 146);
  if (s.t < 255) {
    s = runTicks(s, 255 - s.t, () => IDLE);
  }
  s = walkTo(s, 592, 88, 80);
  if (s.t < 400) {
    s = runTicks(s, 400 - s.t, () => IDLE);
  }
  // Ghost 2 reaches Plate B later in the lap, so D2 opens after this point
  while (s.t < FRAMES_PER_LAP - 1 && !deriveWorld(s).openDoors.has('D2') && !s.dead) {
    s = stepSim(s, IDLE);
  }
  const wPreCross = deriveWorld(s);
  assert.equal(wPreCross.openDoors.has('D2'), true);
  assert.equal(wPreCross.sequence.completed, true);
  s = walkTo(s, 880, 52, 128);
  s = walkTo(s, 880, 148, 32);

  // ML1 in lower Room 3: period=120, phase=30 -> sweeps x=700..880; t%120==65..115 beam stays left near x=700..775
  const wait9 = (65 - (s.t % 120) + 120) % 120;
  s = runTicks(s, wait9, () => IDLE);
  s = walkTo(s, 880, 320, 56);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 9 fails on out-of-order switch error and on Lap 3 timeout', () => {
  // Case A: hitting S2 before S1 resets sequence; crossing horizontal L1 kills player
  let s = createInitialState(8);
  s = walkTo(s, 48, 312, 18);
  s = walkTo(s, 48, 48, 80);
  s = walkTo(s, 120, 48, 24);
  s = walkTo(s, 120, 88, 16);
  s = finishCurrentLap(s); // V1 A
  s = runTicks(s, 100, () => IDLE);
  s = walkTo(s, 408, 316, 95); // S2 without S1!
  const wErr = deriveWorld(s);
  assert.equal(wErr.sequence.currentStep, 0);
  assert.equal(wErr.sequence.hasRecentError, true);
  assert.equal(wErr.sequence.segmentEnabled.SEG_L, true);
  s = walkTo(s, 408, 140, 60);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');

  // Case B: exhaust final Lap 3 without reaching Goal -> timeout loss
  let sTimeout = createInitialState(8);
  for (let lap = 0; lap < 2; lap++) {
    sTimeout = finishCurrentLap(sTimeout);
  }
  assert.equal(sTimeout.lap, 2);
  sTimeout = runTicks(sTimeout, FRAMES_PER_LAP, () => IDLE);
  assert.equal(sTimeout.dead, true);
  assert.equal(sTimeout.cause, 'timeout');
});

test('Level 10 (Última coordinación) completes all 3 switches in 2 laps and times out on the final lap', () => {
  let s = createInitialState(9); // Level 10

  // V1: straight UP -> Plate A (180, 72) -> opens D1
  s = walkTo(s, 100, 72, 42);
  s = walkTo(s, 180, 72, 28);
  assert.equal(deriveWorld(s).pressedPlates.has('A'), true);
  assert.equal(deriveWorld(s).openDoors.has('D1'), true);
  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);

  // V2: LEFT -> wrap bottom-left -> S1 (180, 328) -> S2 (420, 158) -> S3 (668, 74)
  s = runTicks(s, 115, () => IDLE);
  s = walkTo(s, 48, 200, 20);
  s = walkTo(s, 48, 328, 42);
  s = walkTo(s, 180, 328, 42);
  assert.equal(deriveWorld(s).sequence.currentStep, 1);
  s = walkTo(s, 148, 152, 60);
  s = walkTo(s, 420, 158, 82);
  assert.equal(deriveWorld(s).sequence.currentStep, 2);
  s = walkTo(s, 420, 74, 30);
  s = walkTo(s, 668, 74, 74);
  const wV2 = deriveWorld(s);
  assert.equal(wV2.sequence.currentStep, 3);
  assert.equal(wV2.sequence.completed, true);
  assert.equal(wV2.sequence.segmentEnabled.SEG_BOT, false);
  assert.equal(wV2.sequence.segmentEnabled.SEG_TOP, false);

  // With the current 3-lap cap, the final lap ends in a timeout if the goal is not reached
  s = finishCurrentLap(s);
  assert.equal(s.lap, 2);
  s = runTicks(s, FRAMES_PER_LAP, () => IDLE);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'timeout');
});

test('Level 10 fails on out-of-order switch and on Lap 3 timeout', () => {
  // Case A: hitting S2 before S1 resets sequence and L1 kills player
  let s = createInitialState(9);
  s = walkTo(s, 100, 72, 42);
  s = walkTo(s, 180, 72, 28);
  s = finishCurrentLap(s); // V1 A
  s = runTicks(s, 65, () => IDLE);
  s = walkTo(s, 420, 170, 96); // S2 without S1!
  const wErr = deriveWorld(s);
  assert.equal(wErr.sequence.currentStep, 0);
  assert.equal(wErr.sequence.hasRecentError, true);
  assert.equal(wErr.sequence.segmentEnabled.SEG_BOT, true);
  s = walkTo(s, 560, 170, 50);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');

  // Case B: exhaust final Lap 3 without reaching Goal -> timeout loss
  let sTimeout = createInitialState(9);
  for (let lap = 0; lap < 2; lap++) {
    sTimeout = finishCurrentLap(sTimeout);
  }
  assert.equal(sTimeout.lap, 2);
  sTimeout = runTicks(sTimeout, FRAMES_PER_LAP, () => IDLE);
  assert.equal(sTimeout.dead, true);
  assert.equal(sTimeout.cause, 'timeout');
});
