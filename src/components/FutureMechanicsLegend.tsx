import React from 'react';
import { getLapCode, TOKENS, withAlpha } from '../game/colors.ts';
import type { DerivedWorld } from '../game/sim.ts';

interface FutureMechanicsLegendProps {
  world: DerivedWorld;
}

const { color: C } = TOKENS;

/**
 * Live HUD & legend strip for moving lasers, laserSegments, and ordered switches (RF-13).
 * Purely derived from simulation state with zero timers or hidden persistence.
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
      className="rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] flex flex-wrap items-center gap-x-3 gap-y-1.5"
    >
      {hasSwitches && (
        <div className="inline-flex flex-wrap items-center gap-2 type-numeric text-xs">
          <span
            className="px-2 py-0.5 rounded-xs border font-semibold"
            style={{
              backgroundColor: withAlpha(sequence.completed ? C.switchOn : C.switchExpected, 0.14),
              borderColor: sequence.completed ? C.switchOn : C.switchExpected,
              color: sequence.completed ? C.switchOn : C.switchExpected,
            }}
          >
            Secuencia: {sequence.currentStep}/{sequence.totalSteps} ·{' '}
            {sequence.completed ? '✓ Completa' : `→ Esperado #${sequence.expectedOrder}`}
          </span>

          {sequence.hasRecentError && (
            <span
              role="status"
              aria-live="polite"
              className="px-2 py-0.5 rounded-xs border font-semibold"
              style={{
                backgroundColor: withAlpha(C.switchError, 0.16),
                borderColor: C.switchError,
                color: C.switchError,
              }}
            >
              ! Error de orden · Secuencia reiniciada (esperado #1)
            </span>
          )}

          {sequence.switches.map((sw) => {
            const color = sw.activated
              ? C.switchOn
              : sw.isExpected
                ? C.switchExpected
                : C.switchPending;
            const symbol = sw.activated ? '✓' : sw.isExpected ? '→' : '○';
            const stateLabel = sw.activated
              ? 'Activado'
              : sw.isExpected
                ? 'Siguiente'
                : 'Pendiente';

            return (
              <span
                key={sw.id}
                className="px-1.5 py-0.5 rounded-xs border"
                style={{
                  backgroundColor: sw.activated || sw.isExpected ? withAlpha(color, 0.14) : C.surfaceMuted,
                  borderColor: sw.activated || sw.isExpected ? color : C.borderSubtle,
                  color,
                }}
              >
                {symbol} #{sw.order}: {stateLabel}
              </span>
            );
          })}
        </div>
      )}

      {movingLasers.map((ml) => (
        <div
          key={ml.id}
          className="inline-flex items-center gap-1.5 type-numeric text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] rounded-xs px-2 py-0.5"
        >
          <span className="font-semibold text-[var(--color-laser-active)]">
            ↔ Láser móvil {ml.id}
          </span>
          <span className="text-[var(--color-text-muted)]">
            P:{ml.periodFrames}f · Desf:{ml.phaseOffsetFrames}f
          </span>
        </div>
      ))}

      {displayedSegments.length > 0 && (
        <div className="inline-flex flex-wrap items-center gap-2 type-numeric text-xs">
          {displayedSegments.map((seg) => {
            const label = seg.segmentId ?? seg.id;
            const statusText = !seg.powered
              ? '○ Sin energía'
              : !seg.enabled
                ? '✓ Deshabilitado'
                : !seg.active && seg.blockedByLap !== null
                  ? `■ Ocluido (${getLapCode(seg.blockedByLap)})`
                  : seg.blockedByLap !== null
                    ? `■ Bloqueado (${getLapCode(seg.blockedByLap)})`
                    : '▲ Activo';

            const color = !seg.powered
              ? C.laserInactive
              : !seg.enabled
                ? C.laserDisabled
                : seg.blockedByLap !== null
                  ? C.laserBlocked
                  : C.laserActive;

            return (
              <span
                key={seg.id}
                className="px-1.5 py-0.5 rounded-xs border font-medium"
                style={{
                  backgroundColor: seg.powered ? withAlpha(color, 0.14) : C.surfaceMuted,
                  borderColor: seg.powered ? color : C.borderSubtle,
                  color,
                }}
              >
                {label}: {statusText}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
};
