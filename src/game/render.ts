import { getLapCode, getLapColor, TOKENS, withAlpha } from './colors.ts';
import { CANVAS_H, CANVAS_W, type Door, type Rect } from './levels.ts';
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

// Lightweight visual-only interpolation cache for hydraulic door leaf retraction
let lastRenderedLevelId = -1;
let lastAnimTimeMs = 0;
const doorOpenProgress = new Map<string, number>();

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
  ctx.roundRect(rx, ry, boxW, boxH, r);
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

/**
 * Draws a 90-degree orthogonal laboratory circuit conduit between source and target,
 * with animated luminous energy pulses when active.
 */
function drawConduit(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  active: boolean,
  activeColor: string,
  idleColor: string,
  timeSec: number,
  reducedMotion: boolean
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const midX = x1 + dx * 0.5;

  // Build orthogonal polyline points (horizontal-vertical-horizontal or direct if aligned)
  const pts: Array<{ x: number; y: number }> =
    Math.abs(dx) < 8 || Math.abs(dy) < 8
      ? [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ]
      : [
          { x: x1, y: y1 },
          { x: midX, y: y1 },
          { x: midX, y: y2 },
          { x: x2, y: y2 },
        ];

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
  };

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Recessed dark floor trench
  tracePath();
  ctx.strokeStyle = withAlpha('#04070B', 0.65);
  ctx.lineWidth = active ? 6 : 4;
  ctx.stroke();

  if (active) {
    // Soft ambient conduit glow
    tracePath();
    ctx.strokeStyle = withAlpha(activeColor, 0.24);
    ctx.lineWidth = 7;
    ctx.stroke();

    // Crisp energized conductor
    tracePath();
    ctx.strokeStyle = withAlpha(activeColor, 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Traveling energy pulses along conduit segments
    if (!reducedMotion) {
      let totalLen = 0;
      const segLens: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        segLens.push(len);
        totalLen += len;
      }

      if (totalLen > 12) {
        const spacing = 72;
        const speed = 95;
        const offset = (timeSec * speed) % spacing;
        for (let d = offset; d < totalLen; d += spacing) {
          let rem = d;
          for (let i = 0; i < segLens.length; i++) {
            if (rem <= segLens[i] && segLens[i] > 0) {
              const t = rem / segLens[i];
              const px = pts[i].x + (pts[i + 1].x - pts[i].x) * t;
              const py = pts[i].y + (pts[i + 1].y - pts[i].y) * t;
              ctx.beginPath();
              ctx.arc(px, py, 2.6, 0, Math.PI * 2);
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
              break;
            }
            rem -= segLens[i];
          }
        }
      }
    }
  } else {
    tracePath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = withAlpha(idleColor, 0.34);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Elbow junction rivets
  if (pts.length > 2) {
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = active ? activeColor : C.borderSubtle;
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawTestChamberFloor(ctx: CanvasRenderingContext2D) {
  // Base dark chamber slate
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Machined 48x48 modular floor panels with very subtle alternating titanium sheen
  const tileSize = 48;
  for (let gx = 0; gx < CANVAS_W; gx += tileSize) {
    for (let gy = 0; gy < CANVAS_H; gy += tileSize) {
      const ix = Math.floor(gx / tileSize);
      const iy = Math.floor(gy / tileSize);
      const hash = (ix * 17 + iy * 31) % 5;
      if (hash === 0) {
        ctx.fillStyle = 'rgba(130, 175, 220, 0.022)';
        ctx.fillRect(gx + 1, gy + 1, tileSize - 2, tileSize - 2);
      } else if (hash === 2) {
        ctx.fillStyle = 'rgba(5, 9, 15, 0.24)';
        ctx.fillRect(gx + 1, gy + 1, tileSize - 2, tileSize - 2);
      }
    }
  }

  // Overhead studio test-chamber illumination + subtle perimeter vignette
  const lightGrad = ctx.createRadialGradient(
    CANVAS_W * 0.5,
    CANVAS_H * 0.46,
    60,
    CANVAS_W * 0.5,
    CANVAS_H * 0.5,
    CANVAS_W * 0.62
  );
  lightGrad.addColorStop(0, 'rgba(92, 148, 210, 0.065)');
  lightGrad.addColorStop(0.55, 'rgba(20, 32, 48, 0.02)');
  lightGrad.addColorStop(1, 'rgba(3, 6, 11, 0.42)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Panel grid seams
  ctx.strokeStyle = C.bgGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 24; gx <= CANVAS_W - 24; gx += 48) {
    ctx.moveTo(gx + 0.5, 24);
    ctx.lineTo(gx + 0.5, CANVAS_H - 24);
  }
  for (let gy = 24; gy <= CANVAS_H - 24; gy += 48) {
    ctx.moveTo(24, gy + 0.5);
    ctx.lineTo(CANVAS_W - 24, gy + 0.5);
  }
  ctx.stroke();

  // Precision floor junction crosshairs every 96px
  ctx.strokeStyle = C.bgGridMajor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 72; gx <= CANVAS_W - 72; gx += 96) {
    for (let gy = 72; gy <= CANVAS_H - 72; gy += 96) {
      ctx.moveTo(gx - 4, gy + 0.5);
      ctx.lineTo(gx + 4, gy + 0.5);
      ctx.moveTo(gx + 0.5, gy - 4);
      ctx.lineTo(gx + 0.5, gy + 4);
    }
  }
  ctx.stroke();
}

function drawTrailPath(
  ctx: CanvasRenderingContext2D,
  frames: Frame[],
  lapColor: string,
  lapCode: string | null,
  isPast: boolean,
  spawn: { x: number; y: number },
  timeSec: number,
  reducedMotion: boolean
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
    // Soft ambient barrier shadow
    ctx.save();
    ctx.translate(2, 3);
    ctx.strokeStyle = 'rgba(3, 6, 11, 0.45)';
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2 + 2;
    ctx.stroke();
    ctx.restore();

    // Outer energized containment rim
    ctx.strokeStyle = withAlpha(lapColor, 0.92);
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2;
    ctx.stroke();

    // Dark recessed steel channel
    ctx.strokeStyle = withAlpha(C.bg, 0.78);
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2 - 5;
    ctx.stroke();

    // Central luminous energy rail
    ctx.strokeStyle = withAlpha(lapColor, 0.62);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Softly mask spawn safe zone so player sees spawn remains clear
    ctx.fillStyle = withAlpha(C.bg, 0.9);
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, SPAWN_SAFE_RADIUS - 4, 0, Math.PI * 2);
    ctx.fill();

    // Visible V1-V6 badge anchored on the past trail
    if (lapCode) {
      const anchor = findTrailLabelAnchor(frames, spawn);
      if (anchor) {
        drawRoundedBadge(ctx, anchor.x, anchor.y, lapCode, lapColor, C.inkOnAccent, C.bg);
      }
    }
  } else {
    // Non-colliding present holographic guide trace
    ctx.strokeStyle = withAlpha(C.present, 0.14);
    ctx.lineWidth = TRAIL_HALF_WIDTH * 2;
    ctx.stroke();

    ctx.setLineDash([6, 6]);
    if (!reducedMotion) {
      ctx.lineDashOffset = -timeSec * 24;
    }
    ctx.strokeStyle = withAlpha(C.present, 0.68);
    ctx.lineWidth = S.strokeBase;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawHydraulicDoor(
  ctx: CanvasRenderingContext2D,
  door: Door,
  openProgress: number,
  pressedPlates: Set<string>,
  timeSec: number,
  reducedMotion: boolean
) {
  const isHorizontal = door.w >= door.h;
  const dcx = door.x + door.w * 0.5;
  const dcy = door.y + door.h * 0.5;
  const jambSize = Math.min(10, Math.max(6, (isHorizontal ? door.w : door.h) * 0.12));

  ctx.save();

  // 1. Floor threshold track visible beneath/when open
  ctx.fillStyle = withAlpha('#050910', 0.85);
  ctx.fillRect(door.x, door.y, door.w, door.h);

  // Recessed steel slot
  ctx.strokeStyle = withAlpha(C.borderSubtle, 0.9);
  ctx.lineWidth = 1;
  ctx.strokeRect(door.x + 0.5, door.y + 0.5, door.w - 1, door.h - 1);

  // Emerald safe-passage floor illumination when opening/open
  if (openProgress > 0.02) {
    const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(timeSec * 5);
    ctx.fillStyle = withAlpha(C.doorOpen, 0.14 * openProgress * pulse);
    ctx.fillRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);

    // Center threshold guide line
    ctx.strokeStyle = withAlpha(C.doorOpen, 0.55 * openProgress);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (isHorizontal) {
      ctx.moveTo(door.x + jambSize, dcy);
      ctx.lineTo(door.x + door.w - jambSize, dcy);
    } else {
      ctx.moveTo(dcx, door.y + jambSize);
      ctx.lineTo(dcx, door.y + door.h - jambSize);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Retracting twin armored bulkhead leaves
  const innerSpan = (isHorizontal ? door.w : door.h) - jambSize * 2;
  const leafSpan = Math.max(0, (innerSpan * 0.5) * (1 - openProgress));

  if (leafSpan > 0.5) {
    const leaves: Rect[] = isHorizontal
      ? [
          { x: door.x + jambSize, y: door.y + 1, w: leafSpan, h: door.h - 2 },
          {
            x: door.x + door.w - jambSize - leafSpan,
            y: door.y + 1,
            w: leafSpan,
            h: door.h - 2,
          },
        ]
      : [
          { x: door.x + 1, y: door.y + jambSize, w: door.w - 2, h: leafSpan },
          {
            x: door.x + 1,
            y: door.y + door.h - jambSize - leafSpan,
            w: door.w - 2,
            h: leafSpan,
          },
        ];

    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];

      // Leaf drop shadow
      ctx.fillStyle = 'rgba(3, 6, 11, 0.45)';
      ctx.fillRect(leaf.x + 2, leaf.y + 3, leaf.w, leaf.h);

      // Metallic bulkhead gradient
      const grad = isHorizontal
        ? ctx.createLinearGradient(leaf.x, leaf.y, leaf.x, leaf.y + leaf.h)
        : ctx.createLinearGradient(leaf.x, leaf.y, leaf.x + leaf.w, leaf.y);
      grad.addColorStop(0, '#3C4F68');
      grad.addColorStop(0.5, C.doorClosed);
      grad.addColorStop(1, '#1A2433');
      ctx.fillStyle = grad;
      ctx.fillRect(leaf.x, leaf.y, leaf.w, leaf.h);

      // Subtle diagonal industrial chevron stripes clipped to leaf
      ctx.save();
      ctx.beginPath();
      ctx.rect(leaf.x + 1, leaf.y + 1, Math.max(0, leaf.w - 2), Math.max(0, leaf.h - 2));
      ctx.clip();
      ctx.strokeStyle = withAlpha(C.plateOff, 0.16);
      ctx.lineWidth = 2;
      const diagMax = leaf.w + leaf.h;
      for (let d = -leaf.h; d < diagMax; d += 10) {
        ctx.beginPath();
        ctx.moveTo(leaf.x + d, leaf.y);
        ctx.lineTo(leaf.x + d + leaf.h, leaf.y + leaf.h);
        ctx.stroke();
      }
      ctx.restore();

      // Armored leaf border & glowing seam edge
      ctx.strokeStyle = withAlpha(C.wallEdge, 0.85);
      ctx.lineWidth = 1;
      ctx.strokeRect(leaf.x + 0.5, leaf.y + 0.5, Math.max(0, leaf.w - 1), Math.max(0, leaf.h - 1));

      // Bright accent lip on the meeting edge
      ctx.strokeStyle = openProgress > 0.15 ? C.doorOpen : C.plateOff;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isHorizontal) {
        const edgeX = i === 0 ? leaf.x + leaf.w - 1 : leaf.x + 1;
        ctx.moveTo(edgeX, leaf.y + 1);
        ctx.lineTo(edgeX, leaf.y + leaf.h - 1);
      } else {
        const edgeY = i === 0 ? leaf.y + leaf.h - 1 : leaf.y + 1;
        ctx.moveTo(leaf.x + 1, edgeY);
        ctx.lineTo(leaf.x + leaf.w - 1, edgeY);
      }
      ctx.stroke();
    }
  }

  // 3. Fixed heavy hydraulic jamb housings at both ends (always visible)
  const jambs: Rect[] = isHorizontal
    ? [
        { x: door.x, y: door.y - 1, w: jambSize, h: door.h + 2 },
        { x: door.x + door.w - jambSize, y: door.y - 1, w: jambSize, h: door.h + 2 },
      ]
    : [
        { x: door.x - 1, y: door.y, w: door.w + 2, h: jambSize },
        { x: door.x - 1, y: door.y + door.h - jambSize, w: door.w + 2, h: jambSize },
      ];

  const allSatisfied = openProgress > 0.5;
  for (const j of jambs) {
    ctx.fillStyle = C.surfaceAlt;
    ctx.fillRect(j.x, j.y, j.w, j.h);
    ctx.strokeStyle = allSatisfied ? C.doorOpen : C.wallEdge;
    ctx.lineWidth = 1.25;
    ctx.strokeRect(j.x + 0.5, j.y + 0.5, j.w - 1, j.h - 1);

    // Mini LED status bar embedded in jamb
    const ledColor = allSatisfied ? C.doorOpen : C.plateOff;
    ctx.fillStyle = ledColor;
    if (isHorizontal) {
      ctx.fillRect(j.x + j.w * 0.5 - 1.5, j.y + 3, 3, Math.max(4, j.h - 6));
    } else {
      ctx.fillRect(j.x + 3, j.y + j.h * 0.5 - 1.5, Math.max(4, j.w - 6), 3);
    }
  }

  // 4. Requirement nameplate & per-plate LED status pips when closed
  if (openProgress < 0.55) {
    ctx.globalAlpha = Math.max(0, 1 - openProgress * 2);
    const label = door.requiredPlates.join('+');
    drawRoundedBadge(
      ctx,
      dcx,
      dcy,
      label,
      C.surface,
      C.text,
      C.plateOff,
      '700 10px "JetBrains Mono", monospace'
    );

    // Individual LED pips above badge if multiple plates required (e.g. A+B)
    if (door.requiredPlates.length > 1) {
      const pipSpacing = 8;
      const startOffset = -((door.requiredPlates.length - 1) * pipSpacing) * 0.5;
      const pipY = dcy - 13;
      for (let i = 0; i < door.requiredPlates.length; i++) {
        const pActive = pressedPlates.has(door.requiredPlates[i]);
        const pipX = dcx + startOffset + i * pipSpacing;
        ctx.beginPath();
        ctx.arc(pipX, pipY, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = pActive ? C.doorOpen : C.surfaceMuted;
        ctx.fill();
        ctx.strokeStyle = pActive ? C.doorOpen : C.border;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawWalls(ctx: CanvasRenderingContext2D, walls: Rect[]) {
  ctx.save();

  // Pass 1: Cast directional drop shadows onto test-chamber floor for 2.5D depth
  ctx.fillStyle = 'rgba(3, 6, 11, 0.54)';
  for (const wall of walls) {
    ctx.fillRect(wall.x + 4, wall.y + 6, wall.w, wall.h);
  }

  // Pass 2: Tactile armored wall panels with metallic gradient, modular seams, and 2.5D bevels
  for (const wall of walls) {
    const grad = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
    grad.addColorStop(0, C.wallTop);
    grad.addColorStop(0.28, C.wall);
    grad.addColorStop(1, '#1E2A38');
    ctx.fillStyle = grad;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

    // Clip to wall interior for modular test-chamber panel joints & micro-rivets
    ctx.save();
    ctx.beginPath();
    ctx.rect(wall.x + 2, wall.y + 2, Math.max(0, wall.w - 4), Math.max(0, wall.h - 4));
    ctx.clip();

    // Subtle inset metallic plate face
    if (wall.w >= 16 && wall.h >= 16) {
      ctx.strokeStyle = withAlpha('#0B1017', 0.45);
      ctx.lineWidth = 1;
      ctx.strokeRect(wall.x + 3.5, wall.y + 3.5, wall.w - 7, wall.h - 7);
    }

    // World-aligned 48px modular bulkhead panel seams
    const panelStep = 48;
    ctx.strokeStyle = withAlpha('#090E15', 0.52);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (
      let sx = Math.ceil((wall.x + 12) / panelStep) * panelStep;
      sx <= wall.x + wall.w - 12;
      sx += panelStep
    ) {
      ctx.moveTo(sx + 0.5, wall.y);
      ctx.lineTo(sx + 0.5, wall.y + wall.h);
    }
    for (
      let sy = Math.ceil((wall.y + 12) / panelStep) * panelStep;
      sy <= wall.y + wall.h - 12;
      sy += panelStep
    ) {
      ctx.moveTo(wall.x, sy + 0.5);
      ctx.lineTo(wall.x + wall.w, sy + 0.5);
    }
    ctx.stroke();

    // Subtle highlight next to seams
    ctx.strokeStyle = withAlpha(C.wallEdge, 0.16);
    ctx.beginPath();
    for (
      let sx = Math.ceil((wall.x + 12) / panelStep) * panelStep;
      sx <= wall.x + wall.w - 12;
      sx += panelStep
    ) {
      ctx.moveTo(sx + 1.5, wall.y);
      ctx.lineTo(sx + 1.5, wall.y + wall.h);
    }
    for (
      let sy = Math.ceil((wall.y + 12) / panelStep) * panelStep;
      sy <= wall.y + wall.h - 12;
      sy += panelStep
    ) {
      ctx.moveTo(wall.x, sy + 1.5);
      ctx.lineTo(wall.x + wall.w, sy + 1.5);
    }
    ctx.stroke();

    // Small precision fasteners at corners of thicker walls
    if (wall.w >= 20 && wall.h >= 20) {
      ctx.fillStyle = withAlpha(C.wallEdge, 0.38);
      const inset = 6.5;
      const corners = [
        [wall.x + inset, wall.y + inset],
        [wall.x + wall.w - inset, wall.y + inset],
        [wall.x + inset, wall.y + wall.h - inset],
        [wall.x + wall.w - inset, wall.y + wall.h - inset],
      ];
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // 2.5D top/left light bevel
    ctx.strokeStyle = withAlpha(C.wallEdge, 0.72);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(wall.x + 0.5, wall.y + wall.h - 0.5);
    ctx.lineTo(wall.x + 0.5, wall.y + 0.5);
    ctx.lineTo(wall.x + wall.w - 0.5, wall.y + 0.5);
    ctx.stroke();

    // 2.5D bottom/right dark bevel
    ctx.strokeStyle = C.wallShadow;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wall.x + wall.w - 0.5, wall.y + 0.5);
    ctx.lineTo(wall.x + wall.w - 0.5, wall.y + wall.h - 0.5);
    ctx.lineTo(wall.x + 0.5, wall.y + wall.h - 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMachinedRail(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;

  ctx.save();
  ctx.lineCap = 'round';

  // Outer machined rail housing
  ctx.strokeStyle = C.borderSubtle;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Deep recessed track groove
  ctx.strokeStyle = '#05080D';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Subtle center metallic guide rail
  ctx.strokeStyle = withAlpha(C.wallEdge, 0.45);
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bolted hydraulic end-stops at A & B
  for (const [px, py] of [
    [ax, ay],
    [bx, by],
  ]) {
    ctx.fillStyle = C.surfaceAlt;
    ctx.strokeStyle = C.wallEdge;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.bg;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawLaserEmitter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  state: 'active' | 'disabled' | 'inactive',
  isMoving: boolean
) {
  const accent =
    state === 'active'
      ? C.laserActive
      : state === 'disabled'
        ? C.laserDisabled
        : C.laserInactive;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Drop shadow
  ctx.fillStyle = 'rgba(3, 6, 11, 0.55)';
  ctx.beginPath();
  ctx.arc(2, 3, 9.5, 0, Math.PI * 2);
  ctx.fill();

  // Sliding carriage mount for moving lasers
  if (isMoving) {
    ctx.fillStyle = '#1D2938';
    ctx.strokeStyle = C.wallEdge;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Barrel nozzle pointing along beam direction (+X)
  ctx.fillStyle = '#2B3A4D';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(2, -4.5, 10, 9, 2);
  ctx.fill();
  ctx.stroke();

  // Main armored turret housing
  ctx.fillStyle = C.surfaceAlt;
  ctx.strokeStyle = C.wallEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Status core ring on top of turret
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fillStyle = state === 'active' ? C.laserCore : withAlpha(accent, 0.35);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Emitter lens glow at muzzle tip
  if (state === 'active') {
    const glow = ctx.createRadialGradient(11, 0, 1, 11, 0, 11);
    glow.addColorStop(0, C.laserCore);
    glow.addColorStop(0.4, withAlpha(C.laserActive, 0.7));
    glow.addColorStop(1, withAlpha(C.laserActive, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(11, 0, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawLaserReceiver(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  state: 'active' | 'disabled' | 'inactive'
) {
  const accent =
    state === 'active'
      ? C.laserActive
      : state === 'disabled'
        ? C.laserDisabled
        : C.laserInactive;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Drop shadow
  ctx.fillStyle = 'rgba(3, 6, 11, 0.5)';
  ctx.beginPath();
  ctx.arc(1.5, 2.5, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // Collector dish housing
  ctx.fillStyle = C.surfaceAlt;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Collector aperture facing incoming beam (+X after rotation by angle + PI)
  ctx.fillStyle = state === 'active' ? withAlpha(C.laserActive, 0.75) : C.surfaceMuted;
  ctx.beginPath();
  ctx.arc(2.5, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export interface RenderOptions {
  showFuturePreview: boolean;
  isRewinding: boolean;
  isPaused: boolean;
  nowMs?: number;
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  options: RenderOptions
) {
  const world = deriveWorld(state);
  const { level, ghosts, pressedPlates, openDoors, lasers } = world;
  const reducedMotion = getPrefersReducedMotion();

  const nowMs = options.nowMs ?? (typeof performance !== 'undefined' ? performance.now() : 0);
  const timeSec = nowMs * 0.001;

  // Reset visual door interpolation on level change
  if (lastRenderedLevelId !== level.id) {
    lastRenderedLevelId = level.id;
    doorOpenProgress.clear();
    for (const door of level.doors) {
      doorOpenProgress.set(door.id, openDoors.has(door.id) ? 1 : 0);
    }
    lastAnimTimeMs = nowMs;
  }

  const dtSec = Math.min(0.05, Math.max(0, (nowMs - lastAnimTimeMs) * 0.001));
  lastAnimTimeMs = nowMs;

  // Update visual-only door slide progress (fast ~130ms hydraulic response)
  for (const door of level.doors) {
    const target = openDoors.has(door.id) ? 1 : 0;
    const prev = doorOpenProgress.get(door.id) ?? target;
    if (reducedMotion || dtSec <= 0) {
      doorOpenProgress.set(door.id, target);
    } else {
      const rate = 11;
      const next = prev + (target - prev) * Math.min(1, dtSec * rate);
      doorOpenProgress.set(door.id, Math.abs(target - next) < 0.01 ? target : next);
    }
  }

  // 1. Tactile Test Chamber Floor & Studio Overhead Lighting
  drawTestChamberFloor(ctx);

  // 2. Orthogonal Floor Conduits with Live Energy Pulses (doors only)
  for (const door of level.doors) {
    const dcx = door.x + door.w * 0.5;
    const dcy = door.y + door.h * 0.5;
    for (const pId of door.requiredPlates) {
      const plate = level.plates.find((p) => p.id === pId);
      if (!plate) continue;
      drawConduit(
        ctx,
        plate.x,
        plate.y,
        dcx,
        dcy,
        pressedPlates.has(pId),
        C.doorOpen,
        C.plateOff,
        timeSec,
        reducedMotion
      );
    }
  }

  // 3. Past trails (solid walls with V1-V6 labels) & current trail (holographic trace)
  for (let i = 0; i < state.lap; i++) {
    drawTrailPath(
      ctx,
      state.laps[i],
      getLapColor(i),
      getLapCode(i),
      true,
      level.spawn,
      timeSec,
      reducedMotion
    );
  }
  drawTrailPath(ctx, state.current, C.present, null, false, level.spawn, timeSec, reducedMotion);

  // 4. Spawn Pad (Recessed Test-Chamber Origin Pad)
  ctx.save();
  const sr = SPAWN_SAFE_RADIUS - 4;
  ctx.fillStyle = withAlpha(C.surface, 0.72);
  ctx.beginPath();
  ctx.arc(level.spawn.x, level.spawn.y, sr, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(C.border, 0.58);
  ctx.lineWidth = S.strokeThin;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(level.spawn.x, level.spawn.y, sr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Precision cardinal framing brackets around spawn pad
  ctx.strokeStyle = C.wallEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(level.spawn.x - sr - 4, level.spawn.y);
  ctx.lineTo(level.spawn.x - sr + 3, level.spawn.y);
  ctx.moveTo(level.spawn.x + sr - 3, level.spawn.y);
  ctx.lineTo(level.spawn.x + sr + 4, level.spawn.y);
  ctx.moveTo(level.spawn.x, level.spawn.y - sr - 4);
  ctx.lineTo(level.spawn.x, level.spawn.y - sr + 3);
  ctx.moveTo(level.spawn.x, level.spawn.y + sr - 3);
  ctx.lineTo(level.spawn.x, level.spawn.y + sr + 4);
  ctx.stroke();
  ctx.restore();

  // 5. Tactile Pressure Plates (Beveled floor switch housings with live illumination)
  for (const plate of level.plates) {
    const pressed = pressedPlates.has(plate.id);
    ctx.save();

    if (pressed) {
      // Soft floor glow aura when activated
      const halo = ctx.createRadialGradient(
        plate.x,
        plate.y,
        plate.r * 0.4,
        plate.x,
        plate.y,
        plate.r + 14
      );
      halo.addColorStop(0, withAlpha(C.plateOn, 0.36));
      halo.addColorStop(1, withAlpha(C.plateOn, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(plate.x, plate.y, plate.r + 14, 0, Math.PI * 2);
      ctx.fill();

      // Active outer activation ring
      const pulseR = reducedMotion ? plate.r + 5 : plate.r + 4.5 + Math.sin(timeSec * 6) * 1.2;
      ctx.beginPath();
      ctx.arc(plate.x, plate.y, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(C.plateOn, 0.72);
      ctx.lineWidth = S.strokeBase;
      ctx.stroke();
    }

    // Drop shadow under outer metal bezel
    ctx.fillStyle = 'rgba(3, 6, 11, 0.55)';
    ctx.beginPath();
    ctx.arc(plate.x + 1.5, plate.y + 2.5, plate.r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer recessed steel housing ring
    ctx.beginPath();
    ctx.arc(plate.x, plate.y, plate.r + 1, 0, Math.PI * 2);
    ctx.fillStyle = C.surfaceAlt;
    ctx.fill();
    ctx.lineWidth = pressed ? S.strokeThick : S.strokeThin;
    ctx.strokeStyle = pressed ? C.plateOn : C.plateOff;
    ctx.stroke();

    // Inner tactile button cap (raised gradient when idle vs depressed glowing core when pressed)
    const capR = plate.r - 4.5;
    ctx.beginPath();
    ctx.arc(plate.x, plate.y, capR, 0, Math.PI * 2);
    if (pressed) {
      const pressedGrad = ctx.createRadialGradient(
        plate.x,
        plate.y,
        1,
        plate.x,
        plate.y,
        capR
      );
      pressedGrad.addColorStop(0, withAlpha(C.plateOn, 0.35));
      pressedGrad.addColorStop(1, C.surface);
      ctx.fillStyle = pressedGrad;
      ctx.fill();
      ctx.strokeStyle = C.plateOn;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      const idleGrad = ctx.createLinearGradient(
        plate.x,
        plate.y - capR,
        plate.x,
        plate.y + capR
      );
      idleGrad.addColorStop(0, '#27384D');
      idleGrad.addColorStop(1, '#141E2B');
      ctx.fillStyle = idleGrad;
      ctx.fill();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = withAlpha(C.plateOff, 0.72);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = pressed ? C.plateOn : C.plateOff;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plate.label, plate.x, plate.y + (pressed ? 1 : 0.5));
    ctx.restore();
  }

  // 5b. Ordered Switches (Tactile beveled diamond terminals)
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

      ctx.save();
      if (sw.isExpected || sw.playerInside || isErr) {
        const ringR =
          sw.r +
          SWITCH_ACTIVATION_MARGIN +
          (!reducedMotion && sw.isExpected ? Math.sin(timeSec * 5) * 1.4 : 0);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, ringR, 0, Math.PI * 2);
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

      // Drop shadow
      ctx.beginPath();
      ctx.moveTo(sw.x + 1.5, sw.y - sw.r + 2.5);
      ctx.lineTo(sw.x + sw.r + 1.5, sw.y + 2.5);
      ctx.lineTo(sw.x + 1.5, sw.y + sw.r + 2.5);
      ctx.lineTo(sw.x - sw.r + 1.5, sw.y + 2.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(3, 6, 11, 0.5)';
      ctx.fill();

      // Diamond terminal pad
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y - sw.r);
      ctx.lineTo(sw.x + sw.r, sw.y);
      ctx.lineTo(sw.x, sw.y + sw.r);
      ctx.lineTo(sw.x - sw.r, sw.y);
      ctx.closePath();

      if (sw.activated) {
        ctx.fillStyle = C.switchOn;
      } else {
        const dGrad = ctx.createLinearGradient(sw.x, sw.y - sw.r, sw.x, sw.y + sw.r);
        dGrad.addColorStop(
          0,
          isErr
            ? withAlpha(C.switchError, 0.28)
            : sw.isExpected
              ? withAlpha(C.switchExpected, 0.28)
              : '#223042'
        );
        dGrad.addColorStop(1, C.surface);
        ctx.fillStyle = dGrad;
      }
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

  // 6. Goal (Animated Golden Extraction Pad / Chrono-Beacon)
  ctx.save();
  const goalPulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(timeSec * 3.4);

  // Soft radial floor halo
  const goalHalo = ctx.createRadialGradient(
    level.goal.x,
    level.goal.y,
    4,
    level.goal.x,
    level.goal.y,
    level.goal.r + 18
  );
  goalHalo.addColorStop(0, withAlpha(C.goal, 0.34 * goalPulse));
  goalHalo.addColorStop(0.6, withAlpha(C.goal, 0.12 * goalPulse));
  goalHalo.addColorStop(1, withAlpha(C.goal, 0));
  ctx.fillStyle = goalHalo;
  ctx.beginPath();
  ctx.arc(level.goal.x, level.goal.y, level.goal.r + 18, 0, Math.PI * 2);
  ctx.fill();

  // Recessed socket base
  ctx.beginPath();
  ctx.arc(level.goal.x, level.goal.y, level.goal.r, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(C.surface, 0.88);
  ctx.fill();
  ctx.lineWidth = S.strokeThick;
  ctx.strokeStyle = C.goal;
  ctx.stroke();

  // Rotating outer precision segmented ring
  ctx.save();
  ctx.translate(level.goal.x, level.goal.y);
  if (!reducedMotion) {
    ctx.rotate(timeSec * 0.75);
  }
  ctx.strokeStyle = withAlpha(C.goal, 0.65);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const startA = i * (Math.PI * 0.5) + 0.22;
    const endA = startA + Math.PI * 0.5 - 0.44;
    ctx.beginPath();
    ctx.arc(0, 0, level.goal.r + 4.5, startA, endA);
    ctx.stroke();
  }
  ctx.restore();

  // Inner luminous diamond beacon
  const gr = level.goal.r * (0.48 + 0.06 * goalPulse);
  ctx.beginPath();
  ctx.moveTo(level.goal.x, level.goal.y - gr);
  ctx.lineTo(level.goal.x + gr, level.goal.y);
  ctx.lineTo(level.goal.x, level.goal.y + gr);
  ctx.lineTo(level.goal.x - gr, level.goal.y);
  ctx.closePath();
  ctx.fillStyle = C.goal;
  ctx.fill();

  // Crisp inner white-gold specular glint
  const gInner = gr * 0.42;
  ctx.beginPath();
  ctx.moveTo(level.goal.x, level.goal.y - gInner);
  ctx.lineTo(level.goal.x + gInner, level.goal.y);
  ctx.lineTo(level.goal.x, level.goal.y + gInner);
  ctx.lineTo(level.goal.x - gInner, level.goal.y);
  ctx.closePath();
  ctx.fillStyle = '#FFF7DF';
  ctx.fill();
  ctx.restore();

  // 7. Hydraulic Bulkhead Doors
  for (const door of level.doors) {
    const progress = doorOpenProgress.get(door.id) ?? (openDoors.has(door.id) ? 1 : 0);
    drawHydraulicDoor(ctx, door, progress, pressedPlates, timeSec, reducedMotion);
  }

  // 8. Tactile 2.5D Composite Lab Walls
  drawWalls(ctx, level.walls);

  // 9. Machined Moving Laser Rails
  for (const ml of level.movingLasers ?? []) {
    drawMachinedRail(ctx, ml.pointA.x, ml.pointA.y, ml.pointB.x, ml.pointB.y);
    if (ml.beamEndA && ml.beamEndB) {
      drawMachinedRail(ctx, ml.beamEndA.x, ml.beamEndA.y, ml.beamEndB.x, ml.beamEndB.y);
    } else if (ml.beamOffset) {
      drawMachinedRail(
        ctx,
        ml.pointA.x + ml.beamOffset.x,
        ml.pointA.y + ml.beamOffset.y,
        ml.pointB.x + ml.beamOffset.x,
        ml.pointB.y + ml.beamOffset.y
      );
    }
  }

  // 9b. Lasers & Moving Lasers (Directional Turrets + Animated Plasma + Deflection Sparks)
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

  for (let bIdx = 0; bIdx < baseLasers.length; bIdx++) {
    const base = baseLasers[bIdx];
    const segs = lasers.filter((l) => l.laserId === base.id);
    if (segs.length === 0) continue;
    const anyActive = segs.some((s) => s.active);
    const allDisabled = segs.every((s) => s.powered && !s.enabled);
    const turretState: 'active' | 'disabled' | 'inactive' = anyActive
      ? 'active'
      : allDisabled
        ? 'disabled'
        : 'inactive';

    const beamAngle = Math.atan2(base.y2 - base.y1, base.x2 - base.x1);

    ctx.save();
    for (const seg of segs) {
      if (!seg.powered) {
        // Precedence 1: unpowered standby dotted targeting line
        ctx.setLineDash([3, 7]);
        ctx.strokeStyle = withAlpha(C.laserInactive, 0.55);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.fullX2, seg.fullY2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (!seg.enabled) {
        // Precedence 2: neutralized by switch sequence -> safe emerald trace
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = withAlpha(C.laserDisabled, 0.72);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.fullX2, seg.fullY2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (!seg.active && seg.blockedByLap !== null) {
        // Precedence 3: occluded downstream
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = withAlpha(C.laserBlocked, 0.36);
        ctx.lineWidth = S.strokeThin;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.fullX2, seg.fullY2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (seg.active) {
        // Precedence 4: live animated plasma beam
        const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(timeSec * 24 + bIdx * 1.7);
        ctx.lineCap = 'round';

        // Outer wide red bloom
        ctx.strokeStyle = withAlpha(C.laserActive, 0.18 * pulse);
        ctx.lineWidth = 16 * pulse;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        // Mid energetic halo
        ctx.strokeStyle = withAlpha(C.laserActive, 0.45 * pulse);
        ctx.lineWidth = 8.5 * pulse;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        // Primary crimson beam
        ctx.strokeStyle = C.laserActive;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        // High-speed directional plasma ripples
        if (!reducedMotion) {
          ctx.setLineDash([12, 18]);
          ctx.lineDashOffset = -timeSec * 160;
          ctx.strokeStyle = withAlpha(C.laserCore, 0.72);
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // White-hot central spine
        ctx.strokeStyle = C.laserCore;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        // Ghost deflection shield & animated crackling sparks at impact point
        if (seg.blockedByLap !== null) {
          ctx.setLineDash([3, 6]);
          ctx.strokeStyle = withAlpha(C.laserBlocked, 0.34);
          ctx.lineWidth = S.strokeThin;
          ctx.beginPath();
          ctx.moveTo(seg.x2, seg.y2);
          ctx.lineTo(seg.fullX2, seg.fullY2);
          ctx.stroke();
          ctx.setLineDash([]);

          const blockerColor = getLapColor(seg.blockedByLap);
          const impactAngle = Math.atan2(seg.y1 - seg.y2, seg.x1 - seg.x2);

          // Radial deflection glow
          const impGlow = ctx.createRadialGradient(seg.x2, seg.y2, 1, seg.x2, seg.y2, 15);
          impGlow.addColorStop(0, C.laserCore);
          impGlow.addColorStop(0.4, withAlpha(C.laserBlocked, 0.65));
          impGlow.addColorStop(1, withAlpha(blockerColor, 0));
          ctx.fillStyle = impGlow;
          ctx.beginPath();
          ctx.arc(seg.x2, seg.y2, 15, 0, Math.PI * 2);
          ctx.fill();

          // Curved energy deflection arc facing incoming laser
          ctx.beginPath();
          ctx.arc(seg.x2, seg.y2, 9.5, impactAngle - 1.15, impactAngle + 1.15);
          ctx.strokeStyle = blockerColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Core bright impact flare
          ctx.beginPath();
          ctx.arc(seg.x2, seg.y2, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = C.present;
          ctx.fill();

          // Deterministic animated crackling spark rays bouncing back toward emitter
          if (!reducedMotion) {
            ctx.strokeStyle = C.laserBlocked;
            ctx.lineWidth = 1.4;
            for (let s = 0; s < 5; s++) {
              const phase = (timeSec * 6.5 + s * 1.37 + bIdx) % 1;
              const spread = impactAngle + Math.sin(s * 2.4 + Math.floor(timeSec * 12)) * 1.1;
              const r0 = 5 + phase * 6;
              const r1 = r0 + (1 - phase) * 8;
              ctx.globalAlpha = Math.max(0, 1 - phase);
              ctx.beginPath();
              ctx.moveTo(seg.x2 + Math.cos(spread) * r0, seg.y2 + Math.sin(spread) * r0);
              ctx.lineTo(seg.x2 + Math.cos(spread) * r1, seg.y2 + Math.sin(spread) * r1);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Draw directional emitter turret & receiver socket on top of beam endpoints
    drawLaserEmitter(ctx, base.x1, base.y1, beamAngle, turretState, base.isMoving);
    drawLaserReceiver(ctx, base.x2, base.y2, beamAngle + Math.PI, turretState);
    ctx.restore();
  }

  // 10. Future preview of ghosts (if enabled)
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

  // 11. Active Ghosts (Tactile beveled temporal drones with V1-V6 badge)
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

    // Soft ambient floor shadow
    ctx.fillStyle = 'rgba(3, 6, 11, 0.52)';
    ctx.beginPath();
    ctx.arc(g.x + 2, g.y + 3.5, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Soft lap-colored rim aura
    ctx.beginPath();
    ctx.arc(g.x, g.y, PLAYER_RADIUS + 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(lapColor, 0.34);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Main spherical/tactile drone body
    ctx.beginPath();
    ctx.arc(g.x, g.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = lapColor;
    ctx.fill();

    // Subtle specular highlight crescent (top-left light)
    const sheen = ctx.createRadialGradient(
      g.x - PLAYER_RADIUS * 0.35,
      g.y - PLAYER_RADIUS * 0.35,
      1,
      g.x,
      g.y,
      PLAYER_RADIUS
    );
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    sheen.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = sheen;
    ctx.fill();

    ctx.lineWidth = S.strokeBase;
    ctx.strokeStyle = C.bg;
    ctx.stroke();

    // Direction pip
    const nx = g.x + Math.cos(g.angle) * (PLAYER_RADIUS - 3.5);
    const ny = g.y + Math.sin(g.angle) * (PLAYER_RADIUS - 3.5);
    ctx.beginPath();
    ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = C.inkOnAccent;
    ctx.fill();

    // High-contrast V1-V6 code badge
    ctx.fillStyle = C.inkOnAccent;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getLapCode(g.lapIndex), g.x, g.y + 0.5);
    ctx.restore();
  }

  // 12. Present Player (Porcelain white-ice test subject core with amber gyro ring)
  ctx.save();
  if (state.dead) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = C.laserActive;
    ctx.lineWidth = S.strokeThick;
    ctx.stroke();
  } else {
    // Subtle crisp aura separating present player from environment
    const pAura = ctx.createRadialGradient(
      state.player.x,
      state.player.y,
      state.player.r * 0.5,
      state.player.x,
      state.player.y,
      state.player.r + 9
    );
    pAura.addColorStop(0, withAlpha(C.present, 0.28));
    pAura.addColorStop(1, withAlpha(C.present, 0));
    ctx.fillStyle = pAura;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r + 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drop shadow
  ctx.fillStyle = 'rgba(3, 6, 11, 0.55)';
  ctx.beginPath();
  ctx.arc(state.player.x + 2, state.player.y + 3.5, state.player.r, 0, Math.PI * 2);
  ctx.fill();

  // Tactile armored core
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fillStyle = state.dead ? C.laserCore : C.present;
  ctx.fill();

  const pSheen = ctx.createRadialGradient(
    state.player.x - state.player.r * 0.32,
    state.player.y - state.player.r * 0.32,
    1,
    state.player.x,
    state.player.y,
    state.player.r
  );
  pSheen.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
  pSheen.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
  pSheen.addColorStop(1, 'rgba(15, 28, 45, 0.28)');
  ctx.fillStyle = pSheen;
  ctx.fill();

  ctx.lineWidth = S.strokeBase;
  ctx.strokeStyle = C.bg;
  ctx.stroke();

  if (!state.dead) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Facing indicator visor dot
  const px = state.player.x + Math.cos(state.player.angle) * (state.player.r - 4);
  const py = state.player.y + Math.sin(state.player.angle) * (state.player.r - 4);
  ctx.beginPath();
  ctx.arc(px, py, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = C.inkOnAccent;
  ctx.fill();
  ctx.restore();

  // 13. Rewind or Pause non-occluding visual indicator
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
