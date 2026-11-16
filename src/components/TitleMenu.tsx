import React from 'react';
import { Play } from 'lucide-react';
import { getLapColor } from '../game/colors.ts';
import { LEVELS } from '../game/levels.ts';

interface TitleMenuProps {
  completedLevels: number[];
  onStart: (levelIndex?: number) => void;
  onOpenRules: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  completedLevels,
  onStart,
  onOpenRules,
}) => {
  return (
    <main className="flex-1 w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-10 flex items-center justify-center">
      <div className="w-full rounded-2xl bg-[#1c2026] border border-[#2a303a] p-8 sm:p-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-5">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className="h-1.5 w-8 rounded-xs"
                    style={{ backgroundColor: getLapColor(idx) }}
                  />
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white [text-wrap:balance]">
                Hold For Me
              </h1>

              <p className="mt-4 text-lg font-medium text-[#4cc9f0]">
                El presente es blando. El pasado es duro.
              </p>

              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Cada nivel es un cuarto y un loop de 20 segundos. Al terminar una vuelta, tu recorrido anterior se vuelve un fantasma sólido y tu rastro pasado pasa a ser pared. Usá tu propia historia para abrir puertas, bloquear láseres y llegar a la meta antes de quedarte sin tiempo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onStart(0)}
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-lg bg-[#4cc9f0] text-[#14161a] text-base font-bold hover:bg-[#72d6f5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Start
              </button>

              <button
                type="button"
                onClick={onOpenRules}
                className="px-5 py-3 rounded-lg bg-[#14161a] border border-[#2a303a] text-sm font-medium text-slate-200 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver reglas y controles
              </button>
            </div>
          </div>

          {/* Right Level Quick-Select Column */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#14161a] rounded-xl border border-[#2a303a] p-5">
            <div>
              <div className="text-xs font-medium text-slate-400 mb-3">
                4 niveles · Elegí por dónde empezar
              </div>
              <div className="space-y-2.5">
                {LEVELS.map((lvl, idx) => {
                  const done = completedLevels.includes(lvl.id);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onStart(idx)}
                      className="w-full text-left p-3 rounded-lg bg-[#1c2026] border border-[#2a303a] hover:border-[#4cc9f0] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {lvl.id}. {lvl.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                          {lvl.maxLaps} {lvl.maxLaps === 1 ? 'vuelta' : 'vueltas'} · 20 s
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          done ? 'text-[#80ed99]' : 'text-slate-400'
                        }`}
                      >
                        {done ? 'Resuelto' : 'Jugar'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#2a303a] text-xs text-slate-400 flex items-center justify-between">
              <span>WASD / Flechas · Enter · R</span>
              <span className="font-mono tabular-nums">
                {completedLevels.length} / {LEVELS.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
