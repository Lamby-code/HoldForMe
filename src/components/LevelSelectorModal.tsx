import React from 'react';
import { Check, X } from 'lucide-react';
import { getLapCode, getLapColor, LAP_META, MAX_LAPS } from '../game/colors.ts';
import { LEVELS, MAX_SUPPORTED_LEVELS } from '../game/levels.ts';

interface LevelSelectorModalProps {
  isOpen: boolean;
  mode: 'levels' | 'rules';
  currentLevelIndex: number;
  completedLevels: number[];
  onSelectLevel: (index: number) => void;
  onClose: () => void;
}

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  isOpen,
  mode,
  currentLevelIndex,
  completedLevels,
  onSelectLevel,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-xl bg-[#1c2026] border border-[#2a303a] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#2a303a] shrink-0">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-white">
              {mode === 'levels' ? 'Selector de niveles' : 'La regla única'}
            </h2>
            {mode === 'levels' && (
              <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                {LEVELS.length} disponibles (capacidad base hasta {MAX_SUPPORTED_LEVELS} niveles · {MAX_LAPS} vueltas)
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'levels' ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
            {LEVELS.map((lvl, idx) => {
              const isCompleted = completedLevels.includes(lvl.id);
              const isCurrent = idx === currentLevelIndex;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    onSelectLevel(idx);
                    onClose();
                  }}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0] ${
                    isCurrent
                      ? 'bg-[#232830] border-[#4cc9f0]'
                      : 'bg-[#14161a] border-[#2a303a] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-400 font-mono tabular-nums">
                      Nivel {lvl.id} · {lvl.maxLaps} {lvl.maxLaps === 1 ? 'vuelta' : 'vueltas'}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#80ed99]">
                        <Check className="w-3.5 h-3.5" />
                        Resuelto
                      </span>
                    )}
                  </div>
                  <div className="text-base font-semibold text-white">{lvl.name}</div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{lvl.subtitle}</p>
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: lvl.maxLaps }).map((_, lIdx) => (
                      <span
                        key={lIdx}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300"
                      >
                        <span
                          className="h-1.5 w-4 rounded-xs block"
                          style={{ backgroundColor: getLapColor(lIdx) }}
                        />
                        {getLapCode(lIdx)}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-sm text-slate-300 overflow-y-auto pr-1">
            <p className="text-base font-medium text-white">
              El presente es blando. El pasado es duro.
            </p>
            <div className="overflow-hidden rounded-lg border border-[#2a303a]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#14161a] border-b border-[#2a303a] text-slate-400">
                    <th className="py-2 px-3 font-medium">Elemento</th>
                    <th className="py-2 px-3 font-medium">Presente (Blanco)</th>
                    <th className="py-2 px-3 font-medium">Pasado (Fantasmas)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a303a]">
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Tu rastro</td>
                    <td className="py-2 px-3 text-slate-300">No colisiona</td>
                    <td className="py-2 px-3 text-[#4cc9f0]">Pared sólida</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Tu cuerpo</td>
                    <td className="py-2 px-3 text-slate-300">Controlable</td>
                    <td className="py-2 px-3 text-[#f72585]">Empuja y aplasta</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Placas y puertas</td>
                    <td className="py-2 px-3 text-slate-300">Interactúa</td>
                    <td className="py-2 px-3 text-[#ffd166]">También interactúa</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Láser</td>
                    <td className="py-2 px-3 text-[#ff3b3b]">Te mata</td>
                    <td className="py-2 px-3 text-[#80ed99]">El fantasma lo bloquea</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6-lap explicit non-cyclic color legend */}
            <div className="p-3 rounded-lg bg-[#14161a] border border-[#2a303a]">
              <div className="text-xs font-medium text-slate-300 mb-2">
                Leyenda de vueltas (identificación explícita hasta {MAX_LAPS} vueltas)
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {LAP_META.map((lap) => (
                  <div
                    key={lap.index}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1c2026] border border-[#2a303a] text-xs font-mono"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: lap.color }}
                    />
                    <span className="text-white font-semibold">{lap.code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#14161a] border border-[#2a303a]">
                <div className="font-mono text-white font-medium">WASD / Flechas</div>
                <div className="text-slate-400 mt-0.5">Caminar</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14161a] border border-[#2a303a]">
                <div className="font-mono text-white font-medium">Enter</div>
                <div className="text-slate-400 mt-0.5">Terminar vuelta</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14161a] border border-[#2a303a]">
                <div className="font-mono text-white font-medium">Espacio</div>
                <div className="text-slate-400 mt-0.5">Pausar</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14161a] border border-[#2a303a]">
                <div className="font-mono text-white font-medium">Mantener R</div>
                <div className="text-slate-400 mt-0.5">Rebobinar gratis</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14161a] border border-[#2a303a]">
                <div className="font-mono text-white font-medium">Supr / Esc</div>
                <div className="text-slate-400 mt-0.5">Reiniciar / Niveles</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
