import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialState,
  deriveWorld,
  finishCurrentLap,
  FRAMES_PER_LAP,
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

test('Level 1 (Caminar) can be solved in 1 lap', () => {
  let s = createInitialState(0);
  s = walkTo(s, 300, 60, 90);
  s = walkTo(s, 560, 60, 100);
  s = walkTo(s, 816, 536, 200);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 2 (El sostén) solves in 2 laps and past trail is solid', () => {
  let s = createInitialState(1);
  // Lap 1: stand on Plate A (360, 300)
  s = walkTo(s, 360, 300, FRAMES_PER_LAP);
  assert.equal(s.lap, 1);

  // Lap 2: go around Lap 1 trail via top corridor and reach Goal (830, 300)
  s = walkTo(s, 120, 200, 45);
  s = walkTo(s, 520, 200, 140);
  s = walkTo(s, 830, 300, 140);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 3 (El relevo) solves in 3 laps', () => {
  let s = createInitialState(2);
  // Lap 1: go straight up to Plate A (210, 150) and stay
  s = walkTo(s, 110, 150, 100);
  s = walkTo(s, 210, 150, FRAMES_PER_LAP - 100);
  assert.equal(s.lap, 1);

  // Lap 2: go right at y=420 -> up at x=290 -> Door 1 (y=260) -> Plate B (510, 460)
  s = walkTo(s, 290, 420, 80);
  s = walkTo(s, 290, 260, 80);
  s = walkTo(s, 405, 260, 70);
  s = walkTo(s, 510, 460, FRAMES_PER_LAP - 230);
  assert.equal(s.lap, 2);

  // Lap 3: go up at x=200 (between Lap 1 at x=110 and Lap 2 at x=290) -> cross above Lap 2 at y=215 -> Door 1 -> Door 2 -> Goal
  s = walkTo(s, 200, 420, 50);
  s = walkTo(s, 200, 215, 80);
  s = walkTo(s, 560, 215, 130);
  s = walkTo(s, 560, 340, 60);
  s = walkTo(s, 826, 340, 120);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 4 (La cuadrilla) solves in 4 laps with laser blocking', () => {
  let s = createInitialState(3);
  // Lap 1: hold Plate A (160, 140)
  s = walkTo(s, 100, 140, 60);
  s = walkTo(s, 160, 140, FRAMES_PER_LAP - 60);
  assert.equal(s.lap, 1);

  // Lap 2: take the top lane (y=228) through Door 1 to the laser blocker spot (492, 228)
  s = walkTo(s, 172, 228, 45);
  s = walkTo(s, 492, 228, 110);
  s = runTicks(s, FRAMES_PER_LAP - 155, () => IDLE);
  assert.equal(s.lap, 2);

  // Lap 3: take the bottom lane (y=345) through Door 1, under Ghost 2, to Plate B (604, 470)
  s = walkTo(s, 145, 345, 45);
  s = walkTo(s, 492, 345, 110);
  s = walkTo(s, 604, 470, 70);
  s = runTicks(s, FRAMES_PER_LAP - 225, () => IDLE);
  assert.equal(s.lap, 3);

  // Verify laser is active and blocked by Ghost 2 at t = 700
  const sCheck = runTicks(s, 700, () => IDLE);
  const world = deriveWorld(sCheck);
  assert.equal(world.lasers[0].active, true);
  assert.equal(world.lasers[0].blockedByLap, 1);

  // Lap 4: wait until Ghosts 1-3 are in place (~300 ticks), then walk straight down the middle lane (y=285) under Ghost 2 -> Door 2 -> Goal
  s = runTicks(s, 300, () => IDLE);
  s = walkTo(s, 220, 285, 45);
  s = walkTo(s, 520, 285, 95);
  s = walkTo(s, 732, 300, 70);
  s = walkTo(s, 842, 300, 60);
  assert.equal(s.dead, false);
  assert.equal(isWon(s), true);
});

test('Level 4 kills player with laser if Ghost 2 is not blocking', () => {
  let s = createInitialState(3);
  // Lap 1: hold Plate A
  s = walkTo(s, 100, 140, 60);
  s = walkTo(s, 160, 140, FRAMES_PER_LAP - 60);
  // Lap 2: skip laser block and go straight through central gap (492, 300) to Plate B (604, 470)
  s = walkTo(s, 492, 300, 140);
  s = walkTo(s, 604, 470, FRAMES_PER_LAP - 140);
  assert.equal(s.lap, 2);

  // Lap 3: Ghost 2 holds B so laser is ON! Go around via top -> Door 1 (y=240) -> cross laser at (520, 240) -> laser kills player
  s = runTicks(s, 250, () => IDLE);
  s = walkTo(s, 56, 300, 30);
  s = walkTo(s, 56, 72, 80);
  s = walkTo(s, 240, 72, 70);
  s = walkTo(s, 240, 240, 60);
  s = walkTo(s, 520, 240, 110);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'laser');
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
  // Walk onto Plate A (~70 ticks) and end lap early
  s = walkTo(s, 360, 300, 90);
  assert.equal(s.lap, 0);
  const posOnPlate = { x: s.player.x, y: s.player.y };

  s = finishCurrentLap(s);
  assert.equal(s.lap, 1);
  assert.equal(s.t, 0);
  assert.equal(s.laps[0].length, FRAMES_PER_LAP + 1);
  assert.equal(s.laps[0][FRAMES_PER_LAP].x, posOnPlate.x);
  assert.equal(s.laps[0][FRAMES_PER_LAP].y, posOnPlate.y);

  // In Lap 2, Ghost 1 holds Plate A so Door 1 stays open while player goes to Goal
  s = walkTo(s, 120, 200, 45);
  s = walkTo(s, 520, 200, 140);
  s = walkTo(s, 830, 300, 140);
  assert.equal(isWon(s), true);
});

test('Running out of time on the final lap triggers timeout loss', () => {
  let s = createInitialState(0); // Level 1 has 1 lap
  s = runTicks(s, FRAMES_PER_LAP, () => IDLE);
  assert.equal(s.dead, true);
  assert.equal(s.cause, 'timeout');
  assert.equal(isWon(s), false);
});
