import React from 'react';
import { BookOpen, Check, Play } from 'lucide-react';
import { getLapCode, getLapColor, LAP_META } from '../game/colors.ts';
import { LEVELS } from '../game/levels.ts';
import { LevelBlueprint } from './LevelBlueprint.tsx';

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

  // Resume at first uncompleted level (or level 1 if all completed)
  const firstUncompletedIndex = LEVELS.findIndex((lvl) => !completedLevels.includes(lvl.id));
  const startIndex = firstUncompletedIndex === -1 ? 0 : firstUncompletedIndex;

  return (
    <main className="lab-chamber-backdrop flex-1 w-full px-4 sm:px-6 py-5 flex items-center justify-center">
      <div className="lab-console-surface relative w-full max-w-[1120px] rounded-[var(--radius-lg)] p-5 sm:p-7 flex flex-col gap-6">
        {/* Corner chamber fasteners matching 2.5D wall rivets */}
        <span className="lab-rivet m-0 top-2.5 left-2.5" aria-hidden="true" />
        <span className="lab-rivet m-0 top-2.5 right-2.5" aria-hidden="true" />
        <span className="lab-rivet m-0 bottom-2.5 left-2.5" aria-hidden="true" />
        <span className="lab-rivet m-0 bottom-2.5 right-2.5" aria-hidden="true" />

        {/* Top Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div
              className="flex flex-wrap items-center gap-2.5 mb-3"
              aria-label={`Paleta de ${displayedLaps.length} vueltas`}
            >
              {displayedLaps.map((lap) => (
                <span
                  key={lap.index}
                  title={`${lap.code} · ${lap.label}`}
                  className="inline-flex items-center"
                >
                  <span
                    className="h-2 w-7 rounded-xs block"
                    style={{
                      backgroundColor: lap.color,
                      boxShadow: `0 0 10px ${lap.color}40`,
                    }}
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
              onClick={() => onStart(startIndex)}
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

        {/* Machined floor-conduit hairline separator */}
        <div className="relative h-px bg-[var(--color-border-subtle)]" aria-hidden="true">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-24"
            style={{ backgroundColor: 'var(--color-accent)', opacity: 0.7 }}
          />
        </div>

        {/* Horizontal 5x2 Level Chambers Grid with Live Architectural Blueprints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {LEVELS.map((lvl, idx) => {
            const done = completedLevels.includes(lvl.id);
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => onStart(idx)}
                className="lab-level-card group w-full text-left p-2.5 rounded-[var(--radius-sm)] flex flex-col justify-between gap-2.5 cursor-pointer"
                data-completed={done ? 'true' : undefined}
              >
                <LevelBlueprint level={lvl} completed={done} />

                <div className="space-y-1.5 px-0.5">
                  <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                    {lvl.id}. {lvl.name}
                  </div>

                  <div className="flex items-end justify-between gap-1.5">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-[var(--color-text-muted)] type-numeric leading-none">
                        {lvl.maxLaps} {lvl.maxLaps === 1 ? 'vuelta' : 'vueltas'}
                      </span>
                      <span className="inline-flex items-center gap-1 flex-wrap" aria-hidden="true">
                        {Array.from({ length: lvl.maxLaps }).map((_, lIdx) => (
                          <span
                            key={lIdx}
                            title={getLapCode(lIdx)}
                            className="h-1.5 w-3 rounded-[2px]"
                            style={{ backgroundColor: getLapColor(lIdx) }}
                          />
                        ))}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 whitespace-nowrap leading-none ${
                        done
                          ? 'text-[var(--color-door-open)]'
                          : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      {done ? 'Resuelto' : 'Jugar'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
};
