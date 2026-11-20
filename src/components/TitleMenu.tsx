import React from 'react';
import { BookOpen, Check, Play } from 'lucide-react';
import { getLapCode, getLapColor, LAP_META } from '../game/colors.ts';
import { LEVELS } from '../game/levels.ts';

interface TitleMenuProps {
  completedLevels: number[];
  onStart: (levelIndex?: number) => void;
  onOpenControls: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  completedLevels,
  onStart,
  onOpenControls,
}) => {
  const displayedLaps = LAP_META.slice(0, Math.max(1, ...LEVELS.map((l) => l.maxLaps)));

  return (
    <main className="flex-1 w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Top Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div
              className="flex flex-wrap items-center gap-3 mb-3"
              aria-label={`Paleta de ${displayedLaps.length} vueltas`}
            >
              {displayedLaps.map((lap) => (
                <span
                  key={lap.index}
                  title={`${lap.code} · ${lap.label}`}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className="h-2 w-6 rounded-xs block"
                    style={{ backgroundColor: lap.color }}
                  />
                </span>
              ))}
            </div>

            <h1 className="type-title text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text)] [text-wrap:balance]">
              Hold For Me
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onStart(0)}
              className="btn-primary px-6 py-2.5 text-base"
            >
              <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
              Comenzar
            </button>

            <button
              type="button"
              onClick={onOpenControls}
              className="btn-secondary btn-controls px-4 py-2.5 text-sm"
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              Ver controles
            </button>
          </div>
        </div>

        {/* Horizontal Level Quick-Select Grid on Desktop */}
        <div className="bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {LEVELS.map((lvl, idx) => {
              const done = completedLevels.includes(lvl.id);
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onStart(idx)}
                  className="w-full min-h-[76px] text-left p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-alt)] transition-colors flex flex-col justify-between gap-2 cursor-pointer"
                >
                  <div className="text-sm font-semibold text-[var(--color-text)] truncate">
                    {lvl.id}. {lvl.name}
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-[var(--color-text-muted)] type-numeric">
                        {lvl.maxLaps} {lvl.maxLaps === 1 ? 'vuelta' : 'vueltas'}
                      </span>
                      <span className="inline-flex items-center gap-1 flex-wrap" aria-hidden="true">
                        {Array.from({ length: lvl.maxLaps }).map((_, lIdx) => (
                          <span
                            key={lIdx}
                            title={getLapCode(lIdx)}
                            className="h-1.5 w-2.5 rounded-xs"
                            style={{ backgroundColor: getLapColor(lIdx) }}
                          />
                        ))}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 whitespace-nowrap self-end ${
                        done ? 'text-[var(--color-door-open)]' : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      {done ? 'Resuelto' : 'Jugar'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
};
