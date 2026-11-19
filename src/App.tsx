import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FutureMechanicsLegend } from './components/FutureMechanicsLegend.tsx';
import { LevelSelectorModal } from './components/LevelSelectorModal.tsx';
import { TimelineBar } from './components/TimelineBar.tsx';
import { TitleMenu } from './components/TitleMenu.tsx';
import { sfx } from './game/audio.ts';
import { getLapCode, getLapColor } from './game/colors.ts';
import { CANVAS_H, CANVAS_W, LEVELS } from './game/levels.ts';
import { renderGame } from './game/render.ts';
import {
  createInitialState,
  DEATH_SLOWMO_FRAMES,
  deriveWorld,
  finishCurrentLap,
  getDeathMessage,
  isWon,
  LOOP_SECONDS,
  rewindStep,
  seekToFrame,
  stepSim,
  TICK_HZ,
  type InputState,
  type SimState,
} from './game/sim.ts';

const STORAGE_KEY = 'paradoxloop_completed_v1';

function loadCompletedLevels(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'play'>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [simState, setSimState] = useState<SimState>(() => createInitialState(0));
  const simRef = useRef<SimState>(simState);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const [showFuturePreview, setShowFuturePreview] = useState(true);
  const showFutureRef = useRef(showFuturePreview);
  showFutureRef.current = showFuturePreview;

  const [muted, setMuted] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>(loadCompletedLevels);
  const [modalMode, setModalMode] = useState<'levels' | 'rules' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    rewind: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
    rewind: false,
  });

  const prevPlatesCountRef = useRef(0);
  const prevLapRef = useRef(0);
  const prevDeadRef = useRef(false);
  const prevWonRef = useRef(false);

  const syncState = useCallback((next: SimState) => {
    simRef.current = next;
    setSimState(next);
  }, []);

  const resetLevel = useCallback(
    (targetIdx = levelIndex) => {
      const fresh = createInitialState(targetIdx);
      prevPlatesCountRef.current = 0;
      prevLapRef.current = 0;
      prevDeadRef.current = false;
      prevWonRef.current = false;
      setLevelIndex(targetIdx);
      setPaused(false);
      setScreen('play');
      syncState(fresh);
    },
    [levelIndex, syncState]
  );

  const handleFinishCurrentLap = useCallback(() => {
    const cur = simRef.current;
    const lvl = LEVELS[cur.levelIndex];
    if (cur.dead || isWon(cur) || cur.lap + 1 >= lvl.maxLaps) return;

    const next = finishCurrentLap(cur);
    if (next.lap > cur.lap) {
      sfx.lapNext();
      prevLapRef.current = next.lap;
    } else if (next.dead) {
      sfx.death();
      prevDeadRef.current = true;
    }
    setPaused(false);
    syncState(next);
  }, [syncState]);

  const handleRewindToLapStart = useCallback(() => {
    const cur = simRef.current;
    const next = seekToFrame(cur, cur.lap, 0);
    prevDeadRef.current = false;
    setPaused(false);
    syncState(next);
  }, [syncState]);

  const handleSeek = useCallback(
    (targetLap: number, targetT: number) => {
      if (simRef.current.dead) return;
      const next = seekToFrame(simRef.current, targetLap, targetT);
      prevDeadRef.current = false;
      prevWonRef.current = false;
      prevLapRef.current = next.lap;
      syncState(next);
    },
    [syncState]
  );

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !e.repeat) {
        if (modalMode !== null) {
          e.preventDefault();
          setModalMode(null);
          return;
        }
        if (screen === 'play') {
          e.preventDefault();
          setModalMode('levels');
          return;
        }
      }

      if (screen !== 'play' || modalMode !== null) return;

      const isFocusedButton =
        e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
      const code = e.code;

      if (code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        keysRef.current.up = true;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        keysRef.current.down = true;
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        e.preventDefault();
        keysRef.current.right = true;
      } else if (code === 'KeyR') {
        e.preventDefault();
        if (!simRef.current.dead) {
          keysRef.current.rewind = true;
        }
      } else if (code === 'Enter') {
        if (!e.repeat && !isFocusedButton) {
          e.preventDefault();
          handleFinishCurrentLap();
        }
      } else if (code === 'Space') {
        if (!isFocusedButton) {
          e.preventDefault();
          if (!e.repeat && !simRef.current.dead && !isWon(simRef.current)) {
            setPaused((p) => !p);
          }
        }
      } else if (code === 'Delete') {
        e.preventDefault();
        if (!e.repeat) resetLevel(simRef.current.levelIndex);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowUp' || code === 'KeyW') keysRef.current.up = false;
      else if (code === 'ArrowDown' || code === 'KeyS') keysRef.current.down = false;
      else if (code === 'ArrowLeft' || code === 'KeyA') keysRef.current.left = false;
      else if (code === 'ArrowRight' || code === 'KeyD') keysRef.current.right = false;
      else if (code === 'KeyR') keysRef.current.rewind = false;
    };

    const onBlur = () => {
      keysRef.current = { up: false, down: false, left: false, right: false, rewind: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleFinishCurrentLap, modalMode, resetLevel, screen]);

  // Fixed 60 Hz simulation & render loop
  useEffect(() => {
    if (screen !== 'play') return;

    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const fixedDt = 1000 / TICK_HZ;

    const loop = (now: number) => {
      const elapsed = Math.min(100, now - lastTime);
      lastTime = now;

      let state = simRef.current;
      const rewinding = keysRef.current.rewind && !state.dead;

      if (rewinding) {
        accumulator += elapsed;
        while (accumulator >= fixedDt) {
          state = rewindStep(state, 3);
          accumulator -= fixedDt;
        }
        prevDeadRef.current = false;
        prevWonRef.current = false;
        prevLapRef.current = state.lap;
        syncState(state);
      } else if (!pausedRef.current && modalMode === null) {
        const activeSpeed = state.dead ? 1 : speedRef.current;
        accumulator += elapsed * activeSpeed;
        const input: InputState = {
          up: keysRef.current.up,
          down: keysRef.current.down,
          left: keysRef.current.left,
          right: keysRef.current.right,
        };

        let stepped = false;
        let subSteps = 0;
        while (accumulator >= fixedDt && subSteps < 12) {
          const next = stepSim(state, input);
          if (next !== state) {
            state = next;
            stepped = true;
          }
          accumulator -= fixedDt;
          subSteps++;
        }

        if (stepped) {
          const world = deriveWorld(state);
          if (world.pressedPlates.size > prevPlatesCountRef.current) {
            sfx.plateOn();
          }
          prevPlatesCountRef.current = world.pressedPlates.size;

          if (state.lap > prevLapRef.current) {
            sfx.lapNext();
          }
          prevLapRef.current = state.lap;

          if (state.dead && !prevDeadRef.current) {
            sfx.death();
          }
          prevDeadRef.current = state.dead;

          if (world.won && !prevWonRef.current) {
            sfx.win();
            const lvlId = LEVELS[state.levelIndex].id;
            setCompletedLevels((prev) => {
              if (prev.includes(lvlId)) return prev;
              const updated = [...prev, lvlId];
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch {
                // ignore storage limits
              }
              return updated;
            });
          }
          prevWonRef.current = world.won;

          syncState(state);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGame(ctx, simRef.current, {
            showFuturePreview: showFutureRef.current,
            isRewinding: rewinding,
            isPaused: pausedRef.current,
          });
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [modalMode, screen, syncState]);

  const world = deriveWorld(simState);
  const { level, pressedPlates, openDoors, lasers, won } = world;
  const isTimeout = simState.dead && simState.cause === 'timeout';
  const showDeathCard =
    simState.dead && (isTimeout || simState.deathTimer >= DEATH_SLOWMO_FRAMES);
  const currentLapSeconds = (simState.t / TICK_HZ).toFixed(1);
  const lapColor = getLapColor(simState.lap);
  const lapCode = getLapCode(simState.lap);
  const canEndLapEarly = !simState.dead && !won && simState.lap + 1 < level.maxLaps;

  return (
    <div className="min-h-screen bg-[#14161a] text-[#f1f5f9] flex flex-col">
      {/* Top Bar: Brand — scalable navigation — 1 primary action */}
      <header className="border-b border-[#2a303a] bg-[#14161a] shrink-0">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setModalMode(null);
              setScreen('menu');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer hover:text-[#4cc9f0] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
          >
            Hold For Me
          </button>

          <nav
            aria-label="Navegación principal"
            className="hidden sm:flex items-center gap-5 text-xs font-medium text-slate-300"
          >
            <button
              type="button"
              onClick={() => {
                setModalMode(null);
                setScreen('menu');
              }}
              aria-current={screen === 'menu' ? 'page' : undefined}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer rounded px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0] ${
                screen === 'menu' ? 'text-[#4cc9f0]' : 'hover:text-white'
              }`}
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => setModalMode('levels')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer rounded px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
            >
              Niveles ({LEVELS.length})
            </button>
            <button
              type="button"
              onClick={() => setModalMode('rules')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer rounded px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
            >
              Reglas
            </button>

            {screen === 'play' && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-[#2a303a]">
                <button
                  type="button"
                  disabled={levelIndex <= 0}
                  onClick={() => resetLevel(levelIndex - 1)}
                  aria-label="Nivel anterior"
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-35 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4cc9f0]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono tabular-nums text-slate-200 px-1">
                  Nivel {level.id}/{LEVELS.length}
                </span>
                <button
                  type="button"
                  disabled={levelIndex + 1 >= LEVELS.length}
                  onClick={() => resetLevel(levelIndex + 1)}
                  aria-label="Siguiente nivel"
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-35 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4cc9f0]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {screen === 'menu' ? (
              <button
                type="button"
                onClick={() => resetLevel(0)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#4cc9f0] text-[#14161a] text-xs font-bold hover:bg-[#72d6f5] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Comenzar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => resetLevel(levelIndex)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232830] border border-[#2a303a] text-xs font-medium text-white hover:bg-[#2d333d] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar nivel
              </button>
            )}
          </div>
        </div>
      </header>

      {screen === 'menu' ? (
        <TitleMenu
          completedLevels={completedLevels}
          onStart={(idx = 0) => resetLevel(idx)}
          onOpenRules={() => setModalMode('rules')}
        />
      ) : (
        <main className="flex-1 w-full max-w-[1008px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[960px] space-y-2">
            {/* Level Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-semibold text-white">
                    Nivel {level.id}: {level.name}
                  </h1>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span
                    className="text-xs sm:text-sm font-mono tabular-nums font-semibold"
                    style={{ color: lapColor }}
                  >
                    {lapCode} ({simState.lap + 1}/{level.maxLaps})
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-xs sm:text-sm font-mono tabular-nums text-slate-300">
                    {currentLapSeconds} s / {LOOP_SECONDS.toFixed(1)} s
                  </span>
                  <span className="hidden lg:inline-flex items-center gap-1 ml-1" aria-hidden="true">
                    {Array.from({ length: level.maxLaps }).map((_, idx) => {
                      const c = getLapColor(idx);
                      const active = idx === simState.lap;
                      const past = idx < simState.lap;
                      return (
                        <span
                          key={idx}
                          className="h-1.5 w-3.5 rounded-xs transition-opacity"
                          style={{
                            backgroundColor: c,
                            opacity: active ? 1 : past ? 0.65 : 0.2,
                          }}
                        />
                      );
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{level.subtitle}</p>
              </div>

              {/* Functional controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {canEndLapEarly && (
                  <button
                    type="button"
                    onClick={handleFinishCurrentLap}
                    title="Fija tu posición actual hasta los 20 s y pasa directo a la siguiente vuelta (Enter)"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4cc9f0] text-[#14161a] text-xs font-semibold hover:bg-[#72d6f5] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    Terminar vuelta
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-pressed={paused}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1c2026] border border-[#2a303a] text-xs font-medium text-slate-200 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
                >
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  {paused ? 'Reanudar' : 'Pausar'}
                </button>

                <div
                  className="flex items-center p-0.5 rounded-lg bg-[#1c2026] border border-[#2a303a]"
                  role="group"
                  aria-label="Velocidad de simulación"
                >
                  {([1, 2, 4] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      aria-pressed={speed === s}
                      className={`px-2 py-1 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4cc9f0] ${
                        speed === s ? 'bg-[#2a303a] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFuturePreview((v) => !v)}
                  aria-pressed={showFuturePreview}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0] ${
                    showFuturePreview
                      ? 'bg-[#1c2026] border-[#4cc9f0]/50 text-[#4cc9f0]'
                      : 'bg-[#1c2026] border-[#2a303a] text-slate-400 hover:text-white'
                  }`}
                >
                  {showFuturePreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Futuro +2s
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !muted;
                    sfx.muted = nextMuted;
                    setMuted(nextMuted);
                  }}
                  aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
                  aria-pressed={muted}
                  className="p-1.5 rounded-lg bg-[#1c2026] border border-[#2a303a] text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Minimalist Hint & Live State Feedback Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#1c2026] border border-[#2a303a] px-3 py-1.5 text-xs">
              <p className="text-slate-300 leading-snug">
                <span className="font-semibold text-[#4cc9f0] mr-1.5">Pista:</span>
                {level.hint}
              </p>

              {(level.plates.length > 0 || level.doors.length > 0 || lasers.length > 0) && (
                <div
                  className="flex flex-wrap items-center gap-2 font-mono tabular-nums text-[11px] shrink-0"
                  aria-label="Estado de mecanismos del nivel"
                >
                  {level.plates.map((plate) => {
                    const active = pressedPlates.has(plate.id);
                    return (
                      <span
                        key={plate.id}
                        className={`px-1.5 py-0.5 rounded border ${
                          active
                            ? 'bg-[#8ecae6]/15 border-[#8ecae6]/60 text-white'
                            : 'bg-[#14161a] border-[#2a303a] text-slate-400'
                        }`}
                      >
                        Placa {plate.label}: {active ? 'Activa' : 'Libre'}
                      </span>
                    );
                  })}
                  {level.doors.map((door) => {
                    const isOpen = openDoors.has(door.id);
                    return (
                      <span
                        key={door.id}
                        className={`px-1.5 py-0.5 rounded border ${
                          isOpen
                            ? 'bg-[#80ed99]/15 border-[#80ed99]/50 text-[#80ed99]'
                            : 'bg-[#14161a] border-[#2a303a] text-slate-400'
                        }`}
                      >
                        {door.id}: {isOpen ? 'Abierta' : 'Cerrada'}
                      </span>
                    );
                  })}
                  {lasers.map((seg) => (
                    <span
                      key={seg.id}
                      className={`px-1.5 py-0.5 rounded border ${
                        !seg.powered
                          ? 'bg-[#14161a] border-[#2a303a] text-slate-400'
                          : !seg.enabled
                            ? 'bg-[#80ed99]/15 border-[#80ed99]/50 text-[#80ed99]'
                            : seg.blockedByLap !== null
                              ? 'bg-[#ffd166]/15 border-[#ffd166]/60 text-[#ffd166]'
                              : 'bg-[#ff3b3b]/15 border-[#ff3b3b]/60 text-[#fca5a5]'
                      }`}
                    >
                      {seg.id}:{' '}
                      {!seg.powered
                        ? 'Apagado'
                        : !seg.enabled
                          ? 'Deshabilitado'
                          : seg.blockedByLap !== null
                            ? `Bloqueado (${getLapCode(seg.blockedByLap)})`
                            : 'Activo'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Canvas Container (960x400 logical aspect 12:5) */}
            <div className="relative w-full aspect-[12/5] rounded-xl border border-[#2a303a] bg-[#14161a] overflow-hidden shadow-xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                aria-label={`Tablero del nivel ${level.id}: ${level.name}`}
                className="w-full h-full block"
              />

              {/* Death / Loss Card */}
              {showDeathCard && (
                <div
                  role="alertdialog"
                  aria-live="assertive"
                  aria-labelledby="death-title"
                  className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-md rounded-xl bg-[#1c2026] border border-[#ff3b3b]/60 p-5 shadow-2xl">
                    <div className="text-xs font-mono tabular-nums text-[#fca5a5]">
                      {isTimeout
                        ? `Derrota · ${lapCode} (${simState.lap + 1} de ${level.maxLaps})`
                        : `${lapCode} · ${currentLapSeconds} s`}
                    </div>
                    <h2 id="death-title" className="mt-1 text-xl font-bold text-white">
                      {isTimeout ? 'Te quedaste sin tiempo' : getDeathMessage(simState)}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                      {isTimeout
                        ? 'Se terminó el loop antes de alcanzar la meta. Elegí reiniciar esta vuelta o empezar el nivel de nuevo.'
                        : 'La vuelta se interrumpió antes de llegar a la meta. Elegí reiniciar esta vuelta o empezar el nivel de nuevo.'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRewindToLapStart}
                        className="px-4 py-2 rounded-lg bg-[#4cc9f0] text-[#14161a] text-sm font-semibold hover:bg-[#72d6f5] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
                      >
                        Reiniciar vuelta
                      </button>
                      <button
                        type="button"
                        onClick={() => resetLevel(levelIndex)}
                        className="px-4 py-2 rounded-lg bg-[#232830] border border-[#2a303a] text-sm font-medium text-white hover:bg-[#2d333d] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
                      >
                        Reiniciar nivel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Victory Card */}
              {won && (
                <div
                  role="dialog"
                  aria-live="polite"
                  aria-labelledby="win-title"
                  className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-md rounded-xl bg-[#1c2026] border border-[#ffb703]/60 p-5 shadow-2xl">
                    <div className="text-xs font-mono tabular-nums text-[#ffb703]">
                      {levelIndex + 1 >= LEVELS.length ? 'Campaña completada · ' : ''}
                      Nivel {level.id} resuelto · {simState.lap + 1}{' '}
                      {simState.lap === 0 ? 'vuelta' : 'vueltas'}
                    </div>
                    <h2 id="win-title" className="mt-1 text-xl font-bold text-white">
                      {levelIndex + 1 >= LEVELS.length
                        ? '¡Última coordinación completada!'
                        : `¡Nivel ${level.id} completado!`}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                      {levelIndex + 1 >= LEVELS.length
                        ? `Completaste los ${LEVELS.length} niveles. El presente encontró el hueco que dejó tu historia.`
                        : 'El presente encontró el hueco que dejó tu historia.'}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {levelIndex + 1 < LEVELS.length ? (
                        <button
                          type="button"
                          onClick={() => resetLevel(levelIndex + 1)}
                          className="px-4 py-2 rounded-lg bg-[#ffb703] text-[#14161a] text-sm font-semibold hover:bg-[#ffc633] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb703]"
                        >
                          Siguiente nivel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => resetLevel(0)}
                          className="px-4 py-2 rounded-lg bg-[#ffb703] text-[#14161a] text-sm font-semibold hover:bg-[#ffc633] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb703]"
                        >
                          Volver a jugar desde el 1
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setModalMode('levels')}
                        className="px-4 py-2 rounded-lg bg-[#232830] border border-[#2a303a] text-sm font-medium text-white hover:bg-[#2d333d] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc9f0]"
                      >
                        Selector de niveles
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Sequence / Moving Laser / Segment HUD (only shown if level declares them) */}
            <FutureMechanicsLegend world={world} />

            {/* Interactive Timeline */}
            <TimelineBar
              state={simState}
              maxLaps={level.maxLaps}
              disabled={simState.dead}
              onSeek={handleSeek}
            />

            {/* Quiet 1-line controls legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-2.5">
                <span>Mover: WASD / Flechas</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Terminar vuelta: Enter</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Pausar: Espacio</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Rebobinar: Mantener R</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Reiniciar: Supr</span>
              </div>
              <div className="text-slate-500">El presente es blando. El pasado es duro.</div>
            </div>
          </div>
        </main>
      )}

      <LevelSelectorModal
        isOpen={modalMode !== null}
        mode={modalMode ?? 'levels'}
        currentLevelIndex={levelIndex}
        completedLevels={completedLevels}
        onSelectLevel={(idx) => resetLevel(idx)}
        onClose={() => setModalMode(null)}
      />
    </div>
  );
}
