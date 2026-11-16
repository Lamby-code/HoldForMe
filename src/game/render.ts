import { COLORS, getLapColor } from './colors.ts';
import { CANVAS_H, CANVAS_W } from './levels.ts';
import {
  deriveWorld,
  getFutureGhostFrame,
  PLAYER_RADIUS,
  SPAWN_SAFE_RADIUS,
  TICK_HZ,
  TRAIL_HALF_WIDTH,
  TRAIL_SAMPLE_INTERVAL,
  type Frame,
  type SimState,
} from './sim.ts';

function drawTrailPath(
  ctx: CanvasRenderingContext2D,
  frames: Frame[],
  color: string,
  isPast: boolean,
  spawn: { x: number; y: number }
) {
  if (frames.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isPast) {
    // Solid past wall ribbon
    ctx.beginPath();
    ctx.moveTo(frames[0].x, frames[0].y);
    for (let i = TRAIL_SAMPLE_INTERVAL; i < frames.length; i += TRAIL_SAMPLE_INTERVAL) {
      ctx.lineTo(frames[i].x, frames[i].y);
    }
    const last = frames[frames.length - 1];
    ctx.lineTo(last.x, last.y);

    // Outer solid border
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2;
    ctx.stroke();

    // Inner fill darker core so overlapping trails stay distinct
    ctx.strokeStyle = '#14161a';
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2 - 5;
    ctx.stroke();

    // Center accent spine
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Softly mask spawn safe zone so player sees spawn is always clear
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = COLORS.bg;
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, SPAWN_SAFE_RADIUS - 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Soft present trail (non-colliding)
    ctx.beginPath();
    ctx.moveTo(frames[0].x, frames[0].y);
    for (let i = TRAIL_SAMPLE_INTERVAL; i < frames.length; i += TRAIL_SAMPLE_INTERVAL) {
      ctx.lineTo(frames[i].x, frames[i].y);
    }
    const last = frames[frames.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2;
    ctx.stroke();

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
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

  // 1. Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle architectural grid (48px)
  ctx.strokeStyle = COLORS.bgGrid;
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

  // 2. Floor wiring lines from plates to doors & powered lasers
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.5;
  for (const door of level.doors) {
    const dcx = door.x + door.w * 0.5;
    const dcy = door.y + door.h * 0.5;
    for (const pId of door.requiredPlates) {
      const plate = level.plates.find((p) => p.id === pId);
      if (!plate) continue;
      const active = pressedPlates.has(pId);
      ctx.strokeStyle = active ? 'rgba(142, 202, 230, 0.5)' : 'rgba(142, 202, 230, 0.16)';
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
      ctx.strokeStyle = active ? 'rgba(255, 59, 59, 0.45)' : 'rgba(255, 59, 59, 0.16)';
      ctx.beginPath();
      ctx.moveTo(plate.x, plate.y);
      ctx.lineTo(lcx, lcy);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. Past trails (solid walls) & current trail (soft)
  for (let i = 0; i < state.lap; i++) {
    drawTrailPath(ctx, state.laps[i], getLapColor(i), true, level.spawn);
  }
  drawTrailPath(ctx, state.current, COLORS.present, false, level.spawn);

  // 4. Spawn marker
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(level.spawn.x, level.spawn.y, SPAWN_SAFE_RADIUS - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INICIO', level.spawn.x, level.spawn.y + SPAWN_SAFE_RADIUS + 10);
  ctx.restore();

  // 5. Pressure plates
  for (const plate of level.plates) {
    const pressed = pressedPlates.has(plate.id);
    ctx.save();
    ctx.beginPath();
    ctx.arc(plate.x, plate.y, plate.r, 0, Math.PI * 2);
    ctx.fillStyle = pressed ? 'rgba(142, 202, 230, 0.32)' : 'rgba(142, 202, 230, 0.08)';
    ctx.fill();
    ctx.lineWidth = pressed ? 2.5 : 1.5;
    ctx.strokeStyle = pressed ? COLORS.plateActive : COLORS.plate;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(plate.x, plate.y, plate.r - 6, 0, Math.PI * 2);
    ctx.strokeStyle = pressed ? COLORS.plate : 'rgba(142, 202, 230, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = pressed ? '#ffffff' : COLORS.plate;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plate.label, plate.x, plate.y);
    ctx.restore();
  }

  // 6. Goal
  ctx.save();
  ctx.beginPath();
  ctx.arc(level.goal.x, level.goal.y, level.goal.r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 183, 3, 0.16)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COLORS.goal;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(level.goal.x, level.goal.y, level.goal.r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.goal;
  ctx.fill();

  ctx.fillStyle = COLORS.goal;
  ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('META', level.goal.x, level.goal.y - level.goal.r - 8);
  ctx.restore();

  // 7. Doors
  for (const door of level.doors) {
    const isOpen = openDoors.has(door.id);
    ctx.save();
    if (isOpen) {
      ctx.fillStyle = COLORS.doorOpen;
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.strokeStyle = 'rgba(142, 202, 230, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = COLORS.doorClosed;
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.strokeStyle = COLORS.plate;
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);

      // Door requirement label
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(door.requiredPlates.join('+'), door.x + door.w * 0.5, door.y + door.h * 0.5);
    }
    ctx.restore();
  }

  // 8. Walls
  ctx.save();
  for (const wall of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = COLORS.wallHighlight;
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
  ctx.restore();

  // 9. Lasers
  for (const laserDef of level.lasers) {
    const seg = lasers.find((l) => l.id === laserDef.id);
    if (!seg) continue;

    ctx.save();
    // Emitter turret & receiver sockets
    ctx.fillStyle = '#252a32';
    ctx.strokeStyle = seg.active ? COLORS.laser : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(laserDef.x1, laserDef.y1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(laserDef.x2, laserDef.y2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!seg.active) {
      // Standby dotted line so player sees where the beam will fire
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = COLORS.laserDim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laserDef.x1, laserDef.y1);
      ctx.lineTo(laserDef.x2, laserDef.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Active deadly beam glow + core
      ctx.strokeStyle = 'rgba(255, 59, 59, 0.35)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();

      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffd6d6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();

      // Impact ring if blocked by ghost
      if (seg.blockedByLap !== null) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = COLORS.laser;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(seg.x2, seg.y2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 10. Future preview of ghosts (t+1s and t+2s)
  if (options.showFuturePreview && ghosts.length > 0) {
    for (const g of ghosts) {
      const color = getLapColor(g.lapIndex);
      const f1 = getFutureGhostFrame(state, g.lapIndex, TICK_HZ);
      const f2 = getFutureGhostFrame(state, g.lapIndex, TICK_HZ * 2);

      ctx.save();
      if (f2) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        if (f1) ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(f2.x, f2.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (f1) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.32;
        ctx.beginPath();
        ctx.arc(f1.x, f1.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 11. Active Ghosts
  for (const g of ghosts) {
    const color = getLapColor(g.lapIndex);
    const isCulprit = state.dead && state.culpritLap === g.lapIndex;

    ctx.save();
    if (isCulprit) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, PLAYER_RADIUS + 7, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(g.x, g.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f1115';
    ctx.stroke();

    // Direction dot
    const nx = g.x + Math.cos(g.angle) * (PLAYER_RADIUS - 4);
    const ny = g.y + Math.sin(g.angle) * (PLAYER_RADIUS - 4);
    ctx.beginPath();
    ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f1115';
    ctx.fill();

    // Lap number badge
    ctx.fillStyle = '#0f1115';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(g.lapIndex + 1), g.x, g.y + 0.5);
    ctx.restore();
  }

  // 12. Present Player
  ctx.save();
  if (state.dead) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.laser;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fillStyle = state.dead ? '#fca5a5' : COLORS.present;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0f1115';
  ctx.stroke();

  // Facing indicator
  const px = state.player.x + Math.cos(state.player.angle) * (state.player.r - 4);
  const py = state.player.y + Math.sin(state.player.angle) * (state.player.r - 4);
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#14161a';
  ctx.fill();
  ctx.restore();

  // 13. Rewind or Pause subtle border indicator
  if (options.isRewinding) {
    ctx.save();
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
    ctx.restore();
  } else if (options.isPaused && !state.dead && !world.won) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 22, 26, 0.28)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA — Presioná Espacio para continuar', CANVAS_W * 0.5, 48);
    ctx.restore();
  }
}
