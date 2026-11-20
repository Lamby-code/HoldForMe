import React from 'react';
import { TOKENS } from '../game/colors.ts';
import { CANVAS_H, CANVAS_W, type LevelDef } from '../game/levels.ts';
import { getMovingLaserEndpoints } from '../game/sim.ts';

interface LevelBlueprintProps {
  level: LevelDef;
  completed?: boolean;
}

const { color: C } = TOKENS;

export const LevelBlueprint: React.FC<LevelBlueprintProps> = ({ level, completed = false }) => {
  const switches = level.orderedSwitchSequence?.switches ?? [];

  return (
    <div className="relative w-full aspect-[12/5] rounded-[4px] overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border-subtle)] group-hover:border-[var(--color-border)] transition-colors">
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full h-full block"
        aria-hidden="true"
        focusable="false"
      >
        {/* Subtle chamber grid lines */}
        <g stroke={C.bgGrid} strokeWidth="2">
          <line x1="240" y1="24" x2="240" y2={CANVAS_H - 24} />
          <line x1="480" y1="24" x2="480" y2={CANVAS_H - 24} />
          <line x1="720" y1="24" x2="720" y2={CANVAS_H - 24} />
          <line x1="24" y1="200" x2={CANVAS_W - 24} y2="200" />
        </g>

        {/* Floor wiring conduits (plate -> door) */}
        <g stroke={C.plateOff} strokeOpacity="0.28" strokeWidth="4" fill="none" strokeDasharray="10 10">
          {level.doors.flatMap((door) => {
            const dcx = door.x + door.w * 0.5;
            const dcy = door.y + door.h * 0.5;
            return door.requiredPlates.map((pId) => {
              const plate = level.plates.find((p) => p.id === pId);
              if (!plate) return null;
              const midX = (plate.x + dcx) * 0.5;
              return (
                <polyline
                  key={`${door.id}-${pId}`}
                  points={`${plate.x},${plate.y} ${midX},${plate.y} ${midX},${dcy} ${dcx},${dcy}`}
                />
              );
            });
          })}
        </g>

        {/* Moving laser mechanical rails */}
        {(level.movingLasers ?? []).map((ml) => {
          const endA = ml.beamEndA ?? (ml.beamOffset ? { x: ml.pointA.x + ml.beamOffset.x, y: ml.pointA.y + ml.beamOffset.y } : null);
          const endB = ml.beamEndB ?? (ml.beamOffset ? { x: ml.pointB.x + ml.beamOffset.x, y: ml.pointB.y + ml.beamOffset.y } : null);
          return (
            <g key={`rail-${ml.id}`} stroke={C.borderSubtle} strokeWidth="8" strokeLinecap="round">
              <line x1={ml.pointA.x} y1={ml.pointA.y} x2={ml.pointB.x} y2={ml.pointB.y} />
              {endA && endB && <line x1={endA.x} y1={endA.y} x2={endB.x} y2={endB.y} />}
            </g>
          );
        })}

        {/* Pressure plates */}
        {level.plates.map((plate) => (
          <g key={plate.id}>
            <circle
              cx={plate.x}
              cy={plate.y}
              r={Math.max(plate.r, 18)}
              fill={C.surfaceAlt}
              stroke={C.plateOff}
              strokeWidth="4"
            />
            <circle cx={plate.x} cy={plate.y} r="6" fill={C.plateOff} />
          </g>
        ))}

        {/* Ordered sequence diamond switches */}
        {switches.map((sw) => {
          const r = Math.max(sw.r, 18);
          return (
            <polygon
              key={sw.id}
              points={`${sw.x},${sw.y - r} ${sw.x + r},${sw.y} ${sw.x},${sw.y + r} ${sw.x - r},${sw.y}`}
              fill={C.surfaceAlt}
              stroke={C.switchExpected}
              strokeWidth="4"
            />
          );
        })}

        {/* Hydraulic doors */}
        {level.doors.map((door) => (
          <g key={door.id}>
            <rect
              x={door.x}
              y={door.y}
              width={door.w}
              height={door.h}
              fill={C.doorClosed}
              stroke={completed ? C.doorOpen : C.plateOff}
              strokeWidth="4"
            />
          </g>
        ))}

        {/* 2.5D Lab walls */}
        <g>
          {level.walls.map((w, idx) => (
            <rect
              key={idx}
              x={w.x}
              y={w.y}
              width={w.w}
              height={w.h}
              fill={C.wall}
              stroke={C.wallEdge}
              strokeOpacity="0.65"
              strokeWidth="2.5"
            />
          ))}
        </g>

        {/* Static lasers */}
        {level.lasers.map((laser) => {
          const unpowered = Boolean(laser.poweredByPlates && laser.poweredByPlates.length > 0);
          return (
            <g key={laser.id}>
              {!unpowered && (
                <line
                  x1={laser.x1}
                  y1={laser.y1}
                  x2={laser.x2}
                  y2={laser.y2}
                  stroke={C.laserActive}
                  strokeOpacity="0.32"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              )}
              <line
                x1={laser.x1}
                y1={laser.y1}
                x2={laser.x2}
                y2={laser.y2}
                stroke={unpowered ? C.laserInactive : C.laserActive}
                strokeWidth={unpowered ? '4' : '6'}
                strokeDasharray={unpowered ? '10 12' : undefined}
                strokeLinecap="round"
              />
              <circle
                cx={laser.x1}
                cy={laser.y1}
                r="10"
                fill={C.surfaceAlt}
                stroke={unpowered ? C.laserInactive : C.laserActive}
                strokeWidth="4"
              />
            </g>
          );
        })}

        {/* Moving lasers at t = 0 */}
        {(level.movingLasers ?? []).map((ml) => {
          const geom = getMovingLaserEndpoints(ml, 0);
          const unpowered = Boolean(ml.poweredByPlates && ml.poweredByPlates.length > 0);
          return (
            <g key={ml.id}>
              {!unpowered && (
                <line
                  x1={geom.x1}
                  y1={geom.y1}
                  x2={geom.x2}
                  y2={geom.y2}
                  stroke={C.laserActive}
                  strokeOpacity="0.32"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              )}
              <line
                x1={geom.x1}
                y1={geom.y1}
                x2={geom.x2}
                y2={geom.y2}
                stroke={unpowered ? C.laserInactive : C.laserActive}
                strokeWidth={unpowered ? '4' : '6'}
                strokeDasharray={unpowered ? '10 12' : undefined}
                strokeLinecap="round"
              />
              <circle
                cx={geom.x1}
                cy={geom.y1}
                r="11"
                fill={C.surfaceAlt}
                stroke={unpowered ? C.laserInactive : C.laserActive}
                strokeWidth="4"
              />
            </g>
          );
        })}

        {/* Spawn pad */}
        <circle
          cx={level.spawn.x}
          cy={level.spawn.y}
          r="15"
          fill={C.present}
          stroke={C.bg}
          strokeWidth="4"
        />

        {/* Golden extraction goal */}
        <g>
          <circle
            cx={level.goal.x}
            cy={level.goal.y}
            r={Math.max(level.goal.r, 22)}
            fill={C.goal}
            fillOpacity="0.2"
            stroke={C.goal}
            strokeWidth="4"
          />
          <polygon
            points={`${level.goal.x},${level.goal.y - 12} ${level.goal.x + 12},${level.goal.y} ${level.goal.x},${level.goal.y + 12} ${level.goal.x - 12},${level.goal.y}`}
            fill={C.goal}
          />
        </g>
      </svg>

      {/* Subtle top specular glass sheen matching chamber lighting */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(148, 190, 235, 0.06) 0%, rgba(11, 16, 23, 0) 45%, rgba(3, 6, 11, 0.22) 100%)',
        }}
      />
    </div>
  );
};
