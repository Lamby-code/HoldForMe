import React, { useRef } from 'react';
import { getLapColor } from '../game/colors.ts';
import { FRAMES_PER_LAP, LOOP_SECONDS, TICK_HZ, type SimState } from '../game/sim.ts';

interface TimelineBarProps {
  state: SimState;
  maxLaps: number;
  disabled?: boolean;
  onSeek: (targetLap: number, targetT: number) => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  state,
  maxLaps,
  disabled = false,
  onSeek,
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  const totalFrames = maxLaps * FRAMES_PER_LAP;
  const currentTotalFrames = state.lap * FRAMES_PER_LAP + state.t;

  const handlePointerSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const desiredGlobalFrame = Math.floor(ratio * totalFrames);

    // Only allow seeking within recorded history up to currentTotalFrames
    const clampedGlobalFrame = Math.min(currentTotalFrames, desiredGlobalFrame);
    const targetLap = Math.min(state.lap, Math.floor(clampedGlobalFrame / FRAMES_PER_LAP));
    const targetT = clampedGlobalFrame - targetLap * FRAMES_PER_LAP;
    onSeek(targetLap, targetT);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerSeek(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.buttons !== 1) return;
    handlePointerSeek(e);
  };

  const playheadPercent = (currentTotalFrames / totalFrames) * 100;
  const totalSeconds = (currentTotalFrames / TICK_HZ).toFixed(1);
  const maxSeconds = (maxLaps * LOOP_SECONDS).toFixed(0);

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-200">Línea de tiempo</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Click o arrastrá para rebobinar</span>
        </div>
        <div className="font-mono tabular-nums text-slate-300">
          {totalSeconds} s / {maxSeconds} s
        </div>
      </div>

      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        role="slider"
        aria-label="Línea de tiempo de vueltas"
        aria-valuemin={0}
        aria-valuemax={totalFrames}
        aria-valuenow={currentTotalFrames}
        tabIndex={0}
        className="relative h-9 w-full rounded-lg bg-[#1c2026] border border-[#2a303a] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4cc9f0]"
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: maxLaps }).map((_, idx) => {
            const color = getLapColor(idx);
            const isPast = idx < state.lap;
            const isCurrent = idx === state.lap;
            const fillRatio = isPast
              ? 1
              : isCurrent
                ? Math.min(1, state.t / FRAMES_PER_LAP)
                : 0;

            return (
              <div
                key={idx}
                className="relative flex-1 h-full border-r border-[#2a303a] last:border-r-0 overflow-hidden"
              >
                <div
                  className="h-full transition-none"
                  style={{
                    width: `${fillRatio * 100}%`,
                    backgroundColor: color,
                    opacity: isPast ? 0.34 : 0.24,
                  }}
                />
                <span
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium font-mono tabular-nums pointer-events-none"
                  style={{ color: isPast || isCurrent ? color : '#64748b' }}
                >
                  V{idx + 1} · {LOOP_SECONDS}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Playhead needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-2.5 h-2.5 -ml-[4px] bg-white rounded-xs rotate-45 -mt-1" />
        </div>
      </div>
    </div>
  );
};
