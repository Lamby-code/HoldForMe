import React from 'react';
import { getLapCode } from '../game/colors.ts';
import type { DerivedWorld } from '../game/sim.ts';

interface FutureMechanicsLegendProps {
  world: DerivedWorld;
}

/**
 * Live HUD & legend strip for moving lasers, laserSegments, and ordered switches (D6 / RF-18).
 * Returns null on levels without these mechanics (RF-19).
 */
export const FutureMechanicsLegend: React.FC<FutureMechanicsLegendProps> = ({ world }) => {
  const { level, lasers, sequence } = world;
  const movingLasers = level.movingLasers ?? [];
  const laserSegments = level.laserSegments ?? [];
  const hasSwitches = sequence.present && sequence.switches.length > 0;

  if (movingLasers.length === 0 && laserSegments.length === 0 && !hasSwitches) {
    return null;
  }

  const displayedSegments = lasers.filter((seg) => seg.segmentId !== null || seg.isMoving);

  return (
    <section
      aria-label="Estado de secuencia y láseres móviles"
      className="rounded-lg bg-[#1c2026] border border-[#2a303a] px-3 py-1.5 text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1.5"
    >
      {hasSwitches && (
        <div className="inline-flex flex-wrap items-center gap-2 font-mono tabular-nums text-[11px]">
          <span
            className={`px-1.5 py-0.5 rounded border font-semibold ${
              sequence.completed
                ? 'bg-[#80ed99]/15 border-[#80ed99]/50 text-[#80ed99]'
                : 'bg-[#ffd166]/15 border-[#ffd166]/50 text-[#ffd166]'
            }`}
          >
            Secuencia: {sequence.currentStep}/{sequence.totalSteps} ·{' '}
            {sequence.completed ? 'Completa' : `Siguiente: #${sequence.expectedOrder}`}
          </span>

          {sequence.hasRecentError && (
            <span
              role="status"
              aria-live="polite"
              className="px-1.5 py-0.5 rounded border bg-[#ff3b3b]/15 border-[#ff3b3b]/60 text-[#fca5a5] font-semibold"
            >
              Error de orden · Secuencia reiniciada (esperado #1)
            </span>
          )}

          {sequence.switches.map((sw) => (
            <span
              key={sw.id}
              className={`px-1.5 py-0.5 rounded border ${
                sw.activated
                  ? 'bg-[#80ed99]/15 border-[#80ed99]/50 text-[#80ed99]'
                  : sw.isExpected
                    ? 'bg-[#ffd166]/15 border-[#ffd166]/60 text-white'
                    : 'bg-[#14161a] border-[#2a303a] text-slate-400'
              }`}
            >
              #{sw.order} {sw.label}:{' '}
              {sw.activated ? 'Activado' : sw.isExpected ? 'Siguiente' : 'Pendiente'}
            </span>
          ))}
        </div>
      )}

      {movingLasers.map((ml) => (
        <div
          key={ml.id}
          className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[11px] bg-[#14161a] border border-[#2a303a] rounded px-2 py-0.5"
        >
          <span className="text-[#fca5a5] font-semibold">Láser móvil {ml.id}</span>
          <span className="text-slate-400">
            P:{ml.periodFrames}f · Desf:{ml.phaseOffsetFrames}f
          </span>
        </div>
      ))}

      {displayedSegments.length > 0 && (
        <div className="inline-flex flex-wrap items-center gap-1.5 font-mono tabular-nums text-[11px]">
          {displayedSegments.map((seg) => {
            const label = seg.segmentId ?? seg.id;
            const statusText = !seg.powered
              ? 'Sin energía'
              : !seg.enabled
                ? 'Deshabilitado'
                : !seg.active && seg.blockedByLap !== null
                  ? `Ocluido (${getLapCode(seg.blockedByLap)})`
                  : seg.blockedByLap !== null
                    ? `Bloqueado (${getLapCode(seg.blockedByLap)})`
                    : 'Activo';

            const statusClass = !seg.powered
              ? 'bg-[#14161a] border-[#2a303a] text-slate-400'
              : !seg.enabled
                ? 'bg-[#80ed99]/15 border-[#80ed99]/50 text-[#80ed99]'
                : seg.blockedByLap !== null
                  ? 'bg-[#ffd166]/15 border-[#ffd166]/60 text-[#ffd166]'
                  : 'bg-[#ff3b3b]/15 border-[#ff3b3b]/60 text-[#fca5a5]';

            return (
              <span key={seg.id} className={`px-1.5 py-0.5 rounded border ${statusClass}`}>
                {label}: {statusText}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
};
