import React from 'react';
import { Check, X } from 'lucide-react';
import { LEVELS } from '../game/levels.ts';
import { getLapColor } from '../game/colors.ts';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-[#1c2026] border border-[#2a303a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#2a303a]">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'levels' ? 'Selector de niveles' : 'La regla única'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'levels' ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#232830] border-[#4cc9f0]'
                      : 'bg-[#14161a] border-[#2a303a] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-slate-400 font-mono tabular-nums">
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
                  <div className="mt-3 flex items-center gap-1.5">
                    {Array.from({ length: lvl.maxLaps }).map((_, lIdx) => (
                      <span
                        key={lIdx}
                        className="h-1.5 w-6 rounded-xs"
                        style={{ backgroundColor: getLapColor(lIdx) }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 space-y-5 text-sm text-slate-300">
            <p className="text-base font-medium text-white">
              El presente es blando. El pasado es duro.
            </p>
            <div className="overflow-hidden rounded-lg border border-[#2a303a]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#14161a] border-b border-[#2a303a] text-slate-400">
                    <th className="py-2.5 px-3 font-medium">Elemento</th>
                    <th className="py-2.5 px-3 font-medium">Presente (Blanco)</th>
                    <th className="py-2.5 px-3 font-medium">Pasado (Fantasmas)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a303a]">
                  <tr>
                    <td className="py-2.5 px-3 text-white font-medium">Tu rastro</td>
                    <td className="py-2.5 px-3 text-slate-300">No colisiona</td>
                    <td className="py-2.5 px-3 text-[#4cc9f0]">Pared sólida</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-white font-medium">Tu cuerpo</td>
                    <td className="py-2.5 px-3 text-slate-300">Controlable</td>
                    <td className="py-2.5 px-3 text-[#f72585]">Empuja y aplasta</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-white font-medium">Placas y puertas</td>
                    <td className="py-2.5 px-3 text-slate-300">Interactúa</td>
                    <td className="py-2.5 px-3 text-[#ffd166]">También interactúa</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-white font-medium">Láser</td>
                    <td className="py-2.5 px-3 text-[#ff3b3b]">Te mata</td>
                    <td className="py-2.5 px-3 text-[#80ed99]">El fantasma lo bloquea</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
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
