import { getLapCode, getLapColor, TOKENS, withAlpha } from './colors.ts';
import { CANVAS_H, CANVAS_W } from './levels.ts';
import {
  deriveWorld,
  getFutureGhostFrame,
  getMovingLaserEndpoints,
  PLAYER_RADIUS,
  SPAWN_SAFE_RADIUS,
  SWITCH_ACTIVATION_MARGIN,
  TICK_HZ,
  TRAIL_HALF_WIDTH,
  TRAIL_SAMPLE_INTERVAL,
  type Frame,
  type SimState,
} from './sim.ts';

const { color: C, shape: S } = TOKENS;

function drawRoundedBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string,
  fgColor: string,
  borderColor?: string,
  font = '700 10px "JetBrains Mono", monospace'
) {
  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const padX = 5;
  const boxW = Math.ceil(metrics.width + padX * 2);
  const boxH = 16;
  const rx = x - boxW * 0.5;
  const ry = y - boxH * 0.5;
  const r = 4;

  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + boxW - r, ry);
  ctx.quadraticCurveTo(rx + boxW, ry, rx + boxW, ry + r);
  ctx.lineTo(rx + boxW, ry + boxH - r);
  ctx.quadraticCurveTo(rx + boxW, ry + boxH, rx + boxW - r, ry + boxH);
  ctx.lineTo(rx + r, ry + boxH);
  ctx.quadraticCurveTo(rx, ry + boxH, rx, ry + boxH - r);
  ctx.lineTo(rx, ry + r);
  ctx.quadraticCurveTo(rx, ry, rx + r, ry);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = S.strokeThin;
    ctx.stroke();
  }

  ctx.fillStyle = fgColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

function findTrailLabelAnchor(
  frames: Frame[],
  spawn: { x: number; y: number }
): { x: number; y: number } | null {
  const outside: Frame[] = [];
  for (let i = 0; i < frames.length; i += TRAIL_SAMPLE_INTERVAL) {
    const f = frames[i];
    if (Math.hypot(f.x - spawn.x, f.y - spawn.y) > SPAWN_SAFE_RADIUS + 14) {
      outside.push(f);
    }
  }
  if (outside.length === 0) return null;
  const mid = outside[Math.floor(outside.length * 0.5)];
  return { x: mid.x, y: mid.y };
}

function drawTrailPath(
  ctx: CanvasRenderingContext2D,
  frames: Frame[],
  lapColor: string,
  lapCode: string | null,
  isPast: boolean,
  spawn: { x: number; y: number }
) {
  if (frames.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(frames[0].x, frames[0].y);
  for (let i = TRAIL_SAMPLE_INTERVAL; i < frames.length; i += TRAIL_SAMPLE_INTERVAL) {
    ctx.lineTo(frames[i].x, frames[i].y);
  }
  const last = frames[frames.length - 1];
  ctx.lineTo(last.x, last.y);

  if (isPast) {
    // Solid architectural past ribbon
    ctx.strokeStyle = withAlpha(lapColor, S.opacityTrailSolid);
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2;
    ctx.stroke();

    // Recessed obsidian inner channel so overlapping ribbons remain legible
    ctx.strokeStyle = withAlpha(C.bg, S.opacityTrailCore);
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2 - 5;
    ctx.stroke();

    // Crisp central spine
    ctx.strokeStyle = withAlpha(lapColor, S.opacityTrailSpine);
    ctx.lineWidth = S.strokeBase;
    ctx.stroke();

    // Softly mask spawn safe zone so player sees spawn remains clear
    ctx.fillStyle = withAlpha(C.bg, 0.9);
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, SPAWN_SAFE_RADIUS - 4, 0, Math.PI * 2);
    ctx.fill();

    // Visible V1-V6 badge anchored on the past trail (RF-2 double coding)
    if (lapCode) {
      const anchor = findTrailLabelAnchor(frames, spawn);
      if (anchor) {
        drawRoundedBadge(ctx, anchor.x, anchor.y, lapCode, lapColor, C.inkOnAccent, C.bg);
      }
    }
  } else {
    // Soft non-colliding present trail
    ctx.strokeStyle = withAlpha(C.present, S.opacityPresentTrail);
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2;
    ctx.stroke();

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = withAlpha(C.present, S.opacityPresentSpine);
    ctx.lineWidth = S.strokeBase;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export interface RenderOptions {
  showFuturePreview: boolean;
  isRewinding: boolean;
  isPaused: boolean;
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  options: RenderOptions
) {
  const world = deriveWorld(state);
  const { level, ghosts, pressedPlates, openDoors, lasers } = world;

  // 1. Background & Warm Drafting Grid
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = C.bgGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 24; gx <= CANVAS_W - 24; gx += 48) {
    ctx.moveTo(gx, 24);
    ctx.lineTo(gx, CANVAS_H - 24);
  }
  for (let gy = 24; gy <= CANVAS_H - 24; gy += 48) {
    ctx.moveTo(24, gy);
    ctx.lineTo(CANVAS_W - 24, gy);
  }
  ctx.stroke();

  // Subtle architectural drafting crosshairs every 96px
  ctx.strokeStyle = C.bgGridMajor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 72; gx <= CANVAS_W - 72; gx += 96) {
    for (let gy = 72; gy <= CANVAS_H - 72; gy += 96) {
      ctx.moveTo(gx - 4, gy);
      ctx.lineTo(gx + 4, gy);
      ctx.moveTo(gx, gy - 4);
      ctx.lineTo(gx, gy + 4);
    }
  }
  ctx.stroke();

  // 2. Floor wiring conduits from plates to doors & powered lasers (solid when active, dashed when idle)
  ctx.save();
  for (const door of level.doors) {
    const dcx = door.x + door.w * 0.5;
    const dcy = door.y + door.h * 0.5;
    for (const pId of door.requiredPlates) {
      const plate = level.plates.find((p) => p.id === pId);
      if (!plate) continue;
      const active = pressedPlates.has(pId);
      ctx.setLineDash(active ? [] : [5, 5]);
      ctx.lineWidth = active ? S.strokeBase : S.strokeThin;
      ctx.strokeStyle = active
        ? withAlpha(C.doorOpen, S.opacityWireActive)
        : withAlpha(C.plateOff, S.opacityWireIdle);
      ctx.beginPath();
      ctx.moveTo(plate.x, plate.y);
      ctx.lineTo(dcx, dcy);
      ctx.stroke();
    }
  }
  for (const laser of level.lasers) {
    if (!laser.poweredByPlates) continue;
    const lcx = (laser.x1 + laser.x2) * 0.5;
    const lcy = (laser.y1 + laser.y2) * 0.5;
    for (const pId of laser.poweredByPlates) {
      const plate = level.plates.find((p) => p.id === pId);
      if (!plate) continue;
      const active = pressedPlates.has(pId);
      ctx.setLineDash(active ? [] : [5, 5]);
      ctx.lineWidth = active ? S.strokeBase : S.strokeThin;
      ctx.strokeStyle = active
        ? withAlpha(C.laserActive, S.opacityWireActive)
        : withAlpha(C.laserInactive, S.opacityWireIdle);
      ctx.beginPath();
      ctx.moveTo(plate.x, plate.y);
      ctx.lineTo(lcx, lcy);
      ctx.stroke();
    }
  }
  for (const ml of level.movingLasers ?? []) {
    if (!ml.poweredByPlates) continue;
    const geom = getMovingLaserEndpoints(ml, state.t);
    const lcx = (geom.x1 + geom.x2) * 0.5;
    const lcy = (geom.y1 + geom.y2) * 0.5;
    for (const pId of ml.poweredByPlates) {
      const plate = level.plates.find((p) => p.id === pId);
      if (!plate) continue;
      const active = pressedPlates.has(pId);
      ctx.setLineDash(active ? [] : [5, 5]);
      ctx.lineWidth = active ? S.strokeBase : S.strokeThin;
      ctx.strokeStyle = active
        ? withAlpha(C.laserActive, S.opacityWireActive)
        : withAlpha(C.laserInactive, S.opacityWireIdle);
      ctx.beginPath();
      ctx.moveTo(plate.x, plate.y);
      ctx.lineTo(lcx, lcy);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Past trails (solid walls with V1-V6 labels) & current trail (soft)
  for (let i = 0; i < state.lap; i++) {
    drawTrailPath(ctx, state.laps[i], getLapColor(i), getLapCode(i), true, level.spawn);
  }
  drawTrailPath(ctx, state.current, C.present, null, false, level.spawn);

  // 4. Spawn marker
  ctx.save();
  ctx.strokeStyle = withAlpha(C.textMuted, 0.45);
  ctx.lineWidth = S.strokeThin;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(level.spawn.x, level.spawn.y, SPAWN_SAFE_RADIUS - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cardinal framing ticks around spawn safe zone
  const sr = SPAWN_SAFE_RADIUS - 4;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = S.strokeThin;
  ctx.beginPath();
  ctx.moveTo(level.spawn.x - sr - 4, level.spawn.y);
  ctx.lineTo(level.spawn.x - sr + 3, level.spawn.y);
  ctx.moveTo(level.spawn.x + sr - 3, level.spawn.y);
  ctx.lineTo(level.spawn.x + sr + 4, level.spawn.y);
  ctx.stroke();
  ctx.restore();

  // 5. Pressure plates (double-coded: ring + fill + checkmark/hollow glyph + label)
  for (const plate of level.plates) {
    const pressed = pressedPlates.has(plate.id);
    ctx.save();

    if (pressed) {
      // Active outer activation halo
      ctx.beginPath();
      ctx.arc(plate.x, plate.y, plate.r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(C.plateOn, 0.7);
      ctx.lineWidth = S.strokeBase;
      ctx.stroke();
    }

    // Outer disc
    ctx.beginPath();
    ctx.arc(plate.x, plate.y, plate.r, 0, Math.PI * 2);
    ctx.fillStyle = pressed ? withAlpha(C.plateOn, 0.28) : withAlpha(C.plateOff, 0.1);
    ctx.fill();
    ctx.lineWidth = pressed ? S.strokeThick : S.strokeThin;
    ctx.strokeStyle = pressed ? C.plateOn : C.plateOff;
    ctx.stroke();

    // Inner ring: solid dark core when pressed vs dashed hollow ring when free
    ctx.beginPath();
    ctx.arc(plate.x, plate.y, plate.r - 6, 0, Math.PI * 2);
    if (pressed) {
      ctx.fillStyle = C.surface;
      ctx.fill();
      ctx.strokeStyle = C.plateOn;
      ctx.lineWidth = S.strokeThin;
      ctx.stroke();
    } else {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = withAlpha(C.plateOff, 0.75);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = pressed ? C.plateOn : C.plateOff;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plate.label, plate.x, plate.y + 0.5);
    ctx.restore();
  }

  // 5b. Ordered Switches (distinct diamond pad with double-coded state: pending / expected / activated / error)
  if (world.sequence.present) {
    for (const sw of world.sequence.switches) {
      const isErr = world.sequence.hasRecentError;
      const strokeColor = isErr
        ? C.switchError
        : sw.activated
          ? C.switchOn
          : sw.isExpected
            ? C.switchExpected
            : C.switchPending;
      const fillColor = isErr
        ? withAlpha(C.switchError, 0.2)
        : sw.activated
          ? C.switchOn
          : sw.isExpected
            ? withAlpha(C.switchExpected, 0.22)
            : withAlpha(C.switchPending, 0.08);

      ctx.save();
      if (sw.isExpected || sw.playerInside || isErr) {
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r + SWITCH_ACTIVATION_MARGIN, 0, Math.PI * 2);
        ctx.setLineDash(isErr ? [] : [4, 3]);
        ctx.strokeStyle = isErr
          ? C.switchError
          : sw.playerInside
            ? C.present
            : C.switchExpected;
        ctx.lineWidth = S.strokeThin;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Diamond body
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y - sw.r);
      ctx.lineTo(sw.x + sw.r, sw.y);
      ctx.lineTo(sw.x, sw.y + sw.r);
      ctx.lineTo(sw.x - sw.r, sw.y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = sw.activated || sw.isExpected || isErr ? S.strokeThick : S.strokeThin;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      const switchText = isErr ? `#${sw.order}!` : `#${sw.order}`;
      ctx.fillStyle = sw.activated ? C.inkOnAccent : isErr ? C.switchError : strokeColor;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(switchText, sw.x, sw.y + 0.5);
      ctx.restore();
    }
  }

  // 6. Goal (Horological brass sanctuary reticle)
  ctx.save();
  ctx.beginPath();
  ctx.arc(level.goal.x, level.goal.y, level.goal.r, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(C.goal, 0.16);
  ctx.fill();
  ctx.lineWidth = S.strokeThick;
  ctx.strokeStyle = C.goal;
  ctx.stroke();

  // Inner rotated diamond beacon
  const gr = level.goal.r * 0.52;
  ctx.beginPath();
  ctx.moveTo(level.goal.x, level.goal.y - gr);
  ctx.lineTo(level.goal.x + gr, level.goal.y);
  ctx.lineTo(level.goal.x, level.goal.y + gr);
  ctx.lineTo(level.goal.x - gr, level.goal.y);
  ctx.closePath();
  ctx.fillStyle = C.goal;
  ctx.fill();

  // Four compass ticks
  ctx.strokeStyle = C.goal;
  ctx.lineWidth = S.strokeThin;
  ctx.beginPath();
  ctx.moveTo(level.goal.x - level.goal.r - 4, level.goal.y);
  ctx.lineTo(level.goal.x - level.goal.r + 3, level.goal.y);
  ctx.moveTo(level.goal.x + level.goal.r - 3, level.goal.y);
  ctx.lineTo(level.goal.x + level.goal.r + 4, level.goal.y);
  ctx.stroke();
  ctx.restore();

  // 7. Doors (open dashed frame vs closed hatched bulkhead + plate requirement)
  for (const door of level.doors) {
    const isOpen = openDoors.has(door.id);
    const dcx = door.x + door.w * 0.5;
    const dcy = door.y + door.h * 0.5;

    ctx.save();
    if (isOpen) {
      ctx.fillStyle = withAlpha(C.doorOpen, 0.12);
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.strokeStyle = C.doorOpen;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = S.strokeThin;
      ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = C.doorClosed;
      ctx.fillRect(door.x, door.y, door.w, door.h);

      // Architectural diagonal hatch inside closed door
      ctx.save();
      ctx.beginPath();
      ctx.rect(door.x + 2, door.y + 2, door.w - 4, door.h - 4);
      ctx.clip();
      ctx.strokeStyle = withAlpha(C.wallEdge, 0.45);
      ctx.lineWidth = 1;
      for (let d = -door.h; d < door.w + door.h; d += 10) {
        ctx.beginPath();
        ctx.moveTo(door.x + d, door.y);
        ctx.lineTo(door.x + d + door.h, door.y + door.h);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = C.plateOff;
      ctx.lineWidth = S.strokeBase;
      ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);

      // High-contrast dark nameplate behind requirement label
      drawRoundedBadge(
        ctx,
        dcx,
        dcy,
        door.requiredPlates.join('+'),
        C.surface,
        C.text,
        C.plateOff,
        '700 10px "JetBrains Mono", monospace'
      );
    }
    ctx.restore();
  }

  // 8. Walls (warm basalt masonry with beveled edge)
  ctx.save();
  for (const wall of level.walls) {
    ctx.fillStyle = C.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = C.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
  ctx.restore();

  // 9. Lasers & Moving Lasers (strictly using deriveWorld effective geometry & D5/F9 precedence)
  for (const ml of level.movingLasers ?? []) {
    ctx.save();
    // Slotted linear A <-> B mechanical rail guide
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = withAlpha(C.wallEdge, 0.75);
    ctx.lineWidth = S.strokeThin;
    ctx.beginPath();
    ctx.moveTo(ml.pointA.x, ml.pointA.y);
    ctx.lineTo(ml.pointB.x, ml.pointB.y);
    ctx.stroke();

    if (ml.beamEndA && ml.beamEndB) {
      ctx.beginPath();
      ctx.moveTo(ml.beamEndA.x, ml.beamEndA.y);
      ctx.lineTo(ml.beamEndB.x, ml.beamEndB.y);
      ctx.stroke();
    } else if (ml.beamOffset) {
      ctx.beginPath();
      ctx.moveTo(ml.pointA.x + ml.beamOffset.x, ml.pointA.y + ml.beamOffset.y);
      ctx.lineTo(ml.pointB.x + ml.beamOffset.x, ml.pointB.y + ml.beamOffset.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Bolted anchor nodes A & B
    ctx.fillStyle = C.surface;
    ctx.strokeStyle = C.wallEdge;
    ctx.lineWidth = S.strokeThin;
    for (const pt of [ml.pointA, ml.pointB]) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  const baseLasers: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isMoving: boolean;
  }> = [
    ...level.lasers.map((l) => ({
      id: l.id,
      x1: l.x1,
      y1: l.y1,
      x2: l.x2,
      y2: l.y2,
      isMoving: false,
    })),
    ...(level.movingLasers ?? []).map((ml) => {
      const geom = getMovingLaserEndpoints(ml, state.t);
      return {
        id: ml.id,
        x1: geom.x1,
        y1: geom.y1,
        x2: geom.x2,
        y2: geom.y2,
        isMoving: true,
      };
    }),
  ];

  for (const base of baseLasers) {
    const segs = lasers.filter((l) => l.laserId === base.id);
    if (segs.length === 0) continue;
    const anyActive = segs.some((s) => s.active);
    const allDisabled = segs.every((s) => s.powered && !s.enabled);

    ctx.save();
    // Emitter turret & receiver socket
    const turretBorder = anyActive
      ? C.laserActive
      : allDisabled
        ? C.laserDisabled
        : C.laserInactive;

    ctx.fillStyle = C.surfaceAlt;
    ctx.strokeStyle = turretBorder;
    ctx.lineWidth = S.strokeBase;
    ctx.beginPath();
    ctx.arc(base.x1, base.y1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (base.isMoving) {
      ctx.beginPath();
      ctx.arc(base.x1, base.y1, 3, 0, Math.PI * 2);
      ctx.fillStyle = anyActive ? C.laserCore : C.textMuted;
      ctx.fill();
    }

    ctx.fillStyle = C.surfaceAlt;
    ctx.strokeStyle = turretBorder;
    ctx.beginPath();
    ctx.arc(base.x2, base.y2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (const seg of segs) {
      if (!seg.powered) {
        // Precedence 1: unpowered standby dotted line
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = withAlpha(C.laserInactive, 0.72);
        ctx.lineWidth = S.strokeBase;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.fullX2, seg.fullY2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (!seg.enabled) {
        // Precedence 2: disabled by ordered switch sequence -> dashed jade safe passage
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = withAlpha(C.laserDisabled, 0.78);
        ctx.lineWidth = S.strokeBase;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.fullX2, seg.fullY2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (!seg.active && seg.blockedByLap !== null) {
        // Precedence 3: occluded downstream by an upstream ghost block
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = withAlpha(C.laserBlocked, 0.45);
        ctx.lineWidth = S.strokeThin;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.fullX2, seg.fullY2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (seg.active) {
        // Precedence 4: active deadly beam (triple-layer glow + core + spine)
        ctx.lineCap = 'round';
        ctx.strokeStyle = withAlpha(C.laserActive, 0.34);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        ctx.strokeStyle = C.laserActive;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        ctx.strokeStyle = C.laserCore;
        ctx.lineWidth = S.strokeThin;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        // Impact shield ring & occluded shadow when truncated by a ghost
        if (seg.blockedByLap !== null) {
          ctx.setLineDash([3, 6]);
          ctx.strokeStyle = withAlpha(C.laserBlocked, 0.38);
          ctx.lineWidth = S.strokeThin;
          ctx.beginPath();
          ctx.moveTo(seg.x2, seg.y2);
          ctx.lineTo(seg.fullX2, seg.fullY2);
          ctx.stroke();
          ctx.setLineDash([]);

          const blockerColor = getLapColor(seg.blockedByLap);

          // Double shield ring at impact point
          ctx.beginPath();
          ctx.arc(seg.x2, seg.y2, 8, 0, Math.PI * 2);
          ctx.strokeStyle = C.laserBlocked;
          ctx.lineWidth = S.strokeThin;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(seg.x2, seg.y2, 5, 0, Math.PI * 2);
          ctx.fillStyle = C.present;
          ctx.fill();
          ctx.strokeStyle = blockerColor;
          ctx.lineWidth = S.strokeBase;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 10. Future preview of ghosts (t+1s and t+2s) — distinct dashed/dotted silhouettes
  if (options.showFuturePreview && ghosts.length > 0) {
    for (const g of ghosts) {
      const lapColor = getLapColor(g.lapIndex);
      const f1 = getFutureGhostFrame(state, g.lapIndex, TICK_HZ);
      const f2 = getFutureGhostFrame(state, g.lapIndex, TICK_HZ * 2);

      ctx.save();
      if (f2) {
        ctx.strokeStyle = withAlpha(lapColor, 0.45);
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = S.strokeThin;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        if (f1) ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.stroke();

        ctx.fillStyle = withAlpha(lapColor, S.opacityFuture2Fill);
        ctx.beginPath();
        ctx.arc(f2.x, f2.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = withAlpha(lapColor, S.opacityFuture2Stroke);
        ctx.lineWidth = S.strokeThin;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (f1) {
        ctx.fillStyle = withAlpha(lapColor, S.opacityFuture1Fill);
        ctx.beginPath();
        ctx.arc(f1.x, f1.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = withAlpha(lapColor, S.opacityFuture1Stroke);
        ctx.lineWidth = S.strokeThin;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = lapColor;
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+1s', f1.x, f1.y - PLAYER_RADIUS - 7);
      }
      ctx.restore();
    }
  }

  // 11. Active Ghosts (solid mineral discs with V1-V6 badge in dark obsidian ink)
  for (const g of ghosts) {
    const lapColor = getLapColor(g.lapIndex);
    const isCulprit = state.dead && state.culpritLap === g.lapIndex;

    ctx.save();
    if (isCulprit) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, PLAYER_RADIUS + 7, 0, Math.PI * 2);
      ctx.strokeStyle = C.laserActive;
      ctx.lineWidth = S.strokeThick;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(g.x, g.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = lapColor;
    ctx.fill();
    ctx.lineWidth = S.strokeBase;
    ctx.strokeStyle = C.bg;
    ctx.stroke();

    // Direction dot
    const nx = g.x + Math.cos(g.angle) * (PLAYER_RADIUS - 3.5);
    const ny = g.y + Math.sin(g.angle) * (PLAYER_RADIUS - 3.5);
    ctx.beginPath();
    ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = C.inkOnAccent;
    ctx.fill();

    // High-contrast V1-V6 code badge (>= 7.72:1 on every lap pigment)
    ctx.fillStyle = C.inkOnAccent;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getLapCode(g.lapIndex), g.x, g.y + 0.5);
    ctx.restore();
  }

  // 12. Present Player (crisp warm ivory disc with inner brass ring, distinct from all V1-V6 ghosts)
  ctx.save();
  if (state.dead) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = C.laserActive;
    ctx.lineWidth = S.strokeThick;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fillStyle = state.dead ? C.laserCore : C.present;
  ctx.fill();
  ctx.lineWidth = S.strokeBase;
  ctx.strokeStyle = C.bg;
  ctx.stroke();

  if (!state.dead) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = S.strokeThin;
    ctx.stroke();
  }

  // Facing indicator
  const px = state.player.x + Math.cos(state.player.angle) * (state.player.r - 4);
  const py = state.player.y + Math.sin(state.player.angle) * (state.player.r - 4);
  ctx.beginPath();
  ctx.arc(px, py, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = C.inkOnAccent;
  ctx.fill();
  ctx.restore();

  // 13. Rewind or Pause non-occluding visual indicator (CL-5: never shown when dead or won)
  if (options.isRewinding) {
    ctx.save();
    ctx.strokeStyle = C.rewind;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
    drawRoundedBadge(
      ctx,
      CANVAS_W * 0.5,
      18,
      '◀ REBOBINANDO',
      C.rewind,
      C.inkOnAccent,
      C.bg,
      '700 11px "JetBrains Mono", monospace'
    );
    ctx.restore();
  } else if (options.isPaused && !state.dead && !world.won) {
    ctx.save();
    ctx.fillStyle = withAlpha(C.bg, S.opacityPauseScrim);
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Compact top plaque that leaves playfield center and HUD clear
    const label = 'PAUSA — Presioná Enter / Intro para continuar';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(label).width;
    const plaqueW = Math.ceil(textW + 32);
    const plaqueH = 34;
    const px0 = (CANVAS_W - plaqueW) * 0.5;
    const py0 = 32;

    ctx.fillStyle = C.surface;
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = S.strokeBase;
    ctx.beginPath();
    ctx.roundRect(px0, py0, plaqueW, plaqueH, S.radiusSm);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, CANVAS_W * 0.5, py0 + plaqueH * 0.5 + 0.5);
    ctx.restore();
  }
}
